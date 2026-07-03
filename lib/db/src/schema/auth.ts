import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role")
    .$type<"admin" | "supervisor" | "teacher" | "student" | "parent">()
    .notNull(),
  teacherId: integer("teacher_id"),
  parentId: integer("parent_id"),
  studentId: integer("student_id"),
  phone: text("phone").default(""),
  status: text("status").$type<"active" | "inactive" | "suspended">().notNull().default("active"),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  accessFrom: text("access_from").notNull().default("00:00"),
  accessTo: text("access_to").notNull().default("23:59"),
  dashboardConfig: jsonb("dashboard_config").$type<Record<string, boolean>>().notNull().default({}),
  lastSeen: text("last_seen").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  teacherId: integer("teacher_id"),
  parentId: integer("parent_id"),
  studentId: integer("student_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AppUser = typeof appUsers.$inferSelect;
export type Session = typeof sessions.$inferSelect;
