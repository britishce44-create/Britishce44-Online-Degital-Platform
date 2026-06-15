import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  locale: text("locale").notNull().default("ar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  courseId: integer("course_id"),
  parentId: integer("parent_id"),
  level: text("level"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Teacher = typeof teachers.$inferSelect;
export type Parent = typeof parents.$inferSelect;
export type Student = typeof students.$inferSelect;
