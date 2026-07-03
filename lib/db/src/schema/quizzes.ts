import { pgTable, serial, text, integer, real, boolean, jsonb, timestamp, unique } from "drizzle-orm/pg-core";

/* ── Quiz Schedule (created by admin) ── */
export const quizSchedules = pgTable("quiz_schedules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").$type<"quiz1" | "quiz2" | "speaking" | "final">().notNull(),
  courseId: integer("course_id").notNull(),
  teacherId: integer("teacher_id"),
  scheduledDate: text("scheduled_date").notNull(), // YYYY-MM-DD
  scheduledTime: text("scheduled_time").notNull(), // HH:MM
  duration: integer("duration").notNull().default(30), // minutes
  status: text("status").$type<"scheduled" | "live" | "completed" | "cancelled">().notNull().default("scheduled"),
  
  // Anti-cheat settings
  aiAntiCheat: boolean("ai_anti_cheat").notNull().default(true),
  cameraRequired: boolean("camera_required").notNull().default(true),
  micRequired: boolean("mic_required").notNull().default(true),
  disableScreenshots: boolean("disable_screenshots").notNull().default(true),
  disableTranslator: boolean("disable_translator").notNull().default(true),
  
  // Question config
  questionCount: integer("question_count").notNull().default(10),
  passingScore: real("passing_score").notNull().default(50),
  randomizeQuestions: boolean("randomize_questions").notNull().default(true),
  
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ── Quiz Questions ── */
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").$type<"mcq" | "truefalse" | "short" | "essay">().notNull().default("mcq"),
  options: jsonb("options").$type<string[]>().default([]),
  correctAnswer: text("correct_answer").notNull(),
  points: real("points").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
  explanation: text("explanation").default(""), // Lesson/topic to study if wrong
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ── Student Quiz Attempts ── */
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  studentId: integer("student_id").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  totalScore: real("total_score").default(0),
  maxScore: real("max_score").default(0),
  percentage: real("percentage").default(0),
  passed: boolean("passed").default(false),
  status: text("status").$type<"in_progress" | "submitted" | "reviewed">().notNull().default("in_progress"),
  
  // Anti-cheat monitoring
  tabSwitchCount: integer("tab_switch_count").default(0),
  screenshotAttempts: integer("screenshot_attempts").default(0),
  aiFraudScore: real("ai_fraud_score").default(0),
  flagged: boolean("flagged").default(false),
});

/* ── Student Answers ── */
export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer").notNull().default(""),
  isCorrect: boolean("is_correct").default(false),
  pointsEarned: real("points_earned").default(0),
  gradedAt: timestamp("graded_at"),
});

/* ── Teacher Monitoring Sessions ── */
export const quizMonitoring = pgTable("quiz_monitoring", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  studentId: integer("student_id").notNull(),
  micSilenced: boolean("mic_silenced").default(false),
  silencedAt: timestamp("silenced_at"),
  unsilencedAt: timestamp("unsilenced_at"),
  aiAntiCheatActive: boolean("ai_anti_cheat_active").default(true),
  lastHeartbeat: timestamp("last_heartbeat"),
});

/* ── Anti-Cheat Event Log ── */
export const quizAntiCheatLogs = pgTable("quiz_anti_cheat_logs", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull(),
  eventType: text("event_type").$type<"tab_switch" | "screenshot" | "copy_paste" | "translator" | "face_off" | "multiple_faces" | "suspicious_audio">().notNull(),
  details: jsonb("details").$type<Record<string, any>>().default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type QuizSchedule = typeof quizSchedules.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type QuizMonitoring = typeof quizMonitoring.$inferSelect;
export type QuizAntiCheatLog = typeof quizAntiCheatLogs.$inferSelect;
