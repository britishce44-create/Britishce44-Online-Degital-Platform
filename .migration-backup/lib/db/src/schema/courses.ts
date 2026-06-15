import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// teachingWeekdays: array of weekday numbers, 0 = Sunday ... 6 = Saturday.
// The Britishce44 week runs Sunday–Thursday by default.
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: text("level"),
  teacherId: integer("teacher_id"),
  termLabel: text("term_label").notNull(),
  termStartDate: text("term_start_date").notNull(), // ISO 'YYYY-MM-DD'
  teachingWeekdays: integer("teaching_weekdays").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
