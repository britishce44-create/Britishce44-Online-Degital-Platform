import { and, eq } from "drizzle-orm";
import {
  db,
  courses,
  teachers,
  parents,
  students,
  criteria,
  assessmentScores,
  assessmentSheets,
  dailyMonitoring,
  reports,
  type Student,
} from "@workspace/db";
import { aiClient, AI_MODEL } from "./ai";
import { logger } from "./logger";

function levelFromAvg(avg: number): { en: string; ar: string } {
  if (avg >= 4.5) return { en: "Excellent", ar: "ممتاز" };
  if (avg >= 3.5) return { en: "Very Good", ar: "جيد جدًا" };
  if (avg >= 2.5) return { en: "Good", ar: "جيد" };
  if (avg >= 1.5) return { en: "Fair", ar: "مقبول" };
  return { en: "Needs Support", ar: "يحتاج إلى دعم" };
}

interface GenInput {
  studentName: string;
  courseName: string;
  teacherName: string;
  parentName: string;
  scores: { label: string; score: number }[];
  monitoring: string[];
  avg: number;
}

interface GenPair {
  level: string;
  parentAr: string;
  teacherEn: string;
}

function templatePair(input: GenInput): GenPair {
  const lvl = levelFromAvg(input.avg);
  const lines = input.scores.map((s) => `${s.label}: ${s.score}/5`).join(" · ");
  const strengths = input.scores
    .filter((s) => s.score >= 4)
    .map((s) => s.label);
  const weak = input.scores.filter((s) => s.score <= 2).map((s) => s.label);
  const monitorEn = input.monitoring.length
    ? input.monitoring.join(" ")
    : "Consistent classroom engagement observed.";

  const teacherEn = [
    `In-Class Performance Report — ${input.studentName}`,
    `Course: ${input.courseName} | Teacher: ${input.teacherName}`,
    ``,
    `Overall level: ${lvl.en} (average ${input.avg.toFixed(1)}/5).`,
    `Scores: ${lines}.`,
    ``,
    `Strengths: ${strengths.length ? strengths.join(", ") : "developing across skills"}.`,
    `Areas to improve: ${weak.length ? weak.join(", ") : "maintain current progress"}.`,
    ``,
    `Daily monitoring: ${monitorEn}`,
    ``,
    `Recommendations: Provide targeted practice on the weaker skills above, continue positive reinforcement, and review homework consistency.`,
  ].join("\n");

  const parentAr = [
    `تقرير الأداء داخل الصف — ${input.studentName}`,
    `المقرر: ${input.courseName} | المعلّم/ة: ${input.teacherName}`,
    ``,
    `المستوى العام: ${lvl.ar} (المعدل ${input.avg.toFixed(1)} من 5).`,
    ``,
    `نقاط القوة: ${strengths.length ? strengths.join("، ") : "في تطور مستمر"}.`,
    `نقاط تحتاج إلى تحسين: ${weak.length ? weak.join("، ") : "الحفاظ على المستوى الحالي"}.`,
    ``,
    `التوصيات والنصائح: ننصح بمتابعة الواجبات المنزلية بانتظام، والتدرب على المهارات التي تحتاج إلى تحسين، وتشجيع الطالب/ة باستمرار.`,
    ``,
    `الأسباب: بُني هذا التقييم على درجات الأداء داخل الصف وملاحظات المتابعة اليومية.`,
    ``,
    `مع تحيات المركز البريطاني الأول — تعز.`,
  ].join("\n");

  return { level: `${lvl.en} / ${lvl.ar}`, parentAr, teacherEn };
}

async function generatePair(input: GenInput): Promise<GenPair> {
  if (!aiClient) return templatePair(input);
  try {
    const scoreText = input.scores
      .map((s) => `${s.label}: ${s.score}/5`)
      .join(", ");
    const completion = await aiClient.chat.completions.create({
      model: AI_MODEL,
      max_completion_tokens: 1100,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an experienced English-language school evaluator at Britishce44 (Taiz, Yemen). " +
            "From the in-class performance scores (1-5) and daily monitoring notes, write two reports for one student. " +
            "Return STRICT JSON with keys: level (short bilingual level label), parentAr (a warm Arabic report addressed to the parent), teacherEn (a concise English report for the teacher). " +
            "Each report MUST include: the student's level, specific recommendations, practical advice, and the reasons behind the assessment. Keep each report under ~180 words.",
        },
        {
          role: "user",
          content: JSON.stringify({
            student: input.studentName,
            course: input.courseName,
            teacher: input.teacherName,
            parent: input.parentName,
            averageScore: Number(input.avg.toFixed(2)),
            scores: scoreText,
            dailyMonitoring: input.monitoring,
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return templatePair(input);
    const parsed = JSON.parse(raw) as Partial<GenPair>;
    if (!parsed.parentAr || !parsed.teacherEn) return templatePair(input);
    return {
      level: parsed.level || levelFromAvg(input.avg).en,
      parentAr: parsed.parentAr,
      teacherEn: parsed.teacherEn,
    };
  } catch (err) {
    logger.warn({ err }, "AI report generation failed; using template");
    return templatePair(input);
  }
}

async function upsertReport(row: {
  sheetId: number;
  studentId: number;
  courseId: number;
  audience: "parent" | "teacher";
  language: "ar" | "en";
  recipientEmail: string;
  recipientName: string;
  level: string;
  body: string;
}): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.sheetId, row.sheetId),
        eq(reports.studentId, row.studentId),
        eq(reports.audience, row.audience),
      ),
    )
    .limit(1);

  if (existing) {
    // Preserve manual edits and already-sent reports.
    if (existing.status === "edited" || existing.status === "sent") return false;
    await db
      .update(reports)
      .set({
        language: row.language,
        recipientEmail: row.recipientEmail,
        recipientName: row.recipientName,
        level: row.level,
        body: row.body,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, existing.id));
    return true;
  }

  await db.insert(reports).values({
    sheetId: row.sheetId,
    studentId: row.studentId,
    courseId: row.courseId,
    audience: row.audience,
    language: row.language,
    recipientEmail: row.recipientEmail,
    recipientName: row.recipientName,
    level: row.level,
    body: row.body,
    status: "draft",
    emailStatus: "pending",
    driveStatus: "pending",
  });
  return true;
}

export async function generateReportsForSheet(
  sheetId: number,
): Promise<{ created: number }> {
  const [sheet] = await db
    .select()
    .from(assessmentSheets)
    .where(eq(assessmentSheets.id, sheetId))
    .limit(1);
  if (!sheet) throw new Error("sheet not found");

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, sheet.courseId))
    .limit(1);
  if (!course) throw new Error("course not found");

  const teacher = course.teacherId
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
  const critById = new Map(crit.map((c) => [c.id, c]));

  const courseStudents: Student[] = await db
    .select()
    .from(students)
    .where(eq(students.courseId, sheet.courseId));

  const scores = await db
    .select()
    .from(assessmentScores)
    .where(eq(assessmentScores.sheetId, sheetId));

  let created = 0;

  for (const st of courseStudents) {
    const parent = st.parentId
      ? (
          await db
            .select()
            .from(parents)
            .where(eq(parents.id, st.parentId))
            .limit(1)
        )[0]
      : null;

    const stScores = scores
      .filter((s) => s.studentId === st.id && s.score != null)
      .map((s) => ({
        label: critById.get(s.criterionId)?.labelEn || "Criterion",
        score: s.score as number,
      }));

    const avg =
      stScores.length > 0
        ? stScores.reduce((a, b) => a + b.score, 0) / stScores.length
        : 0;

    const monitor = await db
      .select()
      .from(dailyMonitoring)
      .where(eq(dailyMonitoring.studentId, st.id));

    const gen = await generatePair({
      studentName: st.name,
      courseName: course.name,
      teacherName: teacher?.name || "Teacher",
      parentName: parent?.name || "Parent",
      scores: stScores,
      monitoring: monitor.map((m) => m.summary),
      avg,
    });

    if (parent) {
      if (
        await upsertReport({
          sheetId,
          studentId: st.id,
          courseId: sheet.courseId,
          audience: "parent",
          language: "ar",
          recipientEmail: parent.email,
          recipientName: parent.name,
          level: gen.level,
          body: gen.parentAr,
        })
      )
        created++;
    }

    if (teacher) {
      if (
        await upsertReport({
          sheetId,
          studentId: st.id,
          courseId: sheet.courseId,
          audience: "teacher",
          language: "en",
          recipientEmail: teacher.email,
          recipientName: teacher.name,
          level: gen.level,
          body: gen.teacherEn,
        })
      )
        created++;
    }
  }

  await db
    .update(assessmentSheets)
    .set({ reportsGeneratedAt: new Date() })
    .where(eq(assessmentSheets.id, sheetId));

  logger.info({ sheetId, created }, "Reports generated for sheet");
  return { created };
}
