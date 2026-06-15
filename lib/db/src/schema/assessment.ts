import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// The scored criteria from the reference assessment sheet. Course / Teacher /
// Student are identity columns on the sheet, not scored criteria, so they are
// not stored here. Admins can add new criteria.
export const criteria = pgTable("criteria", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  labelEn: text("label_en").notNull(),
  labelAr: text("label_ar").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Two sheets per course per term: phase 'first' (5th teaching day) and
// 'last' (17th teaching day).
export const assessmentSheets = pgTable(
  "assessment_sheets",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id").notNull(),
    termLabel: text("term_label").notNull(),
    phase: text("phase").$type<"first" | "last">().notNull(),
    teachingDay: integer("teaching_day").notNull(), // 5 or 17
    dueDate: text("due_date").notNull(), // ISO 'YYYY-MM-DD'
    status: text("status")
      .$type<"open" | "submitted" | "locked">()
      .notNull()
      .default("open"),
    submittedAt: timestamp("submitted_at"),
    reportsGeneratedAt: timestamp("reports_generated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("uq_sheet_course_term_phase").on(t.courseId, t.termLabel, t.phase)],
);

export const assessmentScores = pgTable(
  "assessment_scores",
  {
    id: serial("id").primaryKey(),
    sheetId: integer("sheet_id").notNull(),
    studentId: integer("student_id").notNull(),
    criterionId: integer("criterion_id").notNull(),
    score: integer("score"), // 1-5, null = not yet scored
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("uq_score_sheet_student_criterion").on(
      t.sheetId,
      t.studentId,
      t.criterionId,
    ),
  ],
);

// Daily AI class-monitoring summaries — the second input (alongside the manual
// sheet scores) for generating reports.
export const dailyMonitoring = pgTable("daily_monitoring", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull(),
  date: text("date").notNull(), // ISO 'YYYY-MM-DD'
  summary: text("summary").notNull(),
  rating: integer("rating"), // optional 1-5 AI signal
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One report row per (sheet, student, audience). Parent reports are Arabic and
// go only to that child's parent; teacher reports are English and cover only
// that teacher's students.
export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    // 'student' = parent/teacher reports for student assessment sheets.
    // 'teacher_eval' = teacher performance-evaluation reports.
    kind: text("kind")
      .$type<"student" | "teacher_eval">()
      .notNull()
      .default("student"),
    sheetId: integer("sheet_id"),
    studentId: integer("student_id"),
    courseId: integer("course_id"),
    evalSheetId: integer("eval_sheet_id"),
    evalTeacherId: integer("eval_teacher_id"),
    audience: text("audience").$type<"parent" | "teacher">().notNull(),
    language: text("language").$type<"ar" | "en">().notNull(),
    recipientEmail: text("recipient_email").notNull(),
    recipientName: text("recipient_name"),
    level: text("level"),
    body: text("body").notNull(),
    status: text("status")
      .$type<"draft" | "edited" | "sent" | "failed">()
      .notNull()
      .default("draft"),
    emailStatus: text("email_status")
      .$type<"pending" | "sent" | "failed" | "skipped">()
      .notNull()
      .default("pending"),
    emailError: text("email_error"),
    sentAt: timestamp("sent_at"),
    driveStatus: text("drive_status")
      .$type<"pending" | "archived" | "failed" | "skipped">()
      .notNull()
      .default("pending"),
    driveFileId: text("drive_file_id"),
    driveLink: text("drive_link"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("uq_report_sheet_student_audience").on(
      t.sheetId,
      t.studentId,
      t.audience,
    ),
    uniqueIndex("uq_report_eval")
      .on(t.evalSheetId, t.evalTeacherId)
      .where(sql`${t.kind} = 'teacher_eval'`),
  ],
);

export type Criterion = typeof criteria.$inferSelect;
export type AssessmentSheet = typeof assessmentSheets.$inferSelect;
export type AssessmentScore = typeof assessmentScores.$inferSelect;
export type DailyMonitoring = typeof dailyMonitoring.$inferSelect;
export type Report = typeof reports.$inferSelect;
