import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, appUsers } from "@workspace/db";
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
    return res.status(400).json({ message: "Email and password are required" });

  // 1. DB-backed users (seeded teachers/parents/admin) — proper role linkage.
  const [dbUser] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, String(email)))
    .limit(1);

  if (dbUser) {
    if (dbUser.password !== password)
      return res.status(401).json({ message: "Invalid credentials" });
    const { firstName, lastName } = splitName(dbUser.name);
    const accessToken = await createSession({
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      teacherId: dbUser.teacherId,
      parentId: dbUser.parentId,
      studentId: dbUser.studentId,
    });
    return res.json({
      accessToken,
      user: {
        id: String(dbUser.id),
        email: dbUser.email,
        firstName,
        lastName,
        role: dbUser.role,
      },
    });
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
