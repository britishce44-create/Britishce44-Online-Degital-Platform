import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, appUsers, students, courses, teachers } from "@workspace/db";
import { createSession } from "../lib/auth";

const router: IRouter = Router();

// In-memory fallback users (admin/supervisor + extra teacher logins advertised
// on the login screen that aren't part of the seeded assessment data).
const USERS: Record<
  string,
  {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    password: string;
  }
> = {
  "britishce44@gmail.com": { id: "1", email: "britishce44@gmail.com", firstName: "Admin", lastName: "Britishce44", role: "admin", password: "admin123" },
  "supervisor@britishce44.edu": { id: "2", email: "supervisor@britishce44.edu", firstName: "Supervisor", lastName: "B44", role: "supervisor", password: "supervisor123" },
  "jamal.alshameeri": { id: "4", email: "jamal.alshameeri", firstName: "Jamal", lastName: "Al-Shameeri", role: "teacher", password: "teacher123" },
  "amani.alsharabi": { id: "5", email: "amani.alsharabi", firstName: "Amani", lastName: "Al-Sharabi", role: "teacher", password: "teacher123" },
  "khadeejah.alghaily": { id: "6", email: "khadeejah.alghaily", firstName: "Khadeejah", lastName: "Al-Ghaily", role: "teacher", password: "teacher123" },
  "shihab.alomary": { id: "7", email: "shihab.alomary", firstName: "Shihab", lastName: "Al-Omary", role: "teacher", password: "teacher123" },
};

const registeredUsers: typeof USERS = { ...USERS };
let nextId = 100;

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? name, lastName: parts.slice(1).join(" ") };
}

router.post("/v1/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    return res.status(400).json({ message: "User ID and password are required" });

  // 1. DB-backed users (seeded teachers/parents/admin) — proper role linkage.
  const [dbUser] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, String(email)))
    .limit(1);

  if (dbUser) {
    if (dbUser.password === password) {
      // Check account status
      if (dbUser.status === "suspended")
        return res.status(403).json({ message: "Your account has been suspended. Contact administration." });
      if (dbUser.status === "inactive")
        return res.status(403).json({ message: "Your account is inactive. Contact administration." });

      // Check access time limits
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const fromParts = (dbUser.accessFrom ?? "00:00").split(":").map(Number);
      const toParts = (dbUser.accessTo ?? "23:59").split(":").map(Number);
      const fromMin = fromParts[0] * 60 + (fromParts[1] || 0);
      const toMin = toParts[0] * 60 + (toParts[1] || 0);
      if (currentMinutes < fromMin || currentMinutes > toMin) {
        return res.status(403).json({ message: `Access is restricted to ${dbUser.accessFrom} — ${dbUser.accessTo}. Please try again during your allowed hours.` });
      }

      const { firstName, lastName } = splitName(dbUser.name);
      const accessToken = await createSession({
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        teacherId: dbUser.teacherId,
        parentId: dbUser.parentId,
        studentId: dbUser.studentId,
      });

      // Update last seen
      await db.update(appUsers).set({ lastSeen: now.toLocaleString() }).where(eq(appUsers.id, dbUser.id));

      // Enrich the response with role-specific context so the Student App
      // and Teacher Eval can show real room/teacher/level/time data.
      let context: Record<string, unknown> = {};
      if (dbUser.role === "student" && dbUser.studentId) {
        const [s] = await db.select().from(students).where(eq(students.id, dbUser.studentId)).limit(1);
        if (s) {
          let courseData: typeof courses.$inferSelect | null = null;
          let teacherName: string | null = null;
          if (s.courseId) {
            const [c] = await db.select().from(courses).where(eq(courses.id, s.courseId)).limit(1);
            courseData = c ?? null;
            if (c?.teacherId) {
              const [t] = await db.select().from(teachers).where(eq(teachers.id, c.teacherId)).limit(1);
              teacherName = t?.name ?? null;
            }
          }
          context = {
            classroomNum: s.courseId ?? 0,
            room: courseData?.room ?? null,
            teacher: teacherName,
            level: s.level ?? courseData?.level ?? null,
            startTime: courseData?.startTime ?? null,
            endTime: courseData?.endTime ?? null,
            courseId: s.courseId ?? null,
          };
        }
      } else if (dbUser.role === "teacher" && dbUser.teacherId) {
        const teacherCourses = await db
          .select({ id: courses.id, name: courses.name, level: courses.level, room: courses.room, startTime: courses.startTime, endTime: courses.endTime })
          .from(courses)
          .where(eq(courses.teacherId, dbUser.teacherId));
        context = { courses: teacherCourses };
      }

      return res.json({
        accessToken,
        user: {
          id: String(dbUser.id),
          email: dbUser.email,
          firstName,
          lastName,
          role: dbUser.role,
          teacherId: dbUser.teacherId ?? null,
          studentId: dbUser.studentId ?? null,
          parentId: dbUser.parentId ?? null,
          ...context,
        },
        permissions: dbUser.permissions,
        dashboardConfig: dbUser.dashboardConfig,
      });
    }
    // DB password didn't match — fall through to in-memory fallback below
  }

  // 2. In-memory fallback (extra demo logins + freshly registered users).
  const user = registeredUsers[email];
  if (!user || user.password !== password)
    return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = await createSession({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    teacherId: null,
    parentId: null,
    studentId: null,
  });
  const { password: _pw, ...userData } = user;
  return res.json({ accessToken, user: userData });
});

router.post("/v1/auth/register", (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    role = "student",
  } = req.body ?? {};
  if (!email || !password || !firstName || !lastName)
    return res.status(400).json({ message: "Missing required fields" });
  if (registeredUsers[email])
    return res.status(400).json({ message: "Email already registered" });
  nextId++;
  registeredUsers[email] = {
    id: String(nextId),
    email,
    firstName,
    lastName,
    role,
    password,
  };
  return res.json({ message: "Registration successful" });
});

export default router;
