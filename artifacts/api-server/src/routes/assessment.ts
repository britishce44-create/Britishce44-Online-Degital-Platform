import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import {
  db,
  courses,
  teachers,
  students,
  parents,
  criteria,
  assessmentSheets,
  assessmentScores,
  reports,
  tasks,
  type Course,
} from "@workspace/db";
import {
  requireAuth,
  requireRole,
  isStaff,
  teacherCourseIds,
  type AuthUser,
} from "../lib/auth";
import { generateReportsForSheet } from "../lib/reports";
import { deliverReport } from "../lib/google";

const router: IRouter = Router();

async function canAccessCourse(
  user: AuthUser,
  courseId: number,
): Promise<boolean> {
  if (isStaff(user)) return true;
  if (user.role === "teacher")
    return (await teacherCourseIds(user)).includes(courseId);
  return false;
}

// List courses the user may assess.
router.get("/v1/assessment/courses", requireAuth, async (req, res) => {
  const user = req.user!;
  let rows: Course[] = [];
  if (isStaff(user)) rows = await db.select().from(courses);
  else if (user.role === "teacher" && user.teacherId)
    rows = await db
      .select()
      .from(courses)
      .where(eq(courses.teacherId, user.teacherId));
  else rows = [];

  const result = [];
  for (const c of rows) {
    const teacher = c.teacherId
      ? (
          await db
            .select()
            .from(teachers)
            .where(eq(teachers.id, c.teacherId))
            .limit(1)
        )[0]
      : null;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(eq(students.courseId, c.id));
    result.push({ ...c, teacherName: teacher?.name ?? null, studentCount: count });
  }
  return res.json({ courses: result });
});

// Criteria
router.get("/v1/assessment/criteria", requireAuth, async (req, res) => {
  const all = req.query.all === "1" && isStaff(req.user!);
  const rows = all
    ? await db.select().from(criteria).orderBy(criteria.orderIndex)
    : await db
        .select()
        .from(criteria)
        .where(eq(criteria.active, true))
        .orderBy(criteria.orderIndex);
  return res.json({ criteria: rows });
});

router.post(
  "/v1/assessment/criteria",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const { key, labelEn, labelAr } = req.body ?? {};
    if (!labelEn || !labelAr)
      return res
        .status(400)
        .json({ message: "labelEn and labelAr are required" });
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(order_index), -1)::int` })
      .from(criteria);
    const [row] = await db
      .insert(criteria)
      .values({
        key: key || String(labelEn).toLowerCase().replace(/\s+/g, "_"),
        labelEn,
        labelAr,
        orderIndex: (max ?? -1) + 1,
        active: true,
      })
      .returning();
    return res.json({ criterion: row });
  },
);

router.patch(
  "/v1/assessment/criteria/:id",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { labelEn, labelAr, active, orderIndex } = req.body ?? {};
    const set: Record<string, unknown> = {};
    if (labelEn !== undefined) set.labelEn = labelEn;
    if (labelAr !== undefined) set.labelAr = labelAr;
    if (active !== undefined) set.active = !!active;
    if (orderIndex !== undefined) set.orderIndex = Number(orderIndex);
    if (Object.keys(set).length === 0)
      return res.status(400).json({ message: "nothing to update" });
    const [row] = await db
      .update(criteria)
      .set(set)
      .where(eq(criteria.id, id))
      .returning();
    return res.json({ criterion: row });
  },
);

// Sheets
router.get("/v1/assessment/sheets", requireAuth, async (req, res) => {
  const user = req.user!;
  const courseId = req.query.courseId ? Number(req.query.courseId) : null;
  let rows = await db.select().from(assessmentSheets);
  if (courseId) rows = rows.filter((s) => s.courseId === courseId);
  if (!isStaff(user)) {
    const ids = await teacherCourseIds(user);
    rows = rows.filter((s) => ids.includes(s.courseId));
  }
  return res.json({ sheets: rows });
});

router.get("/v1/assessment/sheet/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [sheet] = await db
    .select()
    .from(assessmentSheets)
    .where(eq(assessmentSheets.id, id))
    .limit(1);
  if (!sheet) return res.status(404).json({ message: "Sheet not found" });
  if (!(await canAccessCourse(req.user!, sheet.courseId)))
    return res.status(403).json({ message: "No access to this sheet" });

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, sheet.courseId))
    .limit(1);
  const teacher = course?.teacherId
    ? (
        await db
          .select()
          .from(teachers)
          .where(eq(teachers.id, course.teacherId))
          .limit(1)
      )[0]
    : null;
  const crit = await db
    .select()
    .from(criteria)
    .where(eq(criteria.active, true))
    .orderBy(criteria.orderIndex);
  const studs = await db
    .select()
    .from(students)
    .where(eq(students.courseId, sheet.courseId));

  const studentList = [];
  for (const s of studs) {
    const parent = s.parentId
      ? (
          await db
            .select()
            .from(parents)
            .where(eq(parents.id, s.parentId))
            .limit(1)
        )[0]
      : null;
    studentList.push({
      id: s.id,
      name: s.name,
      level: s.level,
      parentName: parent?.name ?? null,
    });
  }

  const scoreRows = await db
    .select()
    .from(assessmentScores)
    .where(eq(assessmentScores.sheetId, id));
  const scores: Record<number, Record<number, number | null>> = {};
  for (const sc of scoreRows) {
    scores[sc.studentId] ??= {};
    scores[sc.studentId][sc.criterionId] = sc.score;
  }

  return res.json({
    sheet,
    course: { ...course, teacherName: teacher?.name ?? null },
    criteria: crit,
    students: studentList,
    scores,
  });
});

router.post("/v1/assessment/sheet/:id/scores", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [sheet] = await db
    .select()
    .from(assessmentSheets)
    .where(eq(assessmentSheets.id, id))
    .limit(1);
  if (!sheet) return res.status(404).json({ message: "Sheet not found" });
  if (!(await canAccessCourse(req.user!, sheet.courseId)))
    return res.status(403).json({ message: "No access" });
  if (sheet.status !== "open")
    return res
      .status(409)
      .json({ message: "Sheet is not open for editing" });

  const { scores } = req.body ?? {};
  if (!Array.isArray(scores))
    return res.status(400).json({ message: "scores array required" });

  for (const s of scores) {
    const studentId = Number(s.studentId);
    const criterionId = Number(s.criterionId);
    if (!studentId || !criterionId) continue;
    const score: number | null =
      s.score === null || s.score === undefined || s.score === ""
        ? null
        : Number(s.score);
    if (score !== null && (score < 1 || score > 5)) continue;
    await db
      .insert(assessmentScores)
      .values({ sheetId: id, studentId, criterionId, score })
      .onConflictDoUpdate({
        target: [
          assessmentScores.sheetId,
          assessmentScores.studentId,
          assessmentScores.criterionId,
        ],
        set: { score, updatedAt: new Date() },
      });
  }
  return res.json({ ok: true });
});

router.post("/v1/assessment/sheet/:id/submit", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [sheet] = await db
    .select()
    .from(assessmentSheets)
    .where(eq(assessmentSheets.id, id))
    .limit(1);
  if (!sheet) return res.status(404).json({ message: "Sheet not found" });
  if (!(await canAccessCourse(req.user!, sheet.courseId)))
    return res.status(403).json({ message: "No access" });
  if (sheet.status === "locked")
    return res.status(409).json({ message: "Sheet is locked" });

  await db
    .update(assessmentSheets)
    .set({ status: "submitted", submittedAt: new Date() })
    .where(eq(assessmentSheets.id, id));
  await db.update(tasks).set({ status: "done" }).where(eq(tasks.sheetId, id));

  let generated = 0;
  try {
    const r = await generateReportsForSheet(id);
    generated = r.created;
    const rows = await db
      .select()
      .from(reports)
      .where(eq(reports.sheetId, id));
    for (const row of rows) await deliverReport(row, sheet.termLabel);
  } catch {
    // generation/delivery failures shouldn't block submission; pending
    // reports are completed later by the scheduler or a manual flush
  }
  return res.json({ ok: true, generated });
});

// Academic Room: change sheet status (open / submitted / locked).
router.patch(
  "/v1/assessment/sheet/:id",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body ?? {};
    if (!["open", "submitted", "locked"].includes(status))
      return res.status(400).json({ message: "invalid status" });
    const [row] = await db
      .update(assessmentSheets)
      .set({ status })
      .where(eq(assessmentSheets.id, id))
      .returning();
    return res.json({ sheet: row });
  },
);

export default router;
