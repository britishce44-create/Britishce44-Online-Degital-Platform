import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

// Many-to-many student ↔ course enrollment. Keeps the legacy
// students.course_id single-FK working (primary course) while allowing a
// student to belong to multiple courses/rooms. Used by the Student App
// schedule and the Classrooms roster.
export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id").notNull(),
    courseId: integer("course_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("uq_course_enrollment_student_course").on(
      t.studentId,
      t.courseId,
    ),
  ],
);

// Real classrooms (replaces the synthetic buildRooms() in the Classrooms
// section and the dead approved_classrooms table). A classroom is a scheduled
// meeting room tied to a course (which carries teacher + students + level +
// weekdays + room + time). status mirrors the card states.
export const classrooms = pgTable(
  "classrooms",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id").notNull(),
    roomId: integer("room_id"), // numeric meeting room id used by socket.io
    label: text("label"), // human label e.g. "G1 · English"
    status: text("status")
      .$type<"live" | "scheduled" | "empty" | "locked">()
      .notNull()
      .default("scheduled"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type Classroom = typeof classrooms.$inferSelect;
