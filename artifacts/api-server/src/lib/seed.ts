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
  classrooms,
} from "@workspace/db";
import { nthTeachingDayISO } from "./teaching-days";
import { logger } from "./logger";
import { FEEDBACK_DB } from "./eval-feedback-data";

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

  const ADMIN_PERMS = ["classrooms","exams","messenger","homework","reports","recordings","placements","analytics","settings","users","assessment","attendance","results","videoeditor","marketing","ailearning","parentportal"];

  const userRows: {
    email: string; password: string; name: string;
    role: "admin" | "supervisor" | "teacher" | "student" | "parent";
    teacherId: number | null; parentId: number | null; studentId: number | null;
    status: string; phone: string; permissions: string[];
    accessFrom: string; accessTo: string;
  }[] = [
    { email: "britishce44@gmail.com", password: "admin123", name: "Admin Britishce44", role: "admin", teacherId: null, parentId: null, studentId: null, status: "active", phone: "+967 770 000 001", permissions: ADMIN_PERMS, accessFrom: "00:00", accessTo: "23:59" },
    { email: "supervisor@britishce44.edu", password: "supervisor123", name: "Supervisor B44", role: "supervisor", teacherId: null, parentId: null, studentId: null, status: "active", phone: "+967 770 000 006", permissions: ADMIN_PERMS, accessFrom: "06:00", accessTo: "23:00" },
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
      status: "active",
      phone: "",
      permissions: ["classrooms","exams","messenger","homework","reports","recordings"],
      accessFrom: "07:00",
      accessTo: "22:00",
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
        status: "active",
        phone: "",
        permissions: ["reports","messenger"],
        accessFrom: "06:00",
        accessTo: "23:00",
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
  maxScore?: number;
  weight?: number;
  isKpi?: boolean;
  feedbackId?: number;
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

// Table 3 — "British Center" weighted 15-criteria layout (max scores
// 35/25/25/25/25/20/15/15/15/10/5/5/5/5/5 = 235). Each criterion carries a
// weight, a KPI flag, and the full bilingual 3-tier feedback DB keyed by
// feedbackId (maps to FEEDBACK_DB).
const BRITISH_CRITERIA: CritSeed[] = [
  { key: "strategy", labelEn: "Strategy", labelAr: "الاستراتيجية", maxScore: 35, weight: 3.5, isKpi: true, feedbackId: 1 },
  { key: "lesson_organisation", labelEn: "Lesson Organisation", labelAr: "تنظيم الدرس", maxScore: 25, weight: 2.5, isKpi: true, feedbackId: 2 },
  { key: "tasks_activities", labelEn: "Tasks and Activities", labelAr: "المهام والأنشطة", maxScore: 25, weight: 2.5, isKpi: true, feedbackId: 3 },
  { key: "classroom_language", labelEn: "Classroom Language", labelAr: "لغة الفصل", maxScore: 25, weight: 2.5, isKpi: true, feedbackId: 4 },
  { key: "classroom_management", labelEn: "Classroom Management", labelAr: "إدارة الفصل", maxScore: 25, weight: 2.5, isKpi: true, feedbackId: 5 },
  { key: "atmosphere", labelEn: "Atmosphere", labelAr: "الجو العام", maxScore: 20, weight: 2, isKpi: false, feedbackId: 6 },
  { key: "tools_engagement", labelEn: "Tools and Engagement", labelAr: "الأدوات والتفاعل", maxScore: 15, weight: 1.5, isKpi: false, feedbackId: 7 },
  { key: "whiteboard_use", labelEn: "Whiteboard Use", labelAr: "استخدام السبورة", maxScore: 15, weight: 1.5, isKpi: false, feedbackId: 8 },
  { key: "appearance", labelEn: "Appearance", labelAr: "المظهر", maxScore: 15, weight: 1.5, isKpi: false, feedbackId: 9 },
  { key: "language_accuracy", labelEn: "Language Accuracy", labelAr: "دقة اللغة", maxScore: 10, weight: 1, isKpi: true, feedbackId: 10 },
  { key: "stating_objectives", labelEn: "Stating Objectives", labelAr: "تحديد الأهداف", maxScore: 5, weight: 0.5, isKpi: false, feedbackId: 11 },
  { key: "students_involvement", labelEn: "Students' Involvement", labelAr: "مشاركة الطلاب", maxScore: 5, weight: 0.5, isKpi: false, feedbackId: 12 },
  { key: "students_english", labelEn: "Students' Use of English", labelAr: "استخدام الطلاب للغة الإنجليزية", maxScore: 5, weight: 0.5, isKpi: false, feedbackId: 13 },
  { key: "stt_ttt", labelEn: "STT vs TTT", labelAr: "وقت تحدث الطلاب مقابل المعلم", maxScore: 5, weight: 0.5, isKpi: false, feedbackId: 14 },
  { key: "temper_encouragement", labelEn: "Teacher's Temper & Encouragement", labelAr: "طبع المعلم وتشجيعه", maxScore: 5, weight: 0.5, isKpi: false, feedbackId: 15 },
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
  { key: "teacher_eval_british", name: "British Center Teacher Evaluation (15 Criteria)", nameAr: "تقييم المعلم البريطاني (١٥ معيارًا)", layout: "columns", orderIndex: 2, criteria: BRITISH_CRITERIA },
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
        status: "active",
        phone: "",
        permissions: ["classrooms","exams","messenger","homework","reports","recordings"],
        accessFrom: "07:00",
        accessTo: "22:00",
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
      .map(({ c, i }) => {
        const fb = c.feedbackId ? FEEDBACK_DB[c.feedbackId] : undefined;
        return {
          templateId: tplRow.id,
          key: c.key,
          labelEn: c.labelEn,
          labelAr: c.labelAr,
          kind: c.kind ?? "score",
          maxScore: c.maxScore ?? 5,
          weight: String(c.weight ?? 1),
          isKpi: c.isKpi ?? false,
          feedback: fb
            ? {
                weak: fb.weak,
                developing: fb.developing,
                strong: fb.strong,
                video: fb.video,
                website: fb.website,
              }
            : null,
          tierBoundaries: { weak: [0, 0.49], developing: [0.5, 0.79], strong: [0.8, 1] },
          orderIndex: i,
          active: true,
        };
      });
    if (toInsert.length) {
      try {
        await db.insert(evalCriteria).values(toInsert);
      } catch (err) {
        // If the new columns (weight/feedback/etc.) don't exist yet, retry
        // without them so the criteria still get seeded.
        try {
          const fallback = toInsert.map((c: any) => ({
            templateId: c.templateId, key: c.key, labelEn: c.labelEn,
            labelAr: c.labelAr, kind: c.kind, maxScore: c.maxScore,
            orderIndex: c.orderIndex, active: c.active,
          }));
          await db.insert(evalCriteria).values(fallback as any);
        } catch (err2) {
          logger.warn({ err: err2, tpl: tpl.key }, "Eval criteria seed failed (even fallback) — schema may need updating");
        }
      }
    }

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

/* ── Classroom seed (idempotent) — creates 40 classrooms ────────────────── */

const SEED_COURSE_DEFS = [
  { name: "English B1", level: "B1", room: "Room A", startTime: "08:00", endTime: "09:30" },
  { name: "IELTS Prep", level: "Advanced", room: "Room B", startTime: "09:45", endTime: "11:15" },
  { name: "Math G5", level: "Grade 5", room: "Room C", startTime: "11:30", endTime: "13:00" },
  { name: "Science G3", level: "Grade 3", room: "Room D", startTime: "13:15", endTime: "14:45" },
  { name: "Arabic A2", level: "A2", room: "Room E", startTime: "15:00", endTime: "16:30" },
  { name: "Conversational English", level: "B2", room: "Room F", startTime: "16:45", endTime: "18:15" },
  { name: "English A1", level: "A1", room: "Room G", startTime: "08:00", endTime: "09:30" },
  { name: "Grammar Workshop", level: "B1", room: "Room H", startTime: "09:45", endTime: "11:15" },
];

const WEEKDAYS = [0, 1, 2, 3, 4]; // Sun–Thu

export async function seedClassrooms(): Promise<void> {
  const allTeachers = await db.select().from(teachers).orderBy(teachers.id);
  if (!allTeachers.length) {
    logger.warn("No teachers found — skipping classroom seed");
    return;
  }

  // Ensure the seed courses exist (matched by name)
  const existingCourses = await db.select().from(courses);
  const existingNames = new Set(existingCourses.map((c) => c.name));

  const courseIds: number[] = [];
  for (const def of SEED_COURSE_DEFS) {
    let c = existingCourses.find((c) => c.name === def.name);
    if (!c) {
      const teacherIdx = SEED_COURSE_DEFS.indexOf(def) % allTeachers.length;
      const [ins] = await db
        .insert(courses)
        .values({
          name: def.name,
          level: def.level,
          teacherId: allTeachers[teacherIdx].id,
          termLabel: TERM_LABEL,
          termStartDate: new Date().toISOString().split("T")[0],
          teachingWeekdays: WEEKDAYS,
          room: def.room,
          startTime: def.startTime,
          endTime: def.endTime,
        })
        .returning();
      c = ins;
    }
    courseIds.push(c.id);
  }

  // Create 40 classrooms (room IDs 101–140) across the courses
  const existingRooms = await db.select().from(classrooms);
  const existingRoomIds = new Set(existingRooms.map((r) => r.roomId));

  const toInsert: typeof classrooms.$inferInsert[] = [];
  for (let i = 0; i < 40; i++) {
    const roomId = 101 + i;
    if (existingRoomIds.has(roomId)) continue;
    const courseIdx = i % courseIds.length;
    const course = SEED_COURSE_DEFS[courseIdx];
    const grade = Math.floor(i / 8) + 1;
    const statuses = ["scheduled", "empty", "scheduled", "live", "empty", "scheduled", "locked", "empty"] as const;
    toInsert.push({
      courseId: courseIds[courseIdx],
      roomId,
      label: `G${grade} · ${course.name}`,
      status: statuses[i % statuses.length],
      active: true,
    });
  }

  if (toInsert.length) {
    await db.insert(classrooms).values(toInsert);
    logger.info({ count: toInsert.length }, "Classrooms seeded (40 rooms, IDs 101–140)");
  } else {
    logger.info("Classroom seed skipped — all 40 rooms already exist");
  }
}
