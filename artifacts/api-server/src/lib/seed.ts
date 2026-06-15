import { sql, eq, and } from "drizzle-orm";
import {
  db,
  teachers,
  parents,
  students,
  courses,
  criteria,
  assessmentSheets,
  dailyMonitoring,
  appUsers,
  evalTemplates,
  evalCriteria,
  evalSheets,
} from "@workspace/db";
import { nthTeachingDayISO } from "./teaching-days";
import { logger } from "./logger";

const CRITERIA = [
  { key: "speaking", labelEn: "Speaking", labelAr: "المحادثة" },
  { key: "reading", labelEn: "Reading", labelAr: "القراءة" },
  { key: "writing", labelEn: "Writing", labelAr: "الكتابة" },
  { key: "listening", labelEn: "Listening", labelAr: "الاستماع" },
  { key: "pronunciation", labelEn: "Pronunciation", labelAr: "النطق" },
  { key: "spelling", labelEn: "Spelling", labelAr: "التهجئة" },
  { key: "homework", labelEn: "HW", labelAr: "الواجب المنزلي" },
  { key: "punctuality", labelEn: "Punctuality", labelAr: "الالتزام بالمواعيد" },
  { key: "concentration", labelEn: "Concentration", labelAr: "التركيز" },
  { key: "confidence", labelEn: "Confidence", labelAr: "الثقة بالنفس" },
  { key: "atmosphere", labelEn: "Atmosphere", labelAr: "التفاعل والأجواء" },
];

const TERM_LABEL = "Term 3 — 2026";
const WEEKDAYS = [0, 1, 2, 3, 4]; // Sun–Thu

// Plus-addressed Gmail so every demo report is delivered to the authorized
// britishce44@gmail.com inbox while staying a distinct recipient address.
const inbox = (tag: string) => `britishce44+${tag}@gmail.com`;

interface TeacherSeed {
  login: string;
  name: string;
  tag: string;
  course: {
    name: string;
    level: string;
    termStartDate: string;
    students: { name: string; level: string; parent: string; parentTag: string }[];
  };
}

const TEACHERS: TeacherSeed[] = [
  {
    login: "suhair.almojahid",
    name: "Suhair Al-Mojahid",
    tag: "suhair",
    course: {
      name: "Gogo's Adventures — Level 3",
      level: "Gogo 3",
      termStartDate: "2026-05-17",
      students: [
        { name: "Ahmed Al-Sufyani", level: "Gogo 3", parent: "Mr. Al-Sufyani", parentTag: "sufyani" },
        { name: "Maryam Al-Adeeb", level: "Gogo 3", parent: "Mrs. Al-Adeeb", parentTag: "adeeb" },
        { name: "Yousef Al-Hakimi", level: "Gogo 3", parent: "Mr. Al-Hakimi", parentTag: "hakimi" },
        { name: "Layla Al-Mikhlafi", level: "Gogo 3", parent: "Mrs. Al-Mikhlafi", parentTag: "mikhlafi" },
        { name: "Omar Al-Saqqaf", level: "Gogo 3", parent: "Mr. Al-Saqqaf", parentTag: "saqqaf" },
      ],
    },
  },
  {
    login: "waad.alhammadi",
    name: "Waad Al-Hammadi",
    tag: "waad",
    course: {
      name: "Speakout — Intermediate",
      level: "Intermediate",
      termStartDate: "2026-06-01",
      students: [
        { name: "Fatima Al-Qadhi", level: "Intermediate", parent: "Mr. Al-Qadhi", parentTag: "qadhi" },
        { name: "Hani Al-Shar'abi", level: "Intermediate", parent: "Mrs. Al-Shar'abi", parentTag: "sharabi" },
        { name: "Noor Al-Dhubhani", level: "Intermediate", parent: "Mr. Al-Dhubhani", parentTag: "dhubhani" },
        { name: "Salem Al-Wesabi", level: "Intermediate", parent: "Mrs. Al-Wesabi", parentTag: "wesabi" },
      ],
    },
  },
];

const MONITORING_SNIPPETS = [
  "Participated actively and answered most questions correctly.",
  "Was a little distracted today but completed the in-class task.",
  "Excellent pronunciation practice; volunteered to read aloud.",
  "Struggled with new vocabulary; needs revision at home.",
  "Confident in group conversation and helped a classmate.",
  "Arrived late and missed the warm-up activity.",
];

export async function seedIfEmpty(): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courses);
  if (count > 0) {
    logger.info({ courses: count }, "Seed skipped — data already present");
    return;
  }

  logger.info("Seeding assessment demo data…");

  // Criteria
  await db.insert(criteria).values(
    CRITERIA.map((c, i) => ({ ...c, orderIndex: i, active: true })),
  );

  const userRows: {
    email: string;
    password: string;
    name: string;
    role: "admin" | "supervisor" | "teacher" | "student" | "parent";
    teacherId: number | null;
    parentId: number | null;
    studentId: number | null;
  }[] = [
    { email: "britishce44@gmail.com", password: "admin123", name: "Admin Britishce44", role: "admin", teacherId: null, parentId: null, studentId: null },
    { email: "supervisor@britishce44.edu", password: "supervisor123", name: "Supervisor B44", role: "supervisor", teacherId: null, parentId: null, studentId: null },
  ];

  for (const t of TEACHERS) {
    const [teacher] = await db
      .insert(teachers)
      .values({ name: t.name, email: inbox(t.tag) })
      .returning();

    const [course] = await db
      .insert(courses)
      .values({
        name: t.course.name,
        level: t.course.level,
        teacherId: teacher.id,
        termLabel: TERM_LABEL,
        termStartDate: t.course.termStartDate,
        teachingWeekdays: WEEKDAYS,
      })
      .returning();

    userRows.push({
      email: t.login,
      password: "teacher123",
      name: t.name,
      role: "teacher",
      teacherId: teacher.id,
      parentId: null,
      studentId: null,
    });

    for (const s of t.course.students) {
      const [parent] = await db
        .insert(parents)
        .values({ name: s.parent, email: inbox(s.parentTag), locale: "ar" })
        .returning();
      const [student] = await db
        .insert(students)
        .values({
          name: s.name,
          courseId: course.id,
          parentId: parent.id,
          level: s.level,
        })
        .returning();

      userRows.push({
        email: inbox(s.parentTag),
        password: "parent123",
        name: s.parent,
        role: "parent",
        teacherId: null,
        parentId: parent.id,
        studentId: null,
      });

      // Daily AI monitoring summaries (second input for reports).
      await db.insert(dailyMonitoring).values([
        {
          studentId: student.id,
          courseId: course.id,
          date: t.course.termStartDate,
          summary: MONITORING_SNIPPETS[student.id % MONITORING_SNIPPETS.length],
          rating: 3 + (student.id % 3),
        },
        {
          studentId: student.id,
          courseId: course.id,
          date: nthTeachingDayISO(t.course.termStartDate, WEEKDAYS, 3),
          summary:
            MONITORING_SNIPPETS[(student.id + 2) % MONITORING_SNIPPETS.length],
          rating: 2 + (student.id % 4),
        },
      ]);
    }

    // Two sheets per course: first week (day 5), last week (day 17).
    await db.insert(assessmentSheets).values([
      {
        courseId: course.id,
        termLabel: TERM_LABEL,
        phase: "first",
        teachingDay: 5,
        dueDate: nthTeachingDayISO(t.course.termStartDate, WEEKDAYS, 5),
        status: "open",
      },
      {
        courseId: course.id,
        termLabel: TERM_LABEL,
        phase: "last",
        teachingDay: 17,
        dueDate: nthTeachingDayISO(t.course.termStartDate, WEEKDAYS, 17),
        status: "open",
      },
    ]);
  }

  await db.insert(appUsers).values(userRows);

  logger.info({ teachers: TEACHERS.length }, "Seed complete");
}

/* ── Teacher Performance Evaluation seed (idempotent) ───────────────────── */

// The five evaluated teachers from the reference forms. The first two already
// exist (course teachers); matched by email so no duplicates are created.
const EVAL_TEACHERS: { name: string; tag: string; login: string }[] = [
  { name: "Suhair Al-Mojahid", tag: "suhair", login: "suhair.almojahid" },
  { name: "Waad Al-Hammadi", tag: "waad", login: "waad.alhammadi" },
  { name: "Jamal Al-Shameeri", tag: "jamal", login: "jamal.alshameeri" },
  { name: "Amani Al-Sharabi", tag: "amani", login: "amani.alsharabi" },
  { name: "Shihab Al-Omary", tag: "shihab", login: "shihab.alomary" },
];

type CritSeed = {
  key: string;
  labelEn: string;
  labelAr: string;
  kind?: "score" | "text";
};

// Table 1 — "columns" layout: scored criteria + two free-text columns.
const COLUMN_CRITERIA: CritSeed[] = [
  { key: "strategy", labelEn: "Strategy", labelAr: "الاستراتيجية" },
  { key: "lesson_org", labelEn: "Lesson Organization", labelAr: "تنظيم الدرس" },
  { key: "tasks_activities", labelEn: "Tasks and Activities", labelAr: "المهام والأنشطة" },
  { key: "classroom_language", labelEn: "Classroom Language", labelAr: "لغة الفصل" },
  { key: "classroom_mgmt", labelEn: "Classroom Management", labelAr: "إدارة الفصل" },
  { key: "learning_atmosphere", labelEn: "Learning Atmosphere", labelAr: "أجواء التعلم" },
  { key: "teaching_tools", labelEn: "Teaching Tools & English", labelAr: "أدوات التدريس والإنجليزية" },
  { key: "whiteboard", labelEn: "Whiteboard Use", labelAr: "استخدام السبورة" },
  { key: "appearance", labelEn: "Professional Appearance", labelAr: "المظهر المهني" },
  { key: "language_accuracy", labelEn: "Language Accuracy", labelAr: "دقة اللغة" },
  { key: "recommendations", labelEn: "Recommendations", labelAr: "التوصيات", kind: "text" },
  { key: "followup", labelEn: "Follow-up", labelAr: "المتابعة", kind: "text" },
];

// Table 2 — "weekly" layout: five evaluation points scored across the week.
const WEEKLY_CRITERIA: CritSeed[] = [
  { key: "clear_english", labelEn: "Ts. teach in a clear, easy-to-understand and at level English", labelAr: "يدرّس المعلم بإنجليزية واضحة ومناسبة للمستوى" },
  { key: "ss_speak", labelEn: "Ss. speak English during every class", labelAr: "يتحدث الطلاب الإنجليزية في كل حصة" },
  { key: "ss_practice", labelEn: "Ss. practice English every day", labelAr: "يمارس الطلاب الإنجليزية يومياً" },
  { key: "movement", labelEn: "Movement and interaction in class every 20 to 30 minutes", labelAr: "الحركة والتفاعل في الفصل كل 20 إلى 30 دقيقة" },
  { key: "goals", labelEn: "Teacher knows and states the lesson goals to the students", labelAr: "يعرف المعلم أهداف الدرس ويوضحها للطلاب" },
];

const EVAL_TEMPLATES: {
  key: string;
  name: string;
  nameAr: string;
  layout: "columns" | "weekly";
  orderIndex: number;
  criteria: CritSeed[];
}[] = [
  { key: "teacher_eval_columns", name: "Teachers' Performance Evaluation — Page 1", nameAr: "تقييم أداء المعلمين — صفحة ١", layout: "columns", orderIndex: 0, criteria: COLUMN_CRITERIA },
  { key: "teacher_eval_weekly", name: "Teachers Performance Evaluation Form", nameAr: "نموذج تقييم أداء المعلمين", layout: "weekly", orderIndex: 1, criteria: WEEKLY_CRITERIA },
];

// Ensures the evaluated teachers, both templates, their criteria, and a current
// sheet per template exist. Safe to run on every boot.
export async function seedEval(): Promise<void> {
  for (const t of EVAL_TEACHERS) {
    const email = inbox(t.tag);
    const existing = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, email))
      .limit(1);
    let teacherId: number;
    if (existing.length) {
      teacherId = existing[0].id;
    } else {
      const [row] = await db
        .insert(teachers)
        .values({ name: t.name, email })
        .returning();
      teacherId = row.id;
    }

    const login = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.email, t.login))
      .limit(1);
    if (!login.length) {
      await db.insert(appUsers).values({
        email: t.login,
        password: "teacher123",
        name: t.name,
        role: "teacher",
        teacherId,
        parentId: null,
        studentId: null,
      });
    }
  }

  for (const tpl of EVAL_TEMPLATES) {
    const found = await db
      .select()
      .from(evalTemplates)
      .where(eq(evalTemplates.key, tpl.key))
      .limit(1);
    let tplRow = found[0];
    if (!tplRow) {
      const ins = await db
        .insert(evalTemplates)
        .values({
          key: tpl.key,
          name: tpl.name,
          nameAr: tpl.nameAr,
          subjectType: "teacher",
          layout: tpl.layout,
          termLabel: TERM_LABEL,
          orderIndex: tpl.orderIndex,
          active: true,
        })
        .returning();
      tplRow = ins[0];
    }

    const existingCrit = await db
      .select()
      .from(evalCriteria)
      .where(eq(evalCriteria.templateId, tplRow.id));
    const haveKeys = new Set(existingCrit.map((c) => c.key));
    const toInsert = tpl.criteria
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !haveKeys.has(c.key))
      .map(({ c, i }) => ({
        templateId: tplRow.id,
        key: c.key,
        labelEn: c.labelEn,
        labelAr: c.labelAr,
        kind: c.kind ?? "score",
        maxScore: 5,
        orderIndex: i,
        active: true,
      }));
    if (toInsert.length) await db.insert(evalCriteria).values(toInsert);

    const week = tpl.layout === "weekly" ? "Week 1" : "";
    const sheet = await db
      .select()
      .from(evalSheets)
      .where(
        and(
          eq(evalSheets.templateId, tplRow.id),
          eq(evalSheets.termLabel, TERM_LABEL),
          eq(evalSheets.weekLabel, week),
        ),
      )
      .limit(1);
    if (!sheet.length) {
      await db.insert(evalSheets).values({
        templateId: tplRow.id,
        termLabel: TERM_LABEL,
        weekLabel: week,
        status: "open",
      });
    }
  }

  logger.info({ templates: EVAL_TEMPLATES.length }, "Eval templates seeded");
}
