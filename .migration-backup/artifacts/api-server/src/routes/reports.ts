import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  reports,
  students,
  courses,
  teachers,
  assessmentSheets,
  evalSheets,
  type Report,
} from "@workspace/db";
import {
  requireAuth,
  requireRole,
  isStaff,
  teacherCourseIds,
  type AuthUser,
} from "../lib/auth";
import { generateReportsForSheet } from "../lib/reports";
import { deliverReport, flushPendingDeliveries } from "../lib/google";

const router: IRouter = Router();

async function scopeReports(
  user: AuthUser,
  rows: Report[],
): Promise<Report[]> {
  if (isStaff(user)) return rows;
  if (user.role === "teacher") {
    const ids = await teacherCourseIds(user);
    return rows.filter(
      (r) =>
        (r.kind === "student" &&
          r.audience === "teacher" &&
          r.courseId != null &&
          ids.includes(r.courseId)) ||
        (r.kind === "teacher_eval" &&
          r.evalTeacherId != null &&
          r.evalTeacherId === user.teacherId),
    );
  }
  if (user.role === "parent" && user.parentId) {
    const kids = await db
      .select()
      .from(students)
      .where(eq(students.parentId, user.parentId));
    const kidIds = new Set(kids.map((k) => k.id));
    return rows.filter(
      (r) =>
        r.kind === "student" &&
        r.audience === "parent" &&
        r.studentId != null &&
        kidIds.has(r.studentId),
    );
  }
  return [];
}

router.get("/v1/reports", requireAuth, async (req, res) => {
  const u = req.user!;
  const sheetId = req.query.sheetId ? Number(req.query.sheetId) : null;
  const evalSheetId = req.query.evalSheetId
    ? Number(req.query.evalSheetId)
    : null;
  const kind = typeof req.query.kind === "string" ? req.query.kind : null;
  let rows = await db.select().from(reports).orderBy(desc(reports.createdAt));
  if (sheetId) rows = rows.filter((r) => r.sheetId === sheetId);
  if (evalSheetId) rows = rows.filter((r) => r.evalSheetId === evalSheetId);
  if (kind) rows = rows.filter((r) => r.kind === kind);
  rows = await scopeReports(u, rows);

  const studs = await db.select().from(students);
  const studMap = new Map(studs.map((s) => [s.id, s.name]));
  const crs = await db.select().from(courses);
  const crsMap = new Map(crs.map((c) => [c.id, c.name]));
  const tch = await db.select().from(teachers);
  const tchMap = new Map(tch.map((t) => [t.id, t.name]));
  const out = rows.map((r) => ({
    ...r,
    studentName: r.studentId != null ? studMap.get(r.studentId) ?? null : null,
    courseName: r.courseId != null ? crsMap.get(r.courseId) ?? null : null,
    teacherName:
      r.evalTeacherId != null ? tchMap.get(r.evalTeacherId) ?? null : null,
  }));
  return res.json({ reports: out });
});

router.post("/v1/reports/generate", requireAuth, async (req, res) => {
  const u = req.user!;
  const sheetId = Number(req.body?.sheetId);
  if (!sheetId) return res.status(400).json({ message: "sheetId required" });
  const [sheet] = await db
    .select()
    .from(assessmentSheets)
    .where(eq(assessmentSheets.id, sheetId))
    .limit(1);
  if (!sheet) return res.status(404).json({ message: "sheet not found" });
  if (!isStaff(u) && !(await teacherCourseIds(u)).includes(sheet.courseId))
    return res.status(403).json({ message: "No access" });
  const r = await generateReportsForSheet(sheetId);
  return res.json(r);
});

router.patch(
  "/v1/reports/:id",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { body, level, recipientEmail } = req.body ?? {};
    const set: Record<string, unknown> = {
      updatedAt: new Date(),
      status: "edited",
    };
    if (body !== undefined) set.body = body;
    if (level !== undefined) set.level = level;
    if (recipientEmail !== undefined) set.recipientEmail = recipientEmail;
    const [row] = await db
      .update(reports)
      .set(set)
      .where(eq(reports.id, id))
      .returning();
    return res.json({ report: row });
  },
);

router.post("/v1/reports/flush", requireAuth, requireRole("admin", "supervisor"), async (_req, res) => {
  return res.json(await flushPendingDeliveries());
});

router.post(
  "/v1/reports/send-sheet",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const sheetId = Number(req.body?.sheetId);
    const [sheet] = await db
      .select()
      .from(assessmentSheets)
      .where(eq(assessmentSheets.id, sheetId))
      .limit(1);
    if (!sheet) return res.status(404).json({ message: "sheet not found" });
    const rows = await db
      .select()
      .from(reports)
      .where(eq(reports.sheetId, sheetId));
    for (const r of rows) await deliverReport(r, sheet.termLabel);
    return res.json({ sent: rows.length });
  },
);

router.post(
  "/v1/reports/:id/send",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const id = Number(req.params.id);
    const [r] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    if (!r) return res.status(404).json({ message: "not found" });
    let termLabel = "Term";
    if (r.kind === "teacher_eval" && r.evalSheetId != null) {
      const [es] = await db
        .select()
        .from(evalSheets)
        .where(eq(evalSheets.id, r.evalSheetId))
        .limit(1);
      termLabel = es?.termLabel ?? "Term";
    } else if (r.sheetId != null) {
      const [sheet] = await db
        .select()
        .from(assessmentSheets)
        .where(eq(assessmentSheets.id, r.sheetId))
        .limit(1);
      termLabel = sheet?.termLabel ?? "Term";
    }
    const result = await deliverReport(r, termLabel);
    return res.json(result);
  },
);

export default router;
