import { Router, type IRouter, type Request } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  classroomSessions,
  classroomAntiCheatLogs,
  classroomLocker,
  notifications,
  students,
  appUsers,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getReqUser(req: Request) {
  return (req as any).user ?? null;
}

/* ── Session management ── */

// Start a classroom session
router.post("/v1/classroom-sessions", requireAuth, async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Teacher/admin only" });
  const { classroomId, roomId, antiCheatActive } = req.body ?? {};
  if (!roomId) return res.status(400).json({ message: "roomId required" });
  const [row] = await db
    .insert(classroomSessions)
    .values({
      classroomId: classroomId ? Number(classroomId) : null,
      roomId: Number(roomId),
      teacherId: null,
      antiCheatActive: !!antiCheatActive,
    })
    .returning();
  return res.json({ session: row });
});

// End a session
router.patch("/v1/classroom-sessions/:id/end", requireAuth, async (req, res) => {
  const [row] = await db
    .update(classroomSessions)
    .set({ endedAt: new Date() })
    .where(eq(classroomSessions.id, Number(req.params.id)))
    .returning();
  return res.json({ session: row });
});

// Toggle anti-cheat on a session
router.patch("/v1/classroom-sessions/:id/anti-cheat", requireAuth, async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Teacher/admin only" });
  const { active } = req.body ?? {};
  const [row] = await db
    .update(classroomSessions)
    .set({ antiCheatActive: !!active })
    .where(eq(classroomSessions.id, Number(req.params.id)))
    .returning();
  return res.json({ session: row });
});

/* ── Anti-cheat logs ── */

// Log a violation
router.post("/v1/classroom-sessions/:id/anti-cheat/log", requireAuth, async (req, res) => {
  const sessionId = Number(req.params.id);
  const { studentId, studentName, eventType, details, warningCount, blocked } = req.body ?? {};
  if (!eventType) return res.status(400).json({ message: "eventType required" });
  const [row] = await db
    .insert(classroomAntiCheatLogs)
    .values({
      sessionId,
      studentId: studentId ? Number(studentId) : null,
      studentName: studentName || null,
      eventType,
      details: details || null,
      warningCount: warningCount || 0,
      blocked: !!blocked,
    })
    .returning();
  return res.json({ log: row });
});

// Get all violations for a session
router.get("/v1/classroom-sessions/:id/anti-cheat/logs", requireAuth, async (req, res) => {
  const logs = await db
    .select()
    .from(classroomAntiCheatLogs)
    .where(eq(classroomAntiCheatLogs.sessionId, Number(req.params.id)))
    .orderBy(desc(classroomAntiCheatLogs.createdAt));
  return res.json({ logs });
});

// Block a student (after 3 warnings) + send notification
router.post("/v1/classroom-sessions/:id/block-student", requireAuth, async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Teacher/admin only" });
  const sessionId = Number(req.params.id);
  const { studentId, studentName } = req.body ?? {};
  // Log the block
  await db.insert(classroomAntiCheatLogs).values({
    sessionId,
    studentId: studentId ? Number(studentId) : null,
    studentName: studentName || null,
    eventType: "blocked",
    details: { reason: "Exceeded 3 anti-cheat warnings" },
    warningCount: 3,
    blocked: true,
  });
  // Send notification to the student
  if (studentName) {
    try {
      await db.insert(notifications).values({
        kind: "anti_cheat_block",
        title: "Anti-Cheat: You have been moved",
        body: `${studentName}, you received 3 warnings during class and have been moved to speak with the academic supervisor. Please reflect on the importance of academic honesty.`,
        audience: "student",
        recipientEmail: null,
        createdAt: new Date(),
      });
    } catch {}
  }
  logger.info({ sessionId, studentName }, "Student blocked for anti-cheat violations");
  return res.json({ ok: true, blocked: true });
});

/* ── Classroom Locker ── */

// List locker items for a classroom
router.get("/v1/classroom-locker/:roomId", requireAuth, async (req, res) => {
  const roomId = Number(req.params.roomId);
  const items = await db
    .select()
    .from(classroomLocker)
    .where(eq(classroomLocker.roomId, roomId))
    .orderBy(desc(classroomLocker.createdAt));
  return res.json({ items });
});

// Add a locker item
router.post("/v1/classroom-locker", requireAuth, async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });
  const { classroomId, roomId, studentId, itemType, title, body, fileUrl } = req.body ?? {};
  if (!title) return res.status(400).json({ message: "title required" });
  const [row] = await db
    .insert(classroomLocker)
    .values({
      classroomId: classroomId ? Number(classroomId) : null,
      roomId: roomId ? Number(roomId) : null,
      studentId: studentId ? Number(studentId) : null,
      itemType: itemType || "material",
      title,
      body: body || null,
      fileUrl: fileUrl || null,
      createdBy: user.name || user.email,
    })
    .returning();
  return res.json({ item: row });
});

// Delete a locker item
router.delete("/v1/classroom-locker/:id", requireAuth, async (req, res) => {
  await db.delete(classroomLocker).where(eq(classroomLocker.id, Number(req.params.id)));
  return res.json({ ok: true });
});

export default router;
