import { Router, type IRouter } from "express";
import { eq, and, inArray, desc } from "drizzle-orm";
import {
  db, courses, students, teachers, appUsers,
  quizSchedules, quizQuestions, quizAttempts, quizAnswers, quizMonitoring, quizAntiCheatLogs,
} from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getReqUser(req: any): { id: string; role: string; email: string; name: string } | null {
  return req.user ?? null;
}

/* ─────────────────────────────────────── */
/*  ADMIN — Quiz Schedule CRUD             */
/* ─────────────────────────────────────── */

router.get("/v1/quizzes", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const list = await db
    .select()
    .from(quizSchedules)
    .orderBy(desc(quizSchedules.scheduledDate));

  // Enrich with course names
  const courseIds = [...new Set(list.map(q => q.courseId))];
  const courseMap: Record<number, string> = {};
  if (courseIds.length) {
    const cs = await db.select().from(courses).where(inArray(courses.id, courseIds));
    cs.forEach(c => { courseMap[c.id] = c.name; });
  }

  const teacherIds = [...new Set(list.filter(q => q.teacherId).map(q => q.teacherId!))];
  const teacherMap: Record<number, string> = {};
  if (teacherIds.length) {
    const ts = await db.select().from(teachers).where(inArray(teachers.id, teacherIds));
    ts.forEach(t => { teacherMap[t.id] = t.name; });
  }

  return res.json({
    quizzes: list.map(q => ({
      ...q,
      courseName: courseMap[q.courseId] || "Course",
      teacherName: q.teacherId ? teacherMap[q.teacherId] || "Teacher" : null,
    })),
  });
});

router.post("/v1/quizzes", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });

  const { title, type, courseId, teacherId, scheduledDate, scheduledTime, duration, aiAntiCheat, cameraRequired, micRequired, questionCount, passingScore, randomizeQuestions } = req.body;
  if (!title || !courseId || !scheduledDate) return res.status(400).json({ message: "title, courseId, scheduledDate required" });

  const [ins] = await db.insert(quizSchedules).values({
    title, type: type || "quiz1", courseId, teacherId: teacherId || null,
    scheduledDate, scheduledTime: scheduledTime || "09:00", duration: duration || 30,
    status: "scheduled",
    aiAntiCheat: aiAntiCheat !== false,
    cameraRequired: cameraRequired !== false,
    micRequired: micRequired !== false,
    disableScreenshots: true, disableTranslator: true,
    questionCount: questionCount || 10, passingScore: passingScore || 50,
    randomizeQuestions: randomizeQuestions !== false,
    createdBy: Number(user.id),
  }).returning();

  return res.json({ quiz: ins });
});

router.patch("/v1/quizzes/:id", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });

  const id = Number(req.params.id);
  const allowed = ["title","type","courseId","teacherId","scheduledDate","scheduledTime","duration","status","aiAntiCheat","cameraRequired","micRequired","questionCount","passingScore","randomizeQuestions"];
  const updates: any = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  updates.updatedAt = new Date();

  await db.update(quizSchedules).set(updates).where(eq(quizSchedules.id, id));
  return res.json({ ok: true });
});

router.delete("/v1/quizzes/:id", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor"))
    return res.status(403).json({ message: "Forbidden" });

  const id = Number(req.params.id);
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
  await db.delete(quizAttempts).where(eq(quizAttempts.quizId, id));
  await db.delete(quizMonitoring).where(eq(quizMonitoring.quizId, id));
  await db.delete(quizSchedules).where(eq(quizSchedules.id, id));
  return res.json({ ok: true });
});

/* ─────────────────────────────────────── */
/*  QUESTIONS CRUD                         */
/* ─────────────────────────────────────── */

router.get("/v1/quizzes/:id/questions", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const qs = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, Number(req.params.id)))
    .orderBy(quizQuestions.orderIndex);

  // If role is student, hide correct answers
  if (user.role === "student") {
    return res.json({ questions: qs.map(q => ({ ...q, correctAnswer: undefined })) });
  }
  return res.json({ questions: qs });
});

router.post("/v1/quizzes/:id/questions", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Forbidden" });

  const quizId = Number(req.params.id);
  const { questions } = req.body;
  if (!Array.isArray(questions) || !questions.length) return res.status(400).json({ message: "questions[] required" });

  // Delete existing and re-insert
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));

  const inserted = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const [ins] = await db.insert(quizQuestions).values({
      quizId,
      questionText: q.questionText,
      questionType: q.questionType || "mcq",
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      points: q.points || 1,
      orderIndex: i,
      explanation: q.explanation || "",
    }).returning();
    inserted.push(ins);
  }

  // Update question count
  await db.update(quizSchedules).set({ questionCount: questions.length, updatedAt: new Date() }).where(eq(quizSchedules.id, quizId));

  return res.json({ questions: inserted });
});

/* ─────────────────────────────────────── */
/*  STUDENT — Take Quiz                    */
/* ─────────────────────────────────────── */

router.get("/v1/quizzes/pending", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  if (user.role !== "student") return res.json({ quizzes: [] });

  const [au] = await db.select().from(appUsers).where(eq(appUsers.email, user.email)).limit(1);
  const studentRecord = au?.studentId
    ? (await db.select().from(students).where(eq(students.id, au.studentId)).limit(1))[0]
    : null;
  if (!studentRecord?.courseId) return res.json({ quizzes: [] });

  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const pending = await db
    .select()
    .from(quizSchedules)
    .where(and(
      eq(quizSchedules.courseId, studentRecord.courseId),
      eq(quizSchedules.scheduledDate, today),
      eq(quizSchedules.status, "scheduled"),
    ));

  // Check already attempted
  const attempted = await db
    .select({ quizId: quizAttempts.quizId })
    .from(quizAttempts)
    .where(and(eq(quizAttempts.studentId, studentRecord.id), inArray(quizAttempts.status, ["submitted","reviewed"])));

  const attemptedIds = new Set(attempted.map(a => a.quizId));

  return res.json({
    quizzes: pending
      .filter(q => !attemptedIds.has(q.id))
      .map(q => ({
        ...q,
        canStart: q.scheduledTime <= nowTime,
      })),
  });
});

router.post("/v1/quizzes/:id/start", async (req, res) => {
  const user = getReqUser(req);
  if (!user || user.role !== "student") return res.status(403).json({ message: "Forbidden" });

  const [au] = await db.select().from(appUsers).where(eq(appUsers.email, user.email)).limit(1);
  const studentRecord = au?.studentId
    ? (await db.select().from(students).where(eq(students.id, au.studentId)).limit(1))[0]
    : null;
  if (!studentRecord) return res.status(400).json({ message: "Student record not found" });

  const quizId = Number(req.params.id);
  const [quiz] = await db.select().from(quizSchedules).where(eq(quizSchedules.id, quizId)).limit(1);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  if (quiz.status !== "scheduled") return res.status(400).json({ message: "Quiz is not available" });
  if (quiz.courseId !== studentRecord.courseId) return res.status(403).json({ message: "Not enrolled in this course" });

  // Check for existing in-progress attempt
  const [existing] = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, studentRecord.id), eq(quizAttempts.status, "in_progress")))
    .limit(1);

  if (existing) return res.json({ attempt: existing, resume: true });

  const [attempt] = await db.insert(quizAttempts).values({
    quizId, studentId: studentRecord.id, status: "in_progress",
  }).returning();

  return res.json({ attempt, resume: false });
});

router.post("/v1/quizzes/:id/submit", async (req, res) => {
  const user = getReqUser(req);
  if (!user || user.role !== "student") return res.status(403).json({ message: "Forbidden" });

  const [au] = await db.select().from(appUsers).where(eq(appUsers.email, user.email)).limit(1);
  const studentRecord = au?.studentId
    ? (await db.select().from(students).where(eq(students.id, au.studentId)).limit(1))[0]
    : null;
  if (!studentRecord) return res.status(400).json({ message: "Student not found" });

  const quizId = Number(req.params.id);
  const { answers, tabSwitches, screenshotAttempts } = req.body;

  const [attempt] = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.studentId, studentRecord.id), eq(quizAttempts.status, "in_progress")))
    .limit(1);

  if (!attempt) return res.status(400).json({ message: "No active attempt found" });

  // Get all questions
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.orderIndex);

  // Grade answers
  let totalPoints = 0;
  let maxPoints = 0;
  const qMap = new Map(questions.map(q => [q.id, q]));
  const answerRecords: any[] = [];

  for (const q of questions) {
    maxPoints += q.points;
    const studentAnswer = answers?.[String(q.id)]?.trim() || "";
    const isCorrect = studentAnswer.toLowerCase() === q.correctAnswer.toLowerCase();
    const earned = isCorrect ? q.points : 0;
    totalPoints += earned;

    const [ins] = await db.insert(quizAnswers).values({
      attemptId: attempt.id,
      questionId: q.id,
      answer: studentAnswer,
      isCorrect,
      pointsEarned: earned,
      gradedAt: new Date(),
    }).returning();
    answerRecords.push(ins);
  }

  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

  await db.update(quizAttempts).set({
    submittedAt: new Date(),
    totalScore: totalPoints,
    maxScore: maxPoints,
    percentage,
    passed: percentage >= 50,
    status: "submitted",
    tabSwitchCount: tabSwitches || attempt.tabSwitchCount,
    screenshotAttempts: screenshotAttempts || attempt.screenshotAttempts,
  }).where(eq(quizAttempts.id, attempt.id));

  return res.json({ attemptId: attempt.id, score: totalPoints, maxScore: maxPoints, percentage, passed: percentage >= 50 });
});

/* ─────────────────────────────────────── */
/*  RESULTS + REPORTS                      */
/* ─────────────────────────────────────── */

router.get("/v1/quizzes/:id/results", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const quizId = Number(req.params.id);
  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.quizId, quizId))
    .orderBy(quizAttempts.percentage);

  // Enrich with student names
  const studentIds = [...new Set(attempts.map(a => a.studentId))];
  const studentMap: Record<number, any> = {};
  if (studentIds.length) {
    const sts = await db.select().from(students).where(inArray(students.id, studentIds));
    sts.forEach(s => { studentMap[s.id] = { name: s.name, level: s.level }; });
  }

  return res.json({
    results: attempts.map(a => ({
      ...a,
      studentName: studentMap[a.studentId]?.name || "Student",
      studentLevel: studentMap[a.studentId]?.level || "",
    })),
  });
});

router.get("/v1/quizzes/:id/results/:attemptId/report", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const attemptId = Number(req.params.attemptId);
  const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);
  if (!attempt) return res.status(404).json({ message: "Attempt not found" });

  const [quiz] = await db.select().from(quizSchedules).where(eq(quizSchedules.id, attempt.quizId)).limit(1);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  const answers = await db.select().from(quizAnswers).where(eq(quizAnswers.attemptId, attemptId));
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, attempt.quizId))
    .orderBy(quizQuestions.orderIndex);

  const [student] = await db.select().from(students).where(eq(students.id, attempt.studentId)).limit(1);

  const qMap = new Map(questions.map(q => [q.id, q]));

  // Build report with explanations (not the questions themselves)
  const wrongAnswers = answers.filter(a => !a.isCorrect);
  const lessonExplanations = wrongAnswers.map(a => {
    const q = qMap.get(a.questionId);
    return q?.explanation || "Review the related lesson material.";
  });

  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalQuestions = questions.length;

  const report = {
    studentName: student?.name || "Student",
    quizTitle: quiz.title,
    quizType: quiz.type,
    score: attempt.percentage,
    passed: attempt.passed,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    correctCount,
    totalQuestions,
    submittedAt: attempt.submittedAt?.toISOString(),
    duration: quiz.duration,
    lessonExplanations,
    wrongCount: wrongAnswers.length,
    tabSwitches: attempt.tabSwitchCount,
    flagged: attempt.flagged,
    // Performance summary by topic
    performanceSummary: {
      correct: `${correctCount}/${totalQuestions}`,
      percentage: `${attempt.percentage}%`,
      grade: attempt.percentage >= 90 ? "A" : attempt.percentage >= 80 ? "B" : attempt.percentage >= 70 ? "C" : attempt.percentage >= 60 ? "D" : "F",
    },
  };

  return res.json({ report });
});

/* ─────────────────────────────────────── */
/*  TEACHER — Monitoring                   */
/* ─────────────────────────────────────── */

router.get("/v1/quizzes/:id/monitor", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Forbidden" });

  const quizId = Number(req.params.id);
  const [quiz] = await db.select().from(quizSchedules).where(eq(quizSchedules.id, quizId)).limit(1);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  // Get course students
  const courseStudents = await db.select().from(students).where(eq(students.courseId, quiz.courseId));

  // Get active attempts
  const activeAttempts = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.status, "in_progress")));
  const submittedAttempts = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quizId), eq(quizAttempts.status, "submitted")));

  // Get monitoring records
  const monitoring = await db
    .select()
    .from(quizMonitoring)
    .where(eq(quizMonitoring.quizId, quizId));

  const monitorMap = new Map(monitoring.map(m => [m.studentId, m]));

  return res.json({
    quiz,
    students: courseStudents.map(s => {
      const active = activeAttempts.find(a => a.studentId === s.id);
      const submitted = submittedAttempts.find(a => a.studentId === s.id);
      const mon = monitorMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        level: s.level,
        status: active ? "in_progress" : submitted ? "submitted" : "not_started",
        score: submitted?.percentage || null,
        micSilenced: mon?.micSilenced || false,
        tabSwitches: active?.tabSwitchCount || submitted?.tabSwitchCount || 0,
        flagged: active?.flagged || submitted?.flagged || false,
      };
    }),
  });
});

router.post("/v1/quizzes/:id/monitor/silence", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Forbidden" });

  const quizId = Number(req.params.id);
  const { studentId, silenced } = req.body;

  const [existing] = await db
    .select()
    .from(quizMonitoring)
    .where(and(eq(quizMonitoring.quizId, quizId), eq(quizMonitoring.studentId, studentId)))
    .limit(1);

  if (existing) {
    await db.update(quizMonitoring).set({
      micSilenced: silenced ?? true,
      silencedAt: silenced ? new Date() : existing.silencedAt,
      unsilencedAt: silenced ? existing.unsilencedAt : new Date(),
    }).where(eq(quizMonitoring.id, existing.id));
  } else {
    await db.insert(quizMonitoring).values({
      quizId,
      teacherId: Number(user.id),
      studentId,
      micSilenced: silenced ?? true,
      silencedAt: new Date(),
    });
  }

  return res.json({ ok: true });
});

router.post("/v1/quizzes/:id/monitor/ai-toggle", async (req, res) => {
  const user = getReqUser(req);
  if (!user || (user.role !== "admin" && user.role !== "supervisor" && user.role !== "teacher"))
    return res.status(403).json({ message: "Forbidden" });

  const quizId = Number(req.params.id);
  const { active } = req.body;

  await db.update(quizSchedules).set({ aiAntiCheat: active ?? true, updatedAt: new Date() }).where(eq(quizSchedules.id, quizId));
  return res.json({ ok: true, aiAntiCheat: active ?? true });
});

/* ─────────────────────────────────────── */
/*  ANTI-CHEAT LOGS                        */
/* ─────────────────────────────────────── */

router.post("/v1/quizzes/anti-cheat/log", async (req, res) => {
  const user = getReqUser(req);
  if (!user) return res.status(403).json({ message: "Forbidden" });

  const { attemptId, eventType, details } = req.body;
  if (!attemptId || !eventType) return res.status(400).json({ message: "attemptId and eventType required" });

  await db.insert(quizAntiCheatLogs).values({ attemptId, eventType, details: details || {} });

  // Update attempt flags
  if (["tab_switch","screenshot","translator","multiple_faces"].includes(eventType)) {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);
    if (attempt) {
      const updates: any = { flagged: true };
      if (eventType === "tab_switch") updates.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;
      if (eventType === "screenshot") updates.screenshotAttempts = (attempt.screenshotAttempts || 0) + 1;
      await db.update(quizAttempts).set(updates).where(eq(quizAttempts.id, attemptId));
    }
  }

  return res.json({ ok: true });
});

export default router;
