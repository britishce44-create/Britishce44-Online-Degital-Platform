import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, appUsers, sessions } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

const ALL_PERMISSIONS = [
  "classrooms", "exams", "messenger", "homework",
  "reports", "recordings", "placements", "analytics",
  "settings", "users", "assessment", "attendance", "results",
  "videoeditor", "marketing", "ailearning", "parentportal",
];

const DASHBOARD_WIDGETS = [
  "overview", "courses", "schedule", "tasks",
  "notifications", "recentActivity", "performance",
  "attendance", "messages", "announcements",
];

router.get("/v1/users", requireAuth, requireRole("admin", "supervisor"), async (_req, res) => {
  const rows = await db.select().from(appUsers).orderBy(asc(appUsers.id));
  return res.json({ users: rows.map(({ password, ...u }) => u) });
});

router.get("/v1/users/:id", requireAuth, requireRole("admin", "supervisor"), async (req, res) => {
  const [row] = await db.select().from(appUsers).where(eq(appUsers.id, Number(req.params.id))).limit(1);
  if (!row) return res.status(404).json({ message: "User not found" });
  const { password, ...data } = row;
  return res.json({ user: data });
});

router.post("/v1/users", requireAuth, requireRole("admin", "supervisor"), async (req, res) => {
  const { email, password, name, role, phone, status, permissions, accessFrom, accessTo, dashboardConfig } = req.body ?? {};
  if (!email || !password || !name || !role) return res.status(400).json({ message: "email, password, name, role required" });
  const [existing] = await db.select().from(appUsers).where(eq(appUsers.email, email)).limit(1);
  if (existing) return res.status(409).json({ message: "Email already exists" });
  const [row] = await db.insert(appUsers).values({
    email, password, name, role, phone: phone ?? "", status: status ?? "active",
    permissions: permissions ?? [],
    accessFrom: accessFrom ?? "00:00", accessTo: accessTo ?? "23:59",
    dashboardConfig: dashboardConfig ?? {},
  }).returning();
  const { password: _, ...user } = row;
  return res.status(201).json({ user });
});

router.patch("/v1/users/:id", requireAuth, requireRole("admin", "supervisor"), async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["name", "email", "phone", "role", "status", "permissions", "accessFrom", "accessTo", "dashboardConfig"];
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (req.body[k] !== undefined) set[k] = req.body[k];
  }
  const [row] = await db.update(appUsers).set(set).where(eq(appUsers.id, id)).returning();
  if (!row) return res.status(404).json({ message: "User not found" });
  const { password, ...user } = row;
  return res.json({ user });
});

router.delete("/v1/users/:id", requireAuth, requireRole("admin", "supervisor"), async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  if (!row) return res.status(404).json({ message: "User not found" });
  await db.delete(sessions).where(eq(sessions.email, row.email));
  await db.delete(appUsers).where(eq(appUsers.id, id));
  return res.json({ ok: true });
});

router.patch("/v1/users/:id/password", requireAuth, requireRole("admin", "supervisor"), async (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body ?? {};
  if (!password || password.length < 4) return res.status(400).json({ message: "Password must be at least 4 characters" });
  const [row] = await db.update(appUsers).set({ password, updatedAt: new Date() }).where(eq(appUsers.id, id)).returning();
  if (!row) return res.status(404).json({ message: "User not found" });
  return res.json({ ok: true, message: "Password updated" });
});

router.patch("/v1/users/:id/dashboard", requireAuth, requireRole("admin", "supervisor"), async (req, res) => {
  const id = Number(req.params.id);
  const { dashboardConfig } = req.body ?? {};
  if (!dashboardConfig) return res.status(400).json({ message: "dashboardConfig required" });
  const [row] = await db.update(appUsers).set({ dashboardConfig, updatedAt: new Date() }).where(eq(appUsers.id, id)).returning();
  if (!row) return res.status(404).json({ message: "User not found" });
  const { password, ...user } = row;
  return res.json({ user });
});

export { ALL_PERMISSIONS, DASHBOARD_WIDGETS };
export default router;
