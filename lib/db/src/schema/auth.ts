import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// Directory of login identities. Links a login to a role and, where relevant,
// to a teacher/parent/student record so the API can scope data access
// (a parent sees only their own child, a teacher only their own students).
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bearer-token sessions. Identity is denormalized so requireAuth needs no join.
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
