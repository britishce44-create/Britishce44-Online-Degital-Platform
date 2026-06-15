import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

// Tasks Manager — assessment reminders and to-dos per teacher/admin.
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    assigneeType: text("assignee_type").$type<"teacher" | "admin">().notNull(),
    assigneeId: integer("assignee_id"), // teacherId, or null for admin
    courseId: integer("course_id"),
    sheetId: integer("sheet_id"),
    dueDate: text("due_date"), // ISO 'YYYY-MM-DD'
    type: text("type").notNull().default("assessment_reminder"),
    status: text("status").$type<"pending" | "done">().notNull().default("pending"),
    dedupeKey: text("dedupe_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("uq_task_dedupe").on(t.dedupeKey)],
);

// In-app notifications.
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  audienceRole: text("audience_role"), // 'teacher' | 'admin' | 'parent' | 'all'
  recipientEmail: text("recipient_email"),
  title: text("title").notNull(),
  body: text("body"),
  category: text("category").notNull().default("academic"),
  icon: text("icon"),
  read: boolean("read").notNull().default(false),
  dedupeKey: text("dedupe_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar events — term milestones (day 5 / day 17), reminders, due dates.
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    date: text("date").notNull(), // ISO 'YYYY-MM-DD'
    type: text("type").$type<"milestone" | "reminder" | "due">().notNull(),
    courseId: integer("course_id"),
    googleEventId: text("google_event_id"),
    dedupeKey: text("dedupe_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("uq_event_dedupe").on(t.dedupeKey)],
);

// CE4 Messenger system messages.
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadKey: text("thread_key").notNull(), // recipient email or 'system'
  fromName: text("from_name").notNull().default("CE4 Assessment Bot"),
  toEmail: text("to_email"),
  toRole: text("to_role"),
  body: text("body").notNull(),
  dedupeKey: text("dedupe_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type Message = typeof messages.$inferSelect;
