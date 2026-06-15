import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

// Configurable evaluation tables the Academic Room can create / edit / expand.
//  - layout 'columns' : one row per subject (teacher); criteria are columns,
//    each scored 1-maxScore (or free-text for kind='text', e.g. Recommendations).
//  - layout 'weekly'  : criteria are rows (evaluation points) scored across the
//    6 teaching days (Sat..Thu) with a per-day duration in eval_day_meta.
export const evalTemplates = pgTable("eval_templates", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  subjectType: text("subject_type")
    .$type<"teacher" | "student">()
    .notNull()
    .default("teacher"),
  layout: text("layout")
    .$type<"columns" | "weekly">()
    .notNull()
    .default("columns"),
  termLabel: text("term_label"),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Columns (layout 'columns') or evaluation points (layout 'weekly').
export const evalCriteria = pgTable("eval_criteria", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  key: text("key").notNull(),
  labelEn: text("label_en").notNull(),
  labelAr: text("label_ar"),
  kind: text("kind").$type<"score" | "text">().notNull().default("score"),
  maxScore: integer("max_score").notNull().default(5),
  orderIndex: integer("order_index").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One sheet per template per term per week (week blank for non-weekly tables).
export const evalSheets = pgTable(
  "eval_sheets",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id").notNull(),
    termLabel: text("term_label").notNull(),
    weekLabel: text("week_label").notNull().default(""),
    dueDate: text("due_date"), // ISO 'YYYY-MM-DD'
    status: text("status")
      .$type<"open" | "submitted" | "locked">()
      .notNull()
      .default("open"),
    assessorId: integer("assessor_id"),
    submittedAt: timestamp("submitted_at"),
    reportsGeneratedAt: timestamp("reports_generated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("uq_eval_sheet_tpl_term_week").on(
      t.templateId,
      t.termLabel,
      t.weekLabel,
    ),
  ],
);

// day: 0 for 'columns' layout; getUTCDay() for 'weekly' (Sat=6,Sun=0..Thu=4).
export const evalScores = pgTable(
  "eval_scores",
  {
    id: serial("id").primaryKey(),
    sheetId: integer("sheet_id").notNull(),
    teacherId: integer("teacher_id").notNull(),
    criterionId: integer("criterion_id").notNull(),
    day: integer("day").notNull().default(0),
    score: integer("score"), // null = not yet scored
    note: text("note"), // free text for kind='text' criteria
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("uq_eval_score_sheet_teacher_crit_day").on(
      t.sheetId,
      t.teacherId,
      t.criterionId,
      t.day,
    ),
  ],
);

// Per teacher / per day lesson duration (minutes) for the weekly table.
export const evalDayMeta = pgTable(
  "eval_day_meta",
  {
    id: serial("id").primaryKey(),
    sheetId: integer("sheet_id").notNull(),
    teacherId: integer("teacher_id").notNull(),
    day: integer("day").notNull(),
    minutes: integer("minutes"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("uq_eval_daymeta_sheet_teacher_day").on(
      t.sheetId,
      t.teacherId,
      t.day,
    ),
  ],
);

export type EvalTemplate = typeof evalTemplates.$inferSelect;
export type EvalCriterion = typeof evalCriteria.$inferSelect;
export type EvalSheet = typeof evalSheets.$inferSelect;
export type EvalScore = typeof evalScores.$inferSelect;
export type EvalDayMeta = typeof evalDayMeta.$inferSelect;
