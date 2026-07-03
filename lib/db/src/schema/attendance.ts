import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const attendanceSheets = pgTable("attendance_sheets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull().default(""),
  termId: text("term_id").notNull().default("412"),
  groupNo: text("group_no").notNull().default("1"),
  teacherName: text("teacher_name").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date").notNull().default(""),
  period: text("period").notNull().default("Morning"),
  room: text("room").notNull().default("LAB 3"),
  timeRange: text("time_range").notNull().default("8 - 10"),
  dateHeaders: jsonb("date_headers").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceRows = pgTable("attendance_rows", {
  id: serial("id").primaryKey(),
  sheetId: integer("sheet_id").notNull(),
  rowNumber: integer("row_number").notNull(),
  studentName: text("student_name").notNull().default(""),
  dates: jsonb("dates").$type<Record<string, { value: string; color: string } | null>>().notNull().default({}),
  pr: text("pr").notNull().default(""),
  ma1: text("ma1").notNull().default(""),
  re: text("re").notNull().default(""),
  ma2: text("ma2").notNull().default(""),
  wr: text("wr").notNull().default(""),
  ma3: text("ma3").notNull().default(""),
  aps: text("aps").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AttendanceSheet = typeof attendanceSheets.$inferSelect;
export type AttendanceRow = typeof attendanceRows.$inferSelect;
