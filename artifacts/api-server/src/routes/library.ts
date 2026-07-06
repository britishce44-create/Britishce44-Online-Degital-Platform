import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { db, libraryItems, libraryPermissions, appUsers } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads/library");
try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}

// Multer storage: UUID filenames to keep URLs unguessable.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const id = crypto.randomUUID();
    cb(null, `${id}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

function getReqUser(req: Request): { id: string; role: string; email: string; name: string } | null {
  return (req as any).user ?? null;
}

// Check if a user has library access (no row = allowed by default)
async function hasLibraryAccess(userId: number): Promise<boolean> {
  const [perm] = await db
    .select()
    .from(libraryPermissions)
    .where(eq(libraryPermissions.userId, userId))
    .limit(1);
  return perm?.access !== "ban";
}

// Middleware: require auth + library access
const libraryAccess = [requireAuth, async (req: Request, res: Response, next: any) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });
  // Admin/supervisor always have access
  if (user.role === "admin" || user.role === "supervisor") return next();
  // Check ban status for other users
  const userId = Number(user.id);
  if (isNaN(userId)) return next(); // in-memory users without numeric id
  const allowed = await hasLibraryAccess(userId);
  if (!allowed) return res.status(403).json({ message: "Library access denied" });
  next();
}];

/* ── List items in a room ── */
router.get("/v1/library/rooms/:roomId/items", libraryAccess, async (req, res) => {
  const roomId = req.params.roomId;
  const items = await db
    .select()
    .from(libraryItems)
    .where(eq(libraryItems.roomId, roomId))
    .orderBy(libraryItems.createdAt);
  return res.json({
    items: items
      .filter((i) => i.active)
      .map((i) => ({
        ...i,
        fileUrl: `/uploads/${i.filePath}`,
        downloadUrl: `/uploads/${i.filePath}`,
      })),
  });
});

/* ── Upload a file (admin/teacher only) ── */
router.post(
  "/v1/library/upload",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    const user = getReqUser(req);
    if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
      return res.status(403).json({ message: "Only admins and teachers can upload" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { roomId, title, description, type } = req.body;
    if (!roomId || !title) return res.status(400).json({ message: "roomId and title required" });

    const filePath = req.file.filename; // just the filename (UUID + ext)
    const [row] = await db
      .insert(libraryItems)
      .values({
        roomId,
        title,
        description: description || null,
        type: type || "mp4",
        mimeType: req.file.mimetype,
        size: req.file.size,
        filePath,
        fileName: req.file.originalname,
        uploadedBy: user.name || user.email,
      })
      .returning();

    logger.info({ roomId, title, size: req.file.size }, "Library item uploaded");
    return res.json({
      item: {
        ...row,
        fileUrl: `/uploads/${row.filePath}`,
        downloadUrl: `/uploads/${row.filePath}`,
      },
    });
  },
);

/* ── Delete an item (admin/teacher only) ── */
router.delete("/v1/library/items/:id", requireAuth, async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Only admins and teachers can delete" });
  const id = Number(req.params.id);
  const [item] = await db.select().from(libraryItems).where(eq(libraryItems.id, id)).limit(1);
  if (!item) return res.status(404).json({ message: "Item not found" });
  // Delete the file from disk
  try {
    const fullPath = path.resolve(UPLOADS_DIR, item.filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {}
  await db.delete(libraryItems).where(eq(libraryItems.id, id));
  return res.json({ ok: true });
});

/* ── Increment download count ── */
router.post("/v1/library/items/:id/download", libraryAccess, async (req, res) => {
  const id = Number(req.params.id);
  const [item] = await db.select().from(libraryItems).where(eq(libraryItems.id, id)).limit(1);
  if (!item) return res.status(404).json({ message: "Item not found" });
  await db
    .update(libraryItems)
    .set({ downloads: item.downloads + 1 })
    .where(eq(libraryItems.id, id));
  return res.json({ ok: true, downloads: item.downloads + 1 });
});

/* ── Get all library permissions (admin only) ── */
router.get("/v1/library/permissions", requireAuth, async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Admin only" });
  const perms = await db.select().from(libraryPermissions);
  return res.json({ permissions: perms });
});

/* ── Set a user's library permission (admin only) ── */
router.post("/v1/library/permissions", requireAuth, async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Admin only" });
  const { userId, access } = req.body;
  if (!userId || !["allow", "ban"].includes(access))
    return res.status(400).json({ message: "userId and access (allow|ban) required" });
  await db
    .insert(libraryPermissions)
    .values({ userId: Number(userId), access, setBy: user.name || user.email })
    .onConflictDoUpdate({
      target: [libraryPermissions.userId],
      set: { access, setBy: user.name || user.email, updatedAt: new Date() },
    });
  return res.json({ ok: true });
});

/* ── Check current user's library access ── */
router.get("/v1/library/my-access", requireAuth, async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.json({ access: "ban" });
  if (user.role === "admin" || user.role === "supervisor") return res.json({ access: "allow" });
  const userId = Number(user.id);
  if (isNaN(userId)) return res.json({ access: "allow" });
  const [perm] = await db
    .select()
    .from(libraryPermissions)
    .where(eq(libraryPermissions.userId, userId))
    .limit(1);
  return res.json({ access: perm?.access === "ban" ? "ban" : "allow" });
});

export default router;
