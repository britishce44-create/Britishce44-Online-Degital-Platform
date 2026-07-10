import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, appUsers, courses, teachers, students, parents, criteria, assessmentSheets, assessmentScores, reports, attendanceSheets, attendanceRows, classrooms, courseEnrollments } from "@workspace/db";
import { generateReportsForSheet } from "../lib/reports";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getReqUser(req: Request): { id: string; role: string; email: string; name: string } | null {
  return (req as any).user ?? null;
}

/* GET /v1/classroom-assessment/teachers — list teachers for dropdown */
router.get("/v1/classroom-assessment/teachers", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Forbidden" });

  const allTeachers = await db.select({ id: teachers.id, name: teachers.name, email: teachers.email }).from(teachers);
  return res.json({ teachers: allTeachers });
});

/* GET /v1/classroom-assessment/teachers/:id/courses — active courses for a teacher */
router.get("/v1/classroom-assessment/teachers/:id/courses", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });
  const teacherId = Number(req.params.id);

  const courseList = await db
    .select({ id: courses.id, name: courses.name, level: courses.level, termLabel: courses.termLabel, teachingWeekdays: courses.teachingWeekdays })
    .from(courses)
    .where(eq(courses.teacherId, teacherId));

  return res.json({ courses: courseList });
});

/* GET /v1/classroom-assessment/courses/:id/students — students in a course */
router.get("/v1/classroom-assessment/courses/:id/students", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const courseId = Number(req.params.id);
  const studentList = await db
    .select({ id: students.id, name: students.name, level: students.level, parentId: students.parentId })
    .from(students)
    .where(eq(students.courseId, courseId));

  // get parent names
  const parentIds = studentList.filter(s => s.parentId).map(s => s.parentId!);
  const parentMap: Record<number, string> = {};
  if (parentIds.length) {
    const parentsRes = await db.select({ id: parents.id, name: parents.name }).from(parents).where(inArray(parents.id, parentIds));
    parentsRes.forEach(p => { parentMap[p.id] = p.name; });
  }

  return res.json({
    students: studentList.map(s => ({
      ...s,
      parentName: s.parentId ? (parentMap[s.parentId] || "Parent") : null,
    })),
  });
});

/* POST /v1/classroom-assessment/save — save scores and generate reports */
router.post("/v1/classroom-assessment/save", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Forbidden" });

  const { teacherId, courseId, termLabel, date, scores: scoreData, generateReports } = req.body;
  if (!courseId || !scoreData || !Array.isArray(scoreData))
    return res.status(400).json({ message: "courseId and scores[] required" });

  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return res.status(404).json({ message: "Course not found" });

  // Find or create assessment sheet
  const sheetLabel = termLabel || course.termLabel || "Term 1";
  const [existingSheet] = await db
    .select()
    .from(assessmentSheets)
    .where(and(eq(assessmentSheets.courseId, courseId), eq(assessmentSheets.termLabel, sheetLabel)))
    .limit(1);

  let sheetId: number;
  if (existingSheet) {
    sheetId = existingSheet.id;
    if (existingSheet.status === "locked")
      return res.status(400).json({ message: "This sheet is locked" });
    await db.update(assessmentSheets).set({ status: "open" }).where(eq(assessmentSheets.id, sheetId));
  } else {
    const [ins] = await db.insert(assessmentSheets).values({
      courseId,
      termLabel: sheetLabel,
      phase: "first",
      teachingDay: new Date(date).getDay(),
      dueDate: date ? new Date(date) : null,
      status: "open",
    }).returning({ id: assessmentSheets.id });
    sheetId = ins.id;
  }

  // Get active criteria
  const crit = await db.select().from(criteria).where(eq(criteria.active, true)).orderBy(criteria.orderIndex);
  const cirtIds = crit.map(c => c.id);

  // Upsert scores
  let scoreCount = 0;
  for (const row of scoreData) {
    const { studentId, criterionId, score } = row;
    if (!cirtIds.includes(criterionId)) continue;
    const [existingScore] = await db
      .select()
      .from(assessmentScores)
      .where(and(eq(assessmentScores.sheetId, sheetId), eq(assessmentScores.studentId, studentId), eq(assessmentScores.criterionId, criterionId)))
      .limit(1);

    if (existingScore) {
      await db.update(assessmentScores).set({ score, updatedAt: new Date() }).where(eq(assessmentScores.id, existingScore.id));
    } else {
      await db.insert(assessmentScores).values({ sheetId, studentId, criterionId, score });
    }
    scoreCount++;
  }

  let reportsGenerated = false;
  if (generateReports) {
    try {
      await db.update(assessmentSheets).set({ status: "submitted", submittedAt: new Date() }).where(eq(assessmentSheets.id, sheetId));
      await generateReportsForSheet(sheetId);
      reportsGenerated = true;
    } catch (err) {
      logger.error({ err, sheetId }, "Report generation failed");
    }
  }

  return res.json({ sheetId, scoreCount, reportsGenerated, status: existingSheet?.status || "open" });
});

/* GET /v1/classroom-assessment/reports — list reports for current user */
router.get("/v1/classroom-assessment/reports", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  if (user.role === "admin" || user.role === "supervisor") {
    // All reports with course info
    const allReports = await db
      .select({
        id: reports.id,
        kind: reports.kind,
        audience: reports.audience,
        language: reports.language,
        level: reports.level,
        body: reports.body,
        status: reports.status,
        driveLink: reports.driveLink,
        createdAt: reports.createdAt,
        sheetId: reports.sheetId,
        studentId: reports.studentId,
        courseId: reports.courseId,
      })
      .from(reports)
      .orderBy(reports.createdAt);

    // Enrich with names
    const studentIds = [...new Set(allReports.filter(r => r.studentId).map(r => r.studentId))];
    const courseIds = [...new Set(allReports.filter(r => r.courseId).map(r => r.courseId))];
    const studentMap: Record<number, string> = {};
    const courseMap: Record<number, string> = {};

    if (studentIds.length) {
      const st = await db.select().from(students).where(inArray(students.id, studentIds));
      st.forEach(s => { studentMap[s.id] = s.name; });
    }
    if (courseIds.length) {
      const co = await db.select().from(courses).where(inArray(courses.id, courseIds));
      co.forEach(c => { courseMap[c.id] = c.name; });
    }

    return res.json({
      reports: allReports.map(r => ({
        ...r,
        studentName: r.studentId ? studentMap[r.studentId] || "Student" : null,
        courseName: r.courseId ? courseMap[r.courseId] || "Course" : null,
      })),
    });
  }

  if (user.role === "teacher") {
    // Find teacher record from app_users
    const [au] = await db.select().from(appUsers).where(eq(appUsers.email, user.email)).limit(1);
    const teacherRecord = au?.teacherId
      ? (await db.select().from(teachers).where(eq(teachers.id, au.teacherId)).limit(1))[0]
      : null;
    if (!teacherRecord) return res.json({ reports: [] });

    // Courses taught by this teacher
    const teacherCourses = await db.select({ id: courses.id }).from(courses).where(eq(courses.teacherId, teacherRecord.id));
    const courseIds = teacherCourses.map(c => c.id);
    if (!courseIds.length) return res.json({ reports: [] });

    const teacherReports = await db
      .select()
      .from(reports)
      .where(and(eq(reports.audience, "teacher"), inArray(reports.courseId, courseIds)))
      .orderBy(reports.createdAt);

    // Enrich with student/course names
    const studentIds = [...new Set(teacherReports.filter(r => r.studentId).map(r => r.studentId))];
    const courseMap: Record<number, string> = {};
    const studentMap: Record<number, string> = {};

    if (courseIds.length) {
      const co = await db.select().from(courses).where(inArray(courses.id, courseIds));
      co.forEach(c => { courseMap[c.id] = c.name; });
    }
    if (studentIds.length) {
      const st = await db.select().from(students).where(inArray(students.id, studentIds));
      st.forEach(s => { studentMap[s.id] = s.name; });
    }

    return res.json({
      reports: teacherReports.map(r => ({
        ...r,
        studentName: r.studentId ? studentMap[r.studentId] || "Student" : null,
        courseName: r.courseId ? courseMap[r.courseId] || "Course" : null,
      })),
    });
  }

  if (user.role === "student") {
    const [au] = await db.select().from(appUsers).where(eq(appUsers.email, user.email)).limit(1);
    const studentRecord = au?.studentId
      ? (await db.select().from(students).where(eq(students.id, au.studentId)).limit(1))[0]
      : null;
    if (!studentRecord) return res.json({ reports: [] });

    const studentReports = await db
      .select()
      .from(reports)
      .where(and(eq(reports.studentId, studentRecord.id), eq(reports.audience, "teacher")))
      .orderBy(reports.createdAt);

    const [course] = studentRecord.courseId
      ? await db.select({ name: courses.name }).from(courses).where(eq(courses.id, studentRecord.courseId)).limit(1)
      : [];

    return res.json({
      reports: studentReports.map(r => ({
        ...r,
        studentName: studentRecord.name,
        courseName: course?.name || "Course",
      })),
    });
  }

  return res.json({ reports: [] });
});

/* POST /v1/classroom-assessment/attendance — mark attendance from classroom session */
router.post("/v1/classroom-assessment/attendance", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const { courseId, date, presentStudentIds } = req.body;
  if (!courseId || !date) return res.status(400).json({ message: "courseId and date required" });

  // Get course students
  const courseStudents = await db
    .select({ id: students.id, name: students.name, phone: students.id })
    .from(students)
    .where(eq(students.courseId, courseId));

  if (!courseStudents.length) return res.json({ marked: 0, absent: 0, message: "No students in this course" });

  const presentSet = new Set<number>(presentStudentIds || []);
  const dateStr = new Date(date).toISOString().split("T")[0];

  // Find or create attendance sheet for this course context
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const sheetLabel = `Classroom-${courseId}-${dateStr}`;
  let [sheet] = await db
    .select()
    .from(attendanceSheets)
    .where(eq(attendanceSheets.subject, sheetLabel))
    .limit(1);

  const dateHeaders = [dateStr];
  if (!sheet) {
    [sheet] = await db.insert(attendanceSheets).values({
      subject: sheetLabel,
      termId: course.termLabel || "1",
      groupNo: "1",
      teacherName: user.name || "Teacher",
      startDate: dateStr,
      endDate: dateStr,
      period: "Morning",
      room: course.name,
      timeRange: req.body.timeRange || "8 - 10",
      dateHeaders,
    }).returning();
  }

  // Upsert rows for each student
  const absentStudents: { name: string; phone: string }[] = [];
  let marked = 0;

  for (const st of courseStudents) {
    const isPresent = presentSet.has(st.id);
    const color = isPresent ? "#22c55e" : "#ef4444";
    const value = isPresent ? "P" : "A";

    // Get student's phone number from app_users
    const [au] = await db
      .select({ phone: appUsers.phone })
      .from(appUsers)
      .where(eq(appUsers.studentId, st.id))
      .limit(1);
    const phone = au?.phone || "";

    if (!isPresent) {
      absentStudents.push({ name: st.name, phone });
    }

    // Check if row already exists
    const [existingRow] = await db
      .select()
      .from(attendanceRows)
      .where(and(eq(attendanceRows.sheetId, sheet.id), eq(attendanceRows.studentName, st.name)))
      .limit(1);

    const datesData: Record<string, { value: string; color: string } | null> = existingRow?.dates || {};
    datesData[dateStr] = { value, color };

    if (existingRow) {
      await db.update(attendanceRows).set({ dates: datesData, updatedAt: new Date() }).where(eq(attendanceRows.id, existingRow.id));
    } else {
      await db.insert(attendanceRows).values({
        sheetId: sheet.id,
        rowNumber: courseStudents.indexOf(st) + 1,
        studentName: st.name,
        dates: datesData,
      });
    }
    marked++;
  }

  // Log to academic management: create a notification about absentees
  if (absentStudents.length) {
    try {
      const { notifications } = await import("@workspace/db");
      await db.insert(notifications).values({
        kind: "absence_alert",
        title: `Absences — ${course.name} (${dateStr})`,
        body: `${absentStudents.length} absent: ${absentStudents.map(a => `${a.name}${a.phone ? ` (${a.phone})` : ""}`).join(", ")}`,
        audience: "admin",
        createdAt: new Date(),
      });
    } catch (err) {
      logger.warn({ err }, "Failed to log absence notification");
    }
  }

  logger.info({ courseId, dateStr, marked, absent: absentStudents.length }, "Classroom attendance marked");

  return res.json({
    marked,
    absent: absentStudents.length,
    absentStudents: absentStudents.map(a => a.name),
    message: `${marked} attendance records updated, ${absentStudents.length} absent`,
  });
});

/* POST /v1/classroom-assessment/reports/:id/generate-pdf — generate PDF content for a report */
router.post("/v1/classroom-assessment/reports/:id/generate-pdf", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const reportId = Number(req.params.id);
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) return res.status(404).json({ message: "Report not found" });

  // Enrich with names
  const [student] = report.studentId
    ? await db.select().from(students).where(eq(students.id, report.studentId)).limit(1)
    : [];
  const [course] = report.courseId
    ? await db.select().from(courses).where(eq(courses.id, report.courseId)).limit(1)
    : [];

  // Get scores for this student+sheet
  let scoresList: { label: string; score: number | null }[] = [];
  if (report.sheetId && report.studentId) {
    const crit = await db.select().from(criteria).where(eq(criteria.active, true)).orderBy(criteria.orderIndex);
    const sScores = await db
      .select()
      .from(assessmentScores)
      .where(and(eq(assessmentScores.sheetId, report.sheetId), eq(assessmentScores.studentId, report.studentId)));

    scoresList = crit.map(c => ({
      label: report.language === "ar" ? c.labelAr : c.labelEn,
      score: sScores.find(s => s.criterionId === c.id)?.score ?? null,
    }));
  }

  // Generate PDF data that the frontend can render or print
  const pdfData = {
    reportKind: report.audience,
    language: report.language,
    studentName: student?.name || "Student",
    courseName: course?.name || "Course",
    level: report.level,
    body: report.body,
    scores: scoresList,
    generatedAt: new Date().toISOString(),
    centerName: report.language === "ar" ? "المركز البريطاني الأول" : "Britishce44",
    centerSub: report.language === "ar" ? "لتعليم اللغة الإنجليزية عن بُعد" : "Online English Language School",
    location: "Taiz, Yemen",
  };

  return res.json(pdfData);
});

/* ── Student schedule: GET /v1/classroom-assessment/schedule ────────────── */
// Returns the authenticated student's weekly classes with room/teacher/time.
// Powers the Student App schedule + live-class join.
router.get("/v1/classroom-assessment/schedule", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  // Resolve the student record from the linked app_user
  let studentRecord: typeof students.$inferSelect | null = null;
  if (user.role === "student") {
    const [au] = await db.select().from(appUsers).where(eq(appUsers.email, user.email)).limit(1);
    if (au?.studentId) {
      const [s] = await db.select().from(students).where(eq(students.id, au.studentId)).limit(1);
      studentRecord = s ?? null;
    }
  } else if (user.role === "admin" || user.role === "supervisor") {
    // Admins see all classes (optionally filtered by studentId query param)
    const sid = req.query.studentId ? Number(req.query.studentId) : null;
    if (sid) {
      const [s] = await db.select().from(students).where(eq(students.id, sid)).limit(1);
      studentRecord = s ?? null;
    }
  }
  if (!studentRecord) return res.json({ classes: [] });

  // Gather courses: primary via students.course_id + any via enrollments
  const courseIds = new Set<number>();
  if (studentRecord.courseId) courseIds.add(studentRecord.courseId);
  const enrolls = await db.select().from(courseEnrollments).where(eq(courseEnrollments.studentId, studentRecord.id));
  enrolls.forEach((e) => courseIds.add(e.courseId));

  if (courseIds.size === 0) return res.json({ classes: [] });

  const courseList = await db.select().from(courses).where(inArray(courses.id, [...courseIds]));
  const classes: unknown[] = [];
  for (const c of courseList) {
    let teacherName: string | null = null;
    if (c.teacherId) {
      const [t] = await db.select().from(teachers).where(eq(teachers.id, c.teacherId)).limit(1);
      teacherName = t?.name ?? null;
    }
    // Expand weekdays into per-day class events for the schedule UI
    const weekdays = c.teachingWeekdays ?? [];
    for (const wd of weekdays) {
      classes.push({
        id: c.id * 10 + wd,
        courseId: c.id,
        name: c.name,
        teacher: teacherName,
        room: c.room ?? `Room ${c.id}`,
        date: nextDateForWeekday(wd),
        startTime: c.startTime ?? "08:00",
        endTime: c.endTime ?? "09:30",
        weekday: wd,
        level: c.level ?? studentRecord.level ?? null,
      });
    }
  }
  return res.json({ classes });
});

function nextDateForWeekday(wd: number): string {
  const now = new Date();
  const cur = now.getDay();
  let diff = (wd - cur + 7) % 7;
  if (diff === 0) diff = 0;
  const d = new Date(now.getTime() + diff * 86400000);
  return d.toISOString().split("T")[0];
}

/* ── Classrooms CRUD: real DB-backed rooms (replaces synthetic buildRooms) ─ */

router.get("/v1/classrooms", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const rooms = await db.select().from(classrooms).orderBy(classrooms.id);
  const out = [];
  for (const r of rooms) {
    const [c] = r.courseId ? await db.select().from(courses).where(eq(courses.id, r.courseId)).limit(1) : [null];
    let teacherName: string | null = null;
    let level: string | null = null;
    let studentCount = 0;
    if (c) {
      level = c.level ?? null;
      if (c.teacherId) {
        const [t] = await db.select().from(teachers).where(eq(teachers.id, c.teacherId)).limit(1);
        teacherName = t?.name ?? null;
      }
      studentCount = (await db.select().from(students).where(eq(students.courseId, c.id))).length;
    }
    out.push({
      ...r,
      courseName: c?.name ?? null,
      teacherName,
      level,
      studentCount,
      startTime: c?.startTime ?? null,
      endTime: c?.endTime ?? null,
    });
  }
  return res.json({ classrooms: out });
});

router.post("/v1/classrooms", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });
  const { courseId, roomId, label, status } = req.body ?? {};
  if (!courseId) return res.status(400).json({ message: "courseId required" });
  const [row] = await db
    .insert(classrooms)
    .values({
      courseId: Number(courseId),
      roomId: roomId ? Number(roomId) : null,
      label: label ?? null,
      status: status ?? "scheduled",
      active: true,
    })
    .returning();
  return res.json({ classroom: row });
});

router.patch("/v1/classrooms/:id", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });
  const id = Number(req.params.id);
  const { courseId, roomId, label, status, active } = req.body ?? {};
  const set: Record<string, unknown> = {};
  if (courseId !== undefined) set.courseId = Number(courseId);
  if (roomId !== undefined) set.roomId = Number(roomId);
  if (label !== undefined) set.label = label;
  if (status !== undefined) set.status = status;
  if (active !== undefined) set.active = !!active;
  if (Object.keys(set).length === 0) return res.status(400).json({ message: "nothing to update" });
  const [row] = await db.update(classrooms).set(set).where(eq(classrooms.id, id)).returning();
  return res.json({ classroom: row });
});

router.delete("/v1/classrooms/:id", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });
  const id = Number(req.params.id);
  await db.delete(classrooms).where(eq(classrooms.id, id));
  return res.json({ ok: true });
});

// Enroll a student in a course (many-to-many)
router.post("/v1/classroom-assessment/enroll", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });
  const { studentId, courseId } = req.body ?? {};
  if (!studentId || !courseId) return res.status(400).json({ message: "studentId and courseId required" });
  await db
    .insert(courseEnrollments)
    .values({ studentId: Number(studentId), courseId: Number(courseId) })
    .onConflictDoNothing({ target: [courseEnrollments.studentId, courseEnrollments.courseId] });
  return res.json({ ok: true });
});

/* ── Course CRUD: create / update courses with room + time ──────────────── */

// List ALL courses (with teacher names + student counts) — for Classrooms page
router.get("/v1/courses", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });
  const allCourses = await db.select().from(courses).orderBy(courses.id);
  const out = [];
  for (const c of allCourses) {
    let teacherName: string | null = null;
    if (c.teacherId) {
      const [t] = await db.select().from(teachers).where(eq(teachers.id, c.teacherId)).limit(1);
      teacherName = t?.name ?? null;
    }
    const studentCount = (await db.select().from(students).where(eq(students.courseId, c.id))).length;
    out.push({ ...c, teacherName, studentCount });
  }
  return res.json({ courses: out });
});

router.post("/v1/courses", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });
  const { teacherId, name, level, termLabel, termStartDate, teachingWeekdays, room, startTime, endTime } = req.body ?? {};
  if (!name || !termLabel || !termStartDate) return res.status(400).json({ message: "name, termLabel, termStartDate required" });
  const [row] = await db.insert(courses).values({
    name, level: level ?? null, teacherId: teacherId ? Number(teacherId) : null,
    termLabel, termStartDate,
    teachingWeekdays: Array.isArray(teachingWeekdays) ? teachingWeekdays : [],
    room: room ?? null, startTime: startTime ?? null, endTime: endTime ?? null,
  }).returning();
  return res.json({ course: row });
});

router.patch("/v1/courses/:id", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });
  const id = Number(req.params.id);
  const { name, level, teacherId, termLabel, termStartDate, teachingWeekdays, room, startTime, endTime } = req.body ?? {};
  const set: Record<string, unknown> = {};
  if (name !== undefined) set.name = name;
  if (level !== undefined) set.level = level;
  if (teacherId !== undefined) set.teacherId = teacherId;
  if (termLabel !== undefined) set.termLabel = termLabel;
  if (termStartDate !== undefined) set.termStartDate = termStartDate;
  if (teachingWeekdays !== undefined) set.teachingWeekdays = teachingWeekdays;
  if (room !== undefined) set.room = room;
  if (startTime !== undefined) set.startTime = startTime;
  if (endTime !== undefined) set.endTime = endTime;
  if (Object.keys(set).length === 0) return res.status(400).json({ message: "nothing to update" });
  const [row] = await db.update(courses).set(set).where(eq(courses.id, id)).returning();
  if (!row) return res.status(404).json({ message: "Course not found" });
  return res.json({ course: row });
});

router.delete("/v1/courses/:id", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });
  const id = Number(req.params.id);
  // Unenroll students from this course first
  await db.delete(courseEnrollments).where(eq(courseEnrollments.courseId, id));
  // Clear students.course_id pointing to this course
  await db.update(students).set({ courseId: null }).where(eq(students.courseId, id));
  await db.delete(courses).where(eq(courses.id, id));
  return res.json({ ok: true });
});

// Assign a student to a course (sets students.course_id)
router.post("/v1/courses/:id/assign-student", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });
  const courseId = Number(req.params.id);
  const { studentId } = req.body ?? {};
  if (!studentId) return res.status(400).json({ message: "studentId required" });
  await db.update(students).set({ courseId }).where(eq(students.id, Number(studentId)));
  await db
    .insert(courseEnrollments)
    .values({ studentId: Number(studentId), courseId })
    .onConflictDoNothing({ target: [courseEnrollments.studentId, courseEnrollments.courseId] });
  return res.json({ ok: true });
});

export default router;
