import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  real,
  unique,
} from "drizzle-orm/pg-core";

// Classroom session — one per active classroom meeting. Tracks the teacher,
// start/end times, and whether anti-cheat is active. Created when a teacher
// opens a classroom with session settings; closed when they leave or end it.
export const classroomSessions = pgTable("classroom_sessions", {
  id: serial("id").primaryKey(),
  classroomId: integer("classroom_id"),
  roomId: integer("room_id").notNull(), // numeric socket.io room id
  teacherId: integer("teacher_id"),
  antiCheatActive: boolean("anti_cheat_active").notNull().default(false),
  roomLocked: boolean("room_locked").notNull().default(false),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// Anti-cheat event log — one row per violation during a classroom session.
// event_type mirrors the quiz anti-cheat enum + classroom-specific events.
export const classroomAntiCheatLogs = pgTable("classroom_anti_cheat_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  studentId: integer("student_id"),
  studentName: text("student_name"),
  eventType: text("event_type").notNull(), // tab_switch | copy_paste | screenshot | translator | suspicious_audio | face_off | window_blur
  details: jsonb("details"),
  warningCount: integer("warning_count").notNull().default(0),
  blocked: boolean("blocked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Classroom locker — shared materials, reports, worksheets inside a classroom.
// Visible to all participants. Anti-cheat PDF reports and Arabic worksheets
// land here automatically.
export const classroomLocker = pgTable("classroom_locker", {
  id: serial("id").primaryKey(),
  classroomId: integer("classroom_id"),
  roomId: integer("room_id"),
  studentId: integer("student_id"),
  itemType: text("item_type").notNull().default("material"), // material | anti_cheat_report | arabic_worksheet
  title: text("title").notNull(),
  body: text("body"),
  fileUrl: text("file_url"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClassroomSession = typeof classroomSessions.$inferSelect;
export type ClassroomAntiCheatLog = typeof classroomAntiCheatLogs.$inferSelect;
export type ClassroomLockerItem = typeof classroomLocker.$inferSelect;
