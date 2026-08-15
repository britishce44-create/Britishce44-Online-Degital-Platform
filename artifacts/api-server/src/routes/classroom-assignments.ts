import { Router, type IRouter } from "express";
import { eq, and, desc, inArray, sql, or } from "drizzle-orm";
import {
  db,
  classroomAssignments,
  classroomSchedules,
  classroomParticipants,
  participantPermissions,
  classroomTransfers,
  classroomAccessPolicies,
  classroomAuditLogs,
  classroomCapacity,
  classrooms,
  appUsers,
  courseEnrollments,
  courses,
  teachers,
  students,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ── Helper: get requesting user ── */
function getReqUser(req: any) {
  return req.user ?? null;
}

/* ── Helper: log audit ── */
async function logAudit(data: {
  performedBy: number;
  targetUserId?: number;
  targetClassroomId?: number;
  action: string;
  details?: any;
  previousState?: any;
  newState?: any;
  req?: any;
}) {
  try {
    await db.insert(classroomAuditLogs).values({
      performedBy: data.performedBy,
      targetUserId: data.targetUserId,
      targetClassroomId: data.targetClassroomId,
      action: data.action,
      details: data.details,
      previousState: data.previousState,
      newState: data.newState,
      ipAddress: data.req?.ip,
      userAgent: data.req?.headers["user-agent"],
    });
  } catch (err) {
    logger.warn({ err }, "Failed to write audit log");
  }
}

/* ── Helper: check schedule conflict ── */
async function checkScheduleConflict(
  userId: number,
  classroomId: number,
  startTime: string,
  endTime: string,
  days: number[],
  startDate: Date,
  endDate: Date | null,
  excludeAssignmentId?: number
) {
  const existing = await db
    .select()
    .from(classroomAssignments)
    .where(
      and(
        eq(classroomAssignments.userId, userId),
        eq(classroomAssignments.status, "active"),
        excludeAssignmentId
          ? sql`${classroomAssignments.id} != ${excludeAssignmentId}`
          : sql`1=1`
      )
    );

  for (const assignment of existing) {
    const otherSchedule = await db
      .select()
      .from(classroomSchedules)
      .where(eq(classroomSchedules.classroomId, assignment.classroomId));

    for (const sched of otherSchedule) {
      const dayOverlap = days.some((d) => sched.days?.includes(d));
      if (!dayOverlap) continue;

      const timeOverlap =
        startTime < sched.endTime && endTime > sched.startTime;

      const dateOverlap =
        startDate <= (sched.endDate ?? new Date("2099-12-31")) &&
        (endDate ?? new Date("2099-12-31")) >= sched.startDate;

      if (timeOverlap && dateOverlap) {
        const [targetClassroom] = await db
          .select()
          .from(classrooms)
          .where(eq(classrooms.id, assignment.classroomId))
          .limit(1);

        return {
          conflict: true,
          message: `User is already assigned to ${targetClassroom?.label || `Classroom ${assignment.classroomId}`} during this period (${sched.startTime}-${sched.endTime})`,
          existingAssignment: assignment,
          existingSchedule: sched,
        };
      }
    }
  }

  return { conflict: false };
}

/* ── Helper: get user's timezone ── */
function getUserTimezone(user: any): string {
  return user.timezone || "UTC";
}

/* ══════════════════════════════════════════════════════════════
   CLASSROOM ASSIGNMENTS CRUD
   ══════════════════════════════════════════════════════════════ */

// List all assignments with filters (enriched with user and classroom names)
router.get(
  "/v1/classroom-assignments",
  requireAuth,
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const {
      classroomId,
      userId,
      role,
      status,
      assignmentType,
      page = "1",
      limit = "200",
    } = req.query;

    const conditions = [];
    if (classroomId) conditions.push(eq(classroomAssignments.classroomId, Number(classroomId)));
    if (userId) conditions.push(eq(classroomAssignments.userId, Number(userId)));
    if (role) conditions.push(eq(classroomAssignments.userRole, role as "student" | "teacher"));
    if (status) conditions.push(eq(classroomAssignments.status, status as any));
    if (assignmentType) conditions.push(eq(classroomAssignments.assignmentType, assignmentType as any));

    const offset = (Number(page) - 1) * Number(limit);

    // Get assignments with joins to get user name and classroom label
    const assignmentsData = await db
      .select({
        id: classroomAssignments.id,
        userId: classroomAssignments.userId,
        userRole: classroomAssignments.userRole,
        classroomId: classroomAssignments.classroomId,
        assignedBy: classroomAssignments.assignedBy,
        assignmentType: classroomAssignments.assignmentType,
        status: classroomAssignments.status,
        startDate: classroomAssignments.startDate,
        endDate: classroomAssignments.endDate,
        loginTime: classroomAssignments.loginTime,
        leaveTime: classroomAssignments.leaveTime,
        earlyLoginAllowance: classroomAssignments.earlyLoginAllowance,
        timezone: classroomAssignments.timezone,
        scheduleFrequency: classroomAssignments.scheduleFrequency,
        scheduleDays: classroomAssignments.scheduleDays,
        scheduleConfig: classroomAssignments.scheduleConfig,
        createdAt: classroomAssignments.createdAt,
        updatedAt: classroomAssignments.updatedAt,
        userName: appUsers.name,
        userEmail: appUsers.email,
        classroomLabel: classrooms.label,
        classroomRoomId: classrooms.roomId,
      })
      .from(classroomAssignments)
      .leftJoin(appUsers, eq(classroomAssignments.userId, appUsers.id))
      .leftJoin(classrooms, eq(classroomAssignments.classroomId, classrooms.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(classroomAssignments.createdAt))
      .limit(Number(limit))
      .offset(offset);

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(classroomAssignments)
      .where(conditions.length ? and(...conditions) : undefined);

    return res.json({
      assignments: assignmentsData,
      total: total?.count || 0,
      page: Number(page),
      limit: Number(limit),
    });
  }
);

// Get the current user's own assignments (student/teacher app sync)
router.get(
  "/v1/classroom-assignments/mine",
  async (req, res) => {
    const user = getReqUser(req);
    if (!user) return res.json({ assignments: [] });

    // Resolve the app_users row for this session identity
    let appUserId: number | null = null;
    if (user.studentId) {
      const [u] = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.studentId, user.studentId))
        .limit(1);
      appUserId = u?.id ?? null;
    } else if (user.teacherId) {
      const [u] = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.teacherId, user.teacherId))
        .limit(1);
      appUserId = u?.id ?? null;
    }
    if (!appUserId) return res.json({ assignments: [] });

    const assignmentsData = await db
      .select({
        id: classroomAssignments.id,
        userId: classroomAssignments.userId,
        userRole: classroomAssignments.userRole,
        classroomId: classroomAssignments.classroomId,
        assignmentType: classroomAssignments.assignmentType,
        status: classroomAssignments.status,
        startDate: classroomAssignments.startDate,
        endDate: classroomAssignments.endDate,
        loginTime: classroomAssignments.loginTime,
        leaveTime: classroomAssignments.leaveTime,
        earlyLoginAllowance: classroomAssignments.earlyLoginAllowance,
        timezone: classroomAssignments.timezone,
        scheduleFrequency: classroomAssignments.scheduleFrequency,
        scheduleDays: classroomAssignments.scheduleDays,
        scheduleConfig: classroomAssignments.scheduleConfig,
        classroomLabel: classrooms.label,
        classroomRoomId: classrooms.roomId,
        classroomStatus: classrooms.status,
      })
      .from(classroomAssignments)
      .leftJoin(classrooms, eq(classroomAssignments.classroomId, classrooms.id))
      .where(
        and(
          eq(classroomAssignments.userId, appUserId),
          eq(classroomAssignments.status, "active")
        )
      )
      .orderBy(desc(classroomAssignments.createdAt));

    const enriched = await Promise.all(
      assignmentsData.map(async (a) => {
        const [sched] = await db
          .select()
          .from(classroomSchedules)
          .where(eq(classroomSchedules.classroomId, a.classroomId))
          .limit(1);
        const [policy] = await db
          .select()
          .from(classroomAccessPolicies)
          .where(eq(classroomAccessPolicies.classroomId, a.classroomId))
          .limit(1);
        return {
          id: a.id,
          classroomId: a.classroomId,
          classroomLabel: a.classroomLabel,
          roomId: a.classroomRoomId,
          classroomStatus: a.classroomStatus,
          userRole: a.userRole,
          assignmentType: a.assignmentType,
          status: a.status,
          startDate: a.startDate,
          endDate: a.endDate,
          loginTime: a.loginTime,
          leaveTime: a.leaveTime,
          earlyLoginAllowance: a.earlyLoginAllowance,
          timezone: a.timezone,
          scheduleFrequency: a.scheduleFrequency,
          scheduleDays: a.scheduleDays,
          scheduleConfig: a.scheduleConfig,
          schedule: sched
            ? {
                startTime: sched.startTime,
                endTime: sched.endTime,
                days: sched.days,
                frequency: sched.frequency,
                timezone: sched.timezone,
              }
            : null,
          accessPolicy: policy
            ? {
                allowRoom1Access: policy.allowRoom1Access,
                room1Policy: policy.room1Policy,
                allowedClassroomIds: policy.allowedClassroomIds,
                requireTeacherApproval: policy.requireTeacherApproval,
                capacity: policy.capacity,
                allowOverride: policy.allowOverride,
                isLocked: policy.isLocked,
                lockReason: policy.lockReason,
              }
            : null,
        };
      })
    );

    return res.json({ assignments: enriched });
  }
);

// Get single assignment with full details
router.get(
  "/v1/classroom-assignments/:id",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const id = Number(req.params.id);
    const [assignment] = await db
      .select()
      .from(classroomAssignments)
      .where(eq(classroomAssignments.id, id))
      .limit(1);

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const [schedule] = await db
      .select()
      .from(classroomSchedules)
      .where(eq(classroomSchedules.classroomId, assignment.classroomId));

    const [participant] = await db
      .select()
      .from(classroomParticipants)
      .where(
        and(
          eq(classroomParticipants.classroomId, assignment.classroomId),
          eq(classroomParticipants.userId, assignment.userId)
        )
      )
      .limit(1);

    const [user] = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, assignment.userId))
      .limit(1);

    return res.json({ assignment, schedule, participant, user });
  }
);

// Create new assignment
router.post(
  "/v1/classroom-assignments",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const user = getReqUser(req);
    const {
      userId,
      classroomId,
      assignmentType = "permanent",
      startDate,
      endDate,
      loginTime,
      leaveTime,
      earlyLoginAllowance = 0,
      timezone = "UTC",
      scheduleFrequency = "weekly",
      scheduleDays = [],
      scheduleConfig = {},
    } = req.body ?? {};

    if (!userId || !classroomId || !loginTime || !leaveTime || !startDate) {
      return res
        .status(400)
        .json({ message: "userId, classroomId, loginTime, leaveTime, startDate required" });
    }

    // Verify user exists and is student/teacher
    const [targetUser] = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, Number(userId)))
      .limit(1);

    if (!targetUser) return res.status(404).json({ message: "User not found" });
    if (!["student", "teacher"].includes(targetUser.role)) {
      return res.status(400).json({ message: "Only students and teachers can be assigned" });
    }

    // Verify classroom exists
    const [targetClassroom] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.id, Number(classroomId)))
      .limit(1);

    if (!targetClassroom) return res.status(404).json({ message: "Classroom not found" });

    // Check capacity
    const [capacity] = await db
      .select()
      .from(classroomCapacity)
      .where(eq(classroomCapacity.classroomId, Number(classroomId)))
      .limit(1);

    if (capacity && capacity.currentCount >= capacity.maxStudents && targetUser.role === "student") {
      return res.status(409).json({
        message: "Classroom capacity reached",
        capacity: capacity.maxStudents,
        current: capacity.currentCount,
      });
    }

    // Check schedule conflict
    const conflict = await checkScheduleConflict(
      Number(userId),
      Number(classroomId),
      loginTime,
      leaveTime,
      scheduleDays,
      new Date(startDate),
      endDate ? new Date(endDate) : null
    );

    if (conflict.conflict) {
      return res.status(409).json({
        message: "Scheduling Conflict",
        details: conflict.message,
        options: ["cancel", "replace", "adjust"],
      });
    }

    // Create assignment
    const [assignment] = await db
      .insert(classroomAssignments)
      .values({
        userId: Number(userId),
        userRole: targetUser.role,
        classroomId: Number(classroomId),
        assignedBy: user!.id || user!.teacherId || user!.studentId || 0,
        assignmentType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        loginTime,
        leaveTime,
        earlyLoginAllowance,
        timezone,
        scheduleFrequency,
        scheduleDays,
        scheduleConfig,
      })
      .returning();

    // Create classroom schedule if not exists
    const existingSchedule = await db
      .select()
      .from(classroomSchedules)
      .where(eq(classroomSchedules.classroomId, Number(classroomId)))
      .limit(1);

    if (!existingSchedule.length) {
      await db.insert(classroomSchedules).values({
        classroomId: Number(classroomId),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        startTime: loginTime,
        endTime: leaveTime,
        timezone,
        frequency: scheduleFrequency,
        days: scheduleDays,
        createdBy: user!.id || user!.teacherId || user!.studentId || 0,
      });
    }

    // Create participant record (pre-registration)
    const [participant] = await db
      .insert(classroomParticipants)
      .values({
        classroomId: Number(classroomId),
        userId: Number(userId),
        userRole: targetUser.role,
        assignmentId: assignment.id,
        status: "expected",
        permissions: {},
      })
      .onConflictDoNothing()
      .returning();

    // Update capacity
    if (targetUser.role === "student") {
      await db
        .insert(classroomCapacity)
        .values({
          classroomId: Number(classroomId),
          maxStudents: 30,
          currentCount: 1,
        })
        .onConflictDoUpdate({
          target: classroomCapacity.classroomId,
          set: { currentCount: sql`${classroomCapacity.currentCount} + 1` },
        });
    }

    // Audit log
    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetUserId: Number(userId),
      targetClassroomId: Number(classroomId),
      action: "USER_ASSIGNED",
      details: { assignmentId: assignment.id, assignmentType },
      newState: assignment,
      req,
    });

    return res.status(201).json({ assignment, participant });
  }
);

// Update assignment
router.patch(
  "/v1/classroom-assignments/:id",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const user = getReqUser(req);
    const id = Number(req.params.id);

    const [existing] = await db
      .select()
      .from(classroomAssignments)
      .where(eq(classroomAssignments.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ message: "Assignment not found" });

    const allowed = [
      "assignmentType",
      "status",
      "endDate",
      "loginTime",
      "leaveTime",
      "earlyLoginAllowance",
      "timezone",
      "scheduleFrequency",
      "scheduleDays",
      "scheduleConfig",
    ];
    const set: Record<string, any> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) set[k] = req.body[k];
    }
    if (set.endDate) set.endDate = new Date(set.endDate);

    const [updated] = await db
      .update(classroomAssignments)
      .set(set)
      .where(eq(classroomAssignments.id, id))
      .returning();

    // Update participant if status changed
    if (set.status) {
      await db
        .update(classroomParticipants)
        .set({ status: set.status, updatedAt: new Date() })
        .where(
          and(
            eq(classroomParticipants.classroomId, existing.classroomId),
            eq(classroomParticipants.userId, existing.userId)
          )
        );
    }

    // Update schedule if times changed
    if (set.loginTime || set.leaveTime || set.scheduleDays || set.scheduleFrequency) {
      await db
        .update(classroomSchedules)
        .set({
          startTime: set.loginTime || existing.loginTime,
          endTime: set.leaveTime || existing.leaveTime,
          frequency: set.scheduleFrequency || existing.scheduleFrequency,
          days: set.scheduleDays || existing.scheduleDays,
          timezone: set.timezone || existing.timezone,
          updatedAt: new Date(),
        })
        .where(eq(classroomSchedules.classroomId, existing.classroomId));
    }

    // Audit log
    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetUserId: existing.userId,
      targetClassroomId: existing.classroomId,
      action: "ASSIGNMENT_UPDATED",
      details: { assignmentId: id },
      previousState: existing,
      newState: updated,
      req,
    });

    return res.json({ assignment: updated });
  }
);

// Delete/End assignment
router.delete(
  "/v1/classroom-assignments/:id",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const user = getReqUser(req);
    const id = Number(req.params.id);

    const [existing] = await db
      .select()
      .from(classroomAssignments)
      .where(eq(classroomAssignments.id, id))
      .limit(1);

    if (!existing) return res.status(404).json({ message: "Assignment not found" });

    await db
      .update(classroomAssignments)
      .set({ status: "ended", updatedAt: new Date() })
      .where(eq(classroomAssignments.id, id));

    await db
      .update(classroomParticipants)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(
        and(
          eq(classroomParticipants.classroomId, existing.classroomId),
          eq(classroomParticipants.userId, existing.userId)
        )
    );

    // Update capacity
    if (existing.userRole === "student") {
      await db
        .update(classroomCapacity)
        .set({ currentCount: sql`GREATEST(${classroomCapacity.currentCount} - 1, 0)` })
        .where(eq(classroomCapacity.classroomId, existing.classroomId));
    }

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetUserId: existing.userId,
      targetClassroomId: existing.classroomId,
      action: "ASSIGNMENT_ENDED",
      details: { assignmentId: id },
      previousState: existing,
      req,
    });

    return res.json({ ok: true });
  }
);

/* ═══════════════════════════════════════════════════════════════
   CLASSROOM SCHEDULES
   ══════════════════════════════════════════════════════════════ */

router.get(
  "/v1/classroom-schedules/:classroomId",
  requireRole("admin", "supervisor", "teacher"),
  async (req, res) => {
    const classroomId = Number(req.params.classroomId);
    const schedules = await db
      .select()
      .from(classroomSchedules)
      .where(eq(classroomSchedules.classroomId, classroomId))
      .orderBy(desc(classroomSchedules.createdAt));

    return res.json({ schedules });
  }
);

router.post(
  "/v1/classroom-schedules",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const user = getReqUser(req);
    const {
      classroomId,
      teacherId,
      startDate,
      endDate,
      startTime,
      endTime,
      timezone = "UTC",
      frequency = "weekly",
      days = [],
    } = req.body ?? {};

    if (!classroomId || !startTime || !endTime || !startDate) {
      return res.status(400).json({ message: "classroomId, startTime, endTime, startDate required" });
    }

    const [schedule] = await db
      .insert(classroomSchedules)
      .values({
        classroomId: Number(classroomId),
        teacherId: teacherId ? Number(teacherId) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        startTime,
        endTime,
        timezone,
        frequency,
        days,
        createdBy: user!.id || user!.teacherId || user!.studentId || 0,
      })
      .returning();

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetClassroomId: Number(classroomId),
      action: "SCHEDULE_CREATED",
      newState: schedule,
      req,
    });

    return res.status(201).json({ schedule });
  }
);

router.patch(
  "/v1/classroom-schedules/:id",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const user = getReqUser(req);
    const id = Number(req.params.id);

    const allowed = [
      "teacherId",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "timezone",
      "frequency",
      "days",
      "isActive",
    ];
    const set: Record<string, any> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) set[k] = req.body[k];
    }
    if (set.startDate) set.startDate = new Date(set.startDate);
    if (set.endDate) set.endDate = new Date(set.endDate);

    const [updated] = await db
      .update(classroomSchedules)
      .set(set)
      .where(eq(classroomSchedules.id, id))
      .returning();

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetClassroomId: updated.classroomId,
      action: "SCHEDULE_UPDATED",
      details: { scheduleId: id },
      newState: updated,
      req,
    });

    return res.json({ schedule: updated });
  }
);

/* ══════════════════════════════════════════════════════════════
   CLASSROOM PARTICIPANTS (Real-time roster)
   ══════════════════════════════════════════════════════════════ */

router.get(
  "/v1/classroom-participants/:classroomId",
  async (req, res) => {
    const classroomId = Number(req.params.classroomId);
    const user = getReqUser(req);

    const participants = await db
      .select({
        id: classroomParticipants.id,
        userId: classroomParticipants.userId,
        userRole: classroomParticipants.userRole,
        assignmentId: classroomParticipants.assignmentId,
        status: classroomParticipants.status,
        joinedAt: classroomParticipants.joinedAt,
        leftAt: classroomParticipants.leftAt,
        lastSeenAt: classroomParticipants.lastSeenAt,
        isOnline: classroomParticipants.isOnline,
        permissions: classroomParticipants.permissions,
        userName: appUsers.name,
        userEmail: appUsers.email,
        userRole: appUsers.role,
      })
      .from(classroomParticipants)
      .leftJoin(appUsers, eq(appUsers.id, classroomParticipants.userId))
      .where(eq(classroomParticipants.classroomId, classroomId))
      .orderBy(classroomParticipants.status, appUsers.name);

    return res.json({ participants });
  }
);

// Teacher quick-control: update participant status/permissions
router.patch(
  "/v1/classroom-participants/:participantId",
  requireRole("admin", "supervisor", "teacher"),
  async (req, res) => {
    const user = getReqUser(req);
    const participantId = Number(req.params.participantId);

    const [participant] = await db
      .select()
      .from(classroomParticipants)
      .where(eq(classroomParticipants.id, participantId))
      .limit(1);

    if (!participant) return res.status(404).json({ message: "Participant not found" });

    // Check teacher has access to this classroom
    if (user?.role === "teacher") {
      const [assignment] = await db
        .select()
        .from(classroomAssignments)
        .where(
          and(
            eq(classroomAssignments.userId, user.teacherId || 0),
            eq(classroomAssignments.classroomId, participant.classroomId),
            eq(classroomAssignments.status, "active")
          )
        )
        .limit(1);

      if (!assignment) {
        return res.status(403).json({ message: "Not authorized for this classroom" });
      }
    }

    const allowed = ["status", "permissions", "isOnline"];
    const set: Record<string, any> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) set[k] = req.body[k];
    }

    const [updated] = await db
      .update(classroomParticipants)
      .set(set)
      .where(eq(classroomParticipants.id, participantId))
      .returning();

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetUserId: participant.userId,
      targetClassroomId: participant.classroomId,
      action: "PARTICIPANT_UPDATED",
      details: { participantId, changes: set },
      req,
    });

    return res.json({ participant: updated });
  }
);

/* ══════════════════════════════════════════════════════════════
   PARTICIPANT PERMISSIONS (Force controls)
   ══════════════════════════════════════════════════════════════ */

const VALID_FEATURES = [
  "microphone",
  "camera",
  "screen_share",
  "whiteboard",
  "chat",
  "presenter",
  "file_share",
  "annotation",
  "recording",
  "breakout",
  "polls",
  "quiz",
  "raise_hand",
];

router.post(
  "/v1/classroom-participants/:participantId/permissions",
  requireRole("admin", "supervisor", "teacher"),
  async (req, res) => {
    const user = getReqUser(req);
    const participantId = Number(req.params.participantId);
    const { feature, action, expiresAt } = req.body ?? {};

    if (!feature || !action || !VALID_FEATURES.includes(feature)) {
      return res.status(400).json({ message: "Valid feature and action required" });
    }
    if (!["allow", "deny", "force_allow", "force_deny"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const [participant] = await db
      .select()
      .from(classroomParticipants)
      .where(eq(classroomParticipants.id, participantId))
      .limit(1);

    if (!participant) return res.status(404).json({ message: "Participant not found" });

    // Check teacher authorization
    if (user?.role === "teacher") {
      const [assignment] = await db
        .select()
        .from(classroomAssignments)
        .where(
          and(
            eq(classroomAssignments.userId, user.teacherId || 0),
            eq(classroomAssignments.classroomId, participant.classroomId),
            eq(classroomAssignments.status, "active")
          )
        )
        .limit(1);

      if (!assignment) {
        return res.status(403).json({ message: "Not authorized for this classroom" });
      }
    }

    const [permission] = await db
      .insert(participantPermissions)
      .values({
        participantId,
        classroomId: participant.classroomId,
        feature,
        action,
        setBy: user!.id || user!.teacherId || user!.studentId || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .onConflictDoUpdate({
        target: [participantPermissions.participantId, participantPermissions.classroomId, participantPermissions.feature],
        set: { action, setBy: user!.id || user!.teacherId || user!.studentId || 0, expiresAt: expiresAt ? new Date(expiresAt) : null },
      })
      .returning();

    // Update participant's permissions cache
    const currentPerms = participant.permissions || {};
    currentPerms[feature] = action;
    await db
      .update(classroomParticipants)
      .set({ permissions: currentPerms, updatedAt: new Date() })
      .where(eq(classroomParticipants.id, participantId));

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetUserId: participant.userId,
      targetClassroomId: participant.classroomId,
      action: "PERMISSION_SET",
      details: { feature, action, participantId },
      req,
    });

    return res.json({ permission });
  }
);

router.get(
  "/v1/classroom-participants/:participantId/permissions",
  async (req, res) => {
    const participantId = Number(req.params.participantId);

    const permissions = await db
      .select()
      .from(participantPermissions)
      .where(eq(participantPermissions.participantId, participantId));

    return res.json({ permissions });
  }
);

router.delete(
  "/v1/classroom-participants/:participantId/permissions/:feature",
  requireRole("admin", "supervisor", "teacher"),
  async (req, res) => {
    const user = getReqUser(req);
    const participantId = Number(req.params.participantId);
    const feature = req.params.feature;

    await db
      .delete(participantPermissions)
      .where(
        and(
          eq(participantPermissions.participantId, participantId),
          eq(participantPermissions.feature, feature)
        )
      );

    const [participant] = await db
      .select()
      .from(classroomParticipants)
      .where(eq(classroomParticipants.id, participantId))
      .limit(1);

    if (participant) {
      const currentPerms = participant.permissions || {};
      delete currentPerms[feature];
      await db
        .update(classroomParticipants)
        .set({ permissions: currentPerms, updatedAt: new Date() })
        .where(eq(classroomParticipants.id, participantId));
    }

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      action: "PERMISSION_REMOVED",
      details: { feature, participantId },
      req,
    });

    return res.json({ ok: true });
  }
);

/* ══════════════════════════════════════════════════════════════
   CLASSROOM TRANSFERS (Temporary moves)
   ══════════════════════════════════════════════════════════════ */

router.post(
  "/v1/classroom-transfers",
  requireRole("admin", "supervisor", "teacher"),
  async (req, res) => {
    const user = getReqUser(req);
    const { participantId, toClassroomId, reason, isTemporary = true, autoReturnAt } = req.body ?? {};

    if (!participantId || !toClassroomId) {
      return res.status(400).json({ message: "participantId and toClassroomId required" });
    }

    const [participant] = await db
      .select()
      .from(classroomParticipants)
      .where(eq(classroomParticipants.id, Number(participantId)))
      .limit(1);

    if (!participant) return res.status(404).json({ message: "Participant not found" });

    // Check teacher authorization
    if (user?.role === "teacher") {
      const [assignment] = await db
        .select()
        .from(classroomAssignments)
        .where(
          and(
            eq(classroomAssignments.userId, user.teacherId || 0),
            eq(classroomAssignments.classroomId, participant.classroomId),
            eq(classroomAssignments.status, "active")
          )
        )
        .limit(1);

      if (!assignment) {
        return res.status(403).json({ message: "Not authorized for this classroom" });
      }
    }

    // Check target classroom access policy
    const [policy] = await db
      .select()
      .from(classroomAccessPolicies)
      .where(eq(classroomAccessPolicies.classroomId, Number(toClassroomId)))
      .limit(1);

    if (policy && !policy.allowedClassroomIds?.includes(participant.classroomId)) {
      // Check if Room 1 access is allowed
      if (toClassroomId !== 1 || !policy.allowRoom1Access) {
        return res.status(403).json({ message: "Target classroom access not allowed" });
      }
    }

    const originalClassroomId = isTemporary ? participant.classroomId : null;

    const [transfer] = await db
      .insert(classroomTransfers)
      .values({
        participantId: Number(participantId),
        fromClassroomId: participant.classroomId,
        toClassroomId: Number(toClassroomId),
        transferredBy: user!.id || user!.teacherId || user!.studentId || 0,
        reason,
        isTemporary,
        originalClassroomId,
        autoReturnAt: autoReturnAt ? new Date(autoReturnAt) : null,
      })
      .returning();

    // Update participant's classroom
    await db
      .update(classroomParticipants)
      .set({ classroomId: Number(toClassroomId), updatedAt: new Date() })
      .where(eq(classroomParticipants.id, Number(participantId)));

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetUserId: participant.userId,
      targetClassroomId: Number(toClassroomId),
      action: "PARTICIPANT_TRANSFERRED",
      details: { transferId: transfer.id, fromClassroomId: participant.classroomId, isTemporary },
      req,
    });

    return res.status(201).json({ transfer });
  }
);

router.get(
  "/v1/classroom-transfers/:participantId",
  async (req, res) => {
    const participantId = Number(req.params.participantId);

    const transfers = await db
      .select()
      .from(classroomTransfers)
      .where(eq(classroomTransfers.participantId, participantId))
      .orderBy(desc(classroomTransfers.startedAt));

    return res.json({ transfers });
  }
);

router.patch(
  "/v1/classroom-transfers/:id/return",
  requireRole("admin", "supervisor", "teacher"),
  async (req, res) => {
    const user = getReqUser(req);
    const id = Number(req.params.id);

    const [transfer] = await db
      .select()
      .from(classroomTransfers)
      .where(eq(classroomTransfers.id, id))
      .limit(1);

    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    if (!transfer.isTemporary) return res.status(400).json({ message: "Not a temporary transfer" });

    await db
      .update(classroomTransfers)
      .set({ endedAt: new Date() })
      .where(eq(classroomTransfers.id, id));

    // Return participant to original classroom
    if (transfer.originalClassroomId) {
      await db
        .update(classroomParticipants)
        .set({ classroomId: transfer.originalClassroomId, updatedAt: new Date() })
        .where(eq(classroomParticipants.id, transfer.participantId));
    }

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetUserId: (await db.select({ userId: classroomParticipants.userId }).from(classroomParticipants).where(eq(classroomParticipants.id, transfer.participantId)).limit(1))[0]?.userId,
      targetClassroomId: transfer.originalClassroomId,
      action: "PARTICIPANT_RETURNED",
      details: { transferId: id },
      req,
    });

    return res.json({ ok: true });
  }
);

/* ══════════════════════════════════════════════════════════════
   CLASSROOM ACCESS POLICIES
   ══════════════════════════════════════════════════════════════ */

router.get(
  "/v1/classroom-access-policies/:classroomId",
  async (req, res) => {
    const classroomId = Number(req.params.classroomId);

    let [policy] = await db
      .select()
      .from(classroomAccessPolicies)
      .where(eq(classroomAccessPolicies.classroomId, classroomId))
      .limit(1);

    if (!policy) {
      // Create default policy
      [policy] = await db
        .insert(classroomAccessPolicies)
        .values({ classroomId })
        .returning();
    }

    return res.json({ policy });
  }
);

router.patch(
  "/v1/classroom-access-policies/:classroomId",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const user = getReqUser(req);
    const classroomId = Number(req.params.classroomId);

    const allowed = [
      "allowRoom1Access",
      "room1Policy",
      "allowedClassroomIds",
      "requireTeacherApproval",
      "capacity",
      "allowOverride",
      "isLocked",
      "lockReason",
    ];
    const set: Record<string, any> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) set[k] = req.body[k];
    }

    const [policy] = await db
      .insert(classroomAccessPolicies)
      .values({ classroomId, ...set })
      .onConflictDoUpdate({
        target: classroomAccessPolicies.classroomId,
        set,
      })
      .returning();

    // Update capacity table
    if (set.capacity) {
      await db
        .insert(classroomCapacity)
        .values({ classroomId, maxStudents: set.capacity })
        .onConflictDoUpdate({
          target: classroomCapacity.classroomId,
          set: { maxStudents: set.capacity },
        });
    }

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetClassroomId: classroomId,
      action: "ACCESS_POLICY_UPDATED",
      newState: policy,
      req,
    });

    return res.json({ policy });
  }
);

/* ══════════════════════════════════════════════════════════════
   CLASSROOM CAPACITY
   ══════════════════════════════════════════════════════════════ */

router.get(
  "/v1/classroom-capacity/:classroomId",
  async (req, res) => {
    const classroomId = Number(req.params.classroomId);

    let [capacity] = await db
      .select()
      .from(classroomCapacity)
      .where(eq(classroomCapacity.classroomId, classroomId))
      .limit(1);

    if (!capacity) {
      [capacity] = await db
        .insert(classroomCapacity)
        .values({ classroomId, maxStudents: 30 })
        .returning();
    }

    return res.json({ capacity });
  }
);

/* ══════════════════════════════════════════════════════════════
   CLASSROOM AUDIT LOGS
   ══════════════════════════════════════════════════════════════ */

router.get(
  "/v1/classroom-audit-logs",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const { classroomId, userId, action, page = "1", limit = "50" } = req.query;

    const conditions = [];
    if (classroomId) conditions.push(eq(classroomAuditLogs.targetClassroomId, Number(classroomId)));
    if (userId) conditions.push(eq(classroomAuditLogs.targetUserId, Number(userId)));
    if (action) conditions.push(eq(classroomAuditLogs.action, action));

    const offset = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      db
        .select()
        .from(classroomAuditLogs)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(classroomAuditLogs.createdAt))
        .limit(Number(limit))
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(classroomAuditLogs)
        .where(conditions.length ? and(...conditions) : undefined),
    ]);

    return res.json({ logs, total: total[0]?.count || 0, page: Number(page), limit: Number(limit) });
  }
);

/* ══════════════════════════════════════════════════════════════
   ELIGIBLE USERS FOR ASSIGNMENT (from Users Management)
   ══════════════════════════════════════════════════════════════ */

router.get(
  "/v1/classroom-assignments/eligible-users",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const { role, search, classroomId, excludeAssigned } = req.query;

    const conditions = [];
    if (role) conditions.push(eq(appUsers.role, role as "student" | "teacher"));
    else conditions.push(inArray(appUsers.role, ["student", "teacher"]));
    conditions.push(eq(appUsers.status, "active"));

    if (search) {
      conditions.push(
        or(
          sql`${appUsers.name} ILIKE ${"%" + search + "%"}`,
          sql`${appUsers.email} ILIKE ${"%" + search + "%"}`
        )
      );
    }

    let users = await db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        name: appUsers.name,
        role: appUsers.role,
        status: appUsers.status,
        teacherId: appUsers.teacherId,
        studentId: appUsers.studentId,
        lastSeen: appUsers.lastSeen,
      })
      .from(appUsers)
      .where(and(...conditions))
      .orderBy(appUsers.name);

    // Add current classroom info
    if (classroomId) {
      const assignments = await db
        .select({ userId: classroomAssignments.userId, classroomId: classroomAssignments.classroomId })
        .from(classroomAssignments)
        .where(
          and(
            eq(classroomAssignments.classroomId, Number(classroomId)),
            eq(classroomAssignments.status, "active")
          )
        );

      const assignedIds = new Set(assignments.map((a) => a.userId));
      users = users.map((u) => ({ ...u, currentClassroom: assignedIds.has(u.id) ? Number(classroomId) : null, isAssigned: assignedIds.has(u.id) }));
    }

    if (excludeAssigned === "true" && classroomId) {
      users = users.filter((u) => !u.isAssigned);
    }

    return res.json({ users });
  }
);

/* ══════════════════════════════════════════════════════════════
   BULK ASSIGNMENT
   ══════════════════════════════════════════════════════════════ */

router.post(
  "/v1/classroom-assignments/bulk",
  requireRole("admin", "supervisor"),
  async (req, res) => {
    const user = getReqUser(req);
    const { userIds, classroomId, assignmentType = "permanent", startDate, endDate, loginTime, leaveTime, earlyLoginAllowance = 0, timezone = "UTC", scheduleFrequency = "weekly", scheduleDays = [] } = req.body ?? {};

    if (!userIds?.length || !classroomId || !loginTime || !leaveTime || !startDate) {
      return res.status(400).json({ message: "userIds[], classroomId, loginTime, leaveTime, startDate required" });
    }

    const results = { success: [], failed: [] };

    for (const userId of userIds) {
      try {
        // Check conflict
        const conflict = await checkScheduleConflict(
          Number(userId),
          Number(classroomId),
          loginTime,
          leaveTime,
          scheduleDays,
          new Date(startDate),
          endDate ? new Date(endDate) : null
        );

        if (conflict.conflict) {
          results.failed.push({ userId, reason: conflict.message });
          continue;
        }

        // Create assignment
        const [targetUser] = await db.select().from(appUsers).where(eq(appUsers.id, Number(userId))).limit(1);
        if (!targetUser || !["student", "teacher"].includes(targetUser.role)) {
          results.failed.push({ userId, reason: "Invalid user or role" });
          continue;
        }

        const [assignment] = await db
          .insert(classroomAssignments)
          .values({
            userId: Number(userId),
            userRole: targetUser.role,
            classroomId: Number(classroomId),
            assignedBy: user!.id || user!.teacherId || user!.studentId || 0,
            assignmentType,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            loginTime,
            leaveTime,
            earlyLoginAllowance,
            timezone,
            scheduleFrequency,
            scheduleDays,
          })
          .returning();

        // Create participant
        await db
          .insert(classroomParticipants)
          .values({
            classroomId: Number(classroomId),
            userId: Number(userId),
            userRole: targetUser.role,
            assignmentId: assignment.id,
            status: "expected",
          })
          .onConflictDoNothing();

        // Update capacity
        if (targetUser.role === "student") {
          await db
            .insert(classroomCapacity)
            .values({ classroomId: Number(classroomId), maxStudents: 30, currentCount: 1 })
            .onConflictDoUpdate({ target: classroomCapacity.classroomId, set: { currentCount: sql`${classroomCapacity.currentCount} + 1` } });
        }

        results.success.push({ userId, assignmentId: assignment.id });
      } catch (err) {
        results.failed.push({ userId, reason: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    await logAudit({
      performedBy: user!.id || user!.teacherId || user!.studentId || 0,
      targetClassroomId: Number(classroomId),
      action: "BULK_ASSIGNMENT",
      details: { success: results.success.length, failed: results.failed.length },
      req,
    });

    return res.json({ results });
  }
);

/* ══════════════════════════════════════════════════════════════
   CLASSROOMS LIST
   ══════════════════════════════════════════════════════════════ */

router.get(
  "/v1/classroom-assignments/classrooms",
  requireRole("admin", "supervisor"),
  async (_req, res) => {
    const rooms = await db
      .select({
        id: classrooms.id,
        roomId: classrooms.roomId,
        label: classrooms.label,
        status: classrooms.status,
        active: classrooms.active,
        courseId: classrooms.courseId,
        courseName: courses.name,
      })
      .from(classrooms)
      .leftJoin(courses, eq(classrooms.courseId, courses.id))
      .orderBy(classrooms.roomId);

    return res.json({ classrooms: rooms });
  }
);

export default router;