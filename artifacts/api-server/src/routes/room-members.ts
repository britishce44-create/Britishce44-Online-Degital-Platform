import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, roomMembers, classrooms, appUsers } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

const joinNumber = (r: { id: number; roomId: number | null }) => r.roomId ?? r.id;

async function resolveRoomLabel(roomId: number): Promise<string | null> {
  const cs = await db.select().from(classrooms).where(eq(classrooms.active, true));
  const found = cs.find((c) => joinNumber(c) === roomId);
  return found?.label ?? null;
}

// Full membership list — used by the Classrooms settings sidebar.
router.get(
  "/v1/room-members",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (_req, res) => {
    const rows = await db.select().from(roomMembers).orderBy(roomMembers.id);
    return res.json({ members: rows });
  },
);

// Roster for one room (joinable room number) — used by the in-class
// participants list to show assigned-but-offline students/teachers.
router.get("/v1/rooms/:roomId/members", requireAuth, async (req, res) => {
  const roomId = Number(req.params.roomId);
  if (!roomId) return res.status(400).json({ message: "roomId required" });
  const rows = await db
    .select()
    .from(roomMembers)
    .where(eq(roomMembers.roomId, roomId));
  return res.json({ roomId, members: rows });
});

// Assign a student/teacher to a room. A user can belong to only one room at a
// time — any existing assignment is moved to the new room.
router.post(
  "/v1/room-members",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const { roomId, userId } = req.body ?? {};
    const rId = Number(roomId);
    const uId = Number(userId);
    if (!rId || !uId)
      return res.status(400).json({ message: "roomId and userId required" });

    const [user] = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, uId))
      .limit(1);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "student" && user.role !== "teacher")
      return res
        .status(400)
        .json({ message: "Only students and teachers can be assigned to a room" });

    const role = user.role === "teacher" ? "teacher" : "student";

    // Move: clear any prior assignment first.
    await db.delete(roomMembers).where(eq(roomMembers.userId, uId));

    const [row] = await db
      .insert(roomMembers)
      .values({
        roomId: rId,
        userId: uId,
        userName: user.name,
        email: user.email ?? null,
        role,
      })
      .returning();
    return res.status(201).json({ member: row });
  },
);

// Remove a user from their room.
router.delete(
  "/v1/room-members/:id",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const id = Number(req.params.id);
    const [row] = await db
      .delete(roomMembers)
      .where(eq(roomMembers.id, id))
      .returning();
    if (!row) return res.status(404).json({ message: "Membership not found" });
    return res.json({ ok: true, member: row });
  },
);

// Assigned room of the currently logged-in user — used by the Student App so
// it always joins the room it was assigned to from the Classrooms settings.
router.get("/v1/me/room", requireAuth, async (req, res) => {
  if (!req.user?.email) return res.json({ roomId: null });
  const [u] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, req.user.email))
    .limit(1);
  if (!u) return res.json({ roomId: null });
  const [m] = await db
    .select()
    .from(roomMembers)
    .where(eq(roomMembers.userId, u.id))
    .limit(1);
  if (!m) return res.json({ roomId: null });
  const label = await resolveRoomLabel(m.roomId);
  return res.json({ roomId: m.roomId, label, role: m.role });
});

export default router;