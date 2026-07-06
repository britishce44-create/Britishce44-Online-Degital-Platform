import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// teachingWeekdays: array of weekday numbers, 0 = Sunday ... 6 = Saturday.
// The Britishce44 week runs Sunday–Thursday by default.
// New additive fields (safe defaults): room, startTime, endTime — so a course
// (which already carries teacher + students + level + weekdays) also carries
// its classroom/room label and time-of-day window. This connects the
// Classrooms section to the Student App schedule.
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: text("level"),
  teacherId: integer("teacher_id"),
  termLabel: text("term_label").notNull(),
  termStartDate: text("term_start_date").notNull(), // ISO 'YYYY-MM-DD'
  teachingWeekdays: integer("teaching_weekdays").array().notNull(),
  room: text("room"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
