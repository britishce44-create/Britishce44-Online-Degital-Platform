import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, sessions, courses } from "@workspace/db";

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  teacherId: number | null;
  parentId: number | null;
  studentId: number | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function isStaff(u: AuthUser): boolean {
  return u.role === "admin" || u.role === "supervisor";
}

export async function teacherCourseIds(user: AuthUser): Promise<number[]> {
  if (!user.teacherId) return [];
  const rows = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.teacherId, user.teacherId));
  return rows.map((r) => r.id);
}

export async function createSession(u: AuthUser): Promise<string> {
  const token = `b44_${randomBytes(24).toString("hex")}`;
  await db.insert(sessions).values({
    token,
    email: u.email,
    name: u.name,
    role: u.role,
    teacherId: u.teacherId,
    parentId: u.parentId,
    studentId: u.studentId,
  });
  return token;
}

function readToken(req: Request): string | null {
  const h = req.header("authorization");
  if (h && h.startsWith("Bearer ")) return h.slice(7).trim();
  return null;
}

export async function loadUser(req: Request): Promise<AuthUser | null> {
  const token = readToken(req);
  if (!token) return null;
  const [s] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);
  if (!s) return null;
  return {
    email: s.email,
    name: s.name,
    role: s.role,
    teacherId: s.teacherId,
    parentId: s.parentId,
    studentId: s.studentId,
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const u = await loadUser(req);
  if (!u) {
    res.status(401).json({
      error: "unauthorized",
      message: "Your session expired. Please sign in again.",
    });
    return;
  }
  req.user = u;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "forbidden",
        message: "You don't have access to this area.",
      });
      return;
    }
    next();
  };
}
