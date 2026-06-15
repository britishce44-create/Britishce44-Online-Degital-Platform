import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  tasks,
  notifications,
  calendarEvents,
  messages,
  students,
} from "@workspace/db";
import {
  requireAuth,
  requireRole,
  isStaff,
  teacherCourseIds,
} from "../lib/auth";
import { googleStatus } from "../lib/google";
import { tick, weeklyEvalTick } from "../lib/scheduler";

const router: IRouter = Router();

// Tasks
router.get("/v1/tasks", requireAuth, async (req, res) => {
  const u = req.user!;
  let rows = await db.select().from(tasks).orderBy(tasks.dueDate);
  if (!isStaff(u)) {
    if (u.role === "teacher")
      rows = rows.filter(
        (t) => t.assigneeType === "teacher" && t.assigneeId === u.teacherId,
      );
    else rows = [];
  }
  return res.json({ tasks: rows });
});

router.patch("/v1/tasks/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!["pending", "done"].includes(status))
    return res.status(400).json({ message: "invalid status" });
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!t) return res.status(404).json({ message: "not found" });
  const u = req.user!;
  if (!isStaff(u) && !(u.role === "teacher" && t.assigneeId === u.teacherId))
    return res.status(403).json({ message: "no access" });
  const [row] = await db
    .update(tasks)
    .set({ status })
    .where(eq(tasks.id, id))
    .returning();
  return res.json({ task: row });
});

// Notifications
router.get("/v1/notifications", requireAuth, async (req, res) => {
  const u = req.user!;
  const rows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  const filtered = rows.filter((n) => {
    const role = n.audienceRole;
    const roleOk =
      !role ||
      role === "all" ||
      role === u.role ||
      (isStaff(u) && role === "admin");
    const emailOk = !n.recipientEmail || n.recipientEmail === u.email;
    return roleOk && emailOk;
  });
  return res.json({ notifications: filtered });
});

router.post("/v1/notifications/:id/read", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  return res.json({ ok: true });
});

// Calendar
router.get("/v1/calendar", requireAuth, async (req, res) => {
  const u = req.user!;
  let rows = await db.select().from(calendarEvents).orderBy(calendarEvents.date);
  if (!isStaff(u)) {
    let ids: number[] = [];
    if (u.role === "teacher") ids = await teacherCourseIds(u);
    else if (u.role === "parent" && u.parentId) {
      const kids = await db
        .select()
        .from(students)
        .where(eq(students.parentId, u.parentId));
      ids = [
        ...new Set(
          kids.map((k) => k.courseId).filter((x): x is number => x != null),
        ),
      ];
    }
    rows = rows.filter((e) => e.courseId == null || ids.includes(e.courseId));
  }
  return res.json({ events: rows });
});

// Messages (messenger)
router.get("/v1/messages", requireAuth, async (req, res) => {
  const u = req.user!;
  let rows = await db
    .select()
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(100);
  if (!isStaff(u))
    rows = rows.filter(
      (m) =>
        (m.toEmail && m.toEmail === u.email) ||
        (m.toRole && m.toRole === u.role),
    );
  return res.json({ messages: rows.reverse() });
});

// Google connection status
router.get("/v1/google/status", requireAuth, async (_req, res) => {
  return res.json(await googleStatus());
});

// Manual scheduler trigger (staff) — for testing the fan-out / milestone logic.
router.post(
  "/v1/scheduler/tick",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (_req, res) => {
    return res.json(await tick());
  },
);

// Manual weekly teacher-evaluation reminder trigger (staff). Cron fires this
// every Thursday; this lets the academic test it on demand.
router.post(
  "/v1/scheduler/eval-tick",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (_req, res) => {
    return res.json(await weeklyEvalTick());
  },
);

export default router;
