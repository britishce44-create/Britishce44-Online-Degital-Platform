import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";

export const resultSheets = pgTable("result_sheets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull().default("نظام تشغيل ويندوز"),
  teacherName: text("teacher_name").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date").notNull().default(""),
  groupNo: text("group_no").notNull().default("1"),
  period: text("period").notNull().default("Morning"),
  timeRange: text("time_range").notNull().default("8 - 10"),
  room: text("room").notNull().default("Lab3"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resultRows = pgTable("result_rows", {
  id: serial("id").primaryKey(),
  sheetId: integer("sheet_id").notNull(),
  rowNumber: integer("row_number").notNull(),
  studentName: text("student_name").notNull().default(""),
  atten: real("atten").default(0),
  projects: real("projects").default(0),
  quiz1: real("quiz1").default(0),
  quiz2: real("quiz2").default(0),
  listening: real("listening").default(0),
  reading: real("reading").default(0),
  writing: real("writing").default(0),
  speaking: real("speaking").default(0),
  final: real("final").default(0),
  total: real("total").default(0),
  abse: integer("abse").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ResultSheet = typeof resultSheets.$inferSelect;
export type ResultRow = typeof resultRows.$inferSelect;
