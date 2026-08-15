import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";

export const assignmentTypeEnum = pgEnum("assignment_type", [
  "permanent",
  "temporary",
]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "active",
  "inactive",
  "ended",
  "suspended",
]);

export const scheduleFrequencyEnum = pgEnum("schedule_frequency", [
  "once",
  "daily",
  "weekly",
  "custom",
]);

export const participantStatusEnum = pgEnum("participant_status", [
  "expected",
  "active",
  "inactive",
  "disconnected",
  "removed",
  "transferred",
]);

export const permissionActionEnum = pgEnum("permission_action", [
  "allow",
  "deny",
  "force_allow",
  "force_deny",
]);

export const classroomAssignments = pgTable(
  "classroom_assignments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    userRole: text("user_role")
      .$type<"student" | "teacher">()
      .notNull(),
    classroomId: integer("classroom_id").notNull(),
    assignedBy: integer("assigned_by").notNull(),
    assignmentType: assignmentTypeEnum("assignment_type")
      .notNull()
      .default("permanent"),
    status: assignmentStatusEnum("status").notNull().default("active"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    loginTime: text("login_time").notNull(),
    leaveTime: text("leave_time").notNull(),
    earlyLoginAllowance: integer("early_login_allowance").default(0),
    timezone: text("timezone").default("UTC"),
    scheduleFrequency: scheduleFrequencyEnum("schedule_frequency")
      .notNull()
      .default("weekly"),
    scheduleDays: integer("schedule_days").array(),
    scheduleConfig: jsonb("schedule_config"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("uq_classroom_assignment_user_classroom_date").on(
      t.userId,
      t.classroomId,
      t.startDate
    ),
  ]
);

export const classroomSchedules = pgTable(
  "classroom_schedules",
  {
    id: serial("id").primaryKey(),
    classroomId: integer("classroom_id").notNull(),
    teacherId: integer("teacher_id"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    timezone: text("timezone").default("UTC"),
    frequency: scheduleFrequencyEnum("frequency").notNull().default("weekly"),
    days: integer("days").array(),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: integer("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const classroomParticipants = pgTable(
  "classroom_participants",
  {
    id: serial("id").primaryKey(),
    classroomId: integer("classroom_id").notNull(),
    userId: integer("user_id").notNull(),
    userRole: text("user_role")
      .$type<"student" | "teacher">()
      .notNull(),
    assignmentId: integer("assignment_id"),
    status: participantStatusEnum("status").notNull().default("expected"),
    joinedAt: timestamp("joined_at"),
    leftAt: timestamp("left_at"),
    lastSeenAt: timestamp("last_seen_at"),
    isOnline: boolean("is_online").notNull().default(false),
    permissions: jsonb("permissions").$type<Record<string, string>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("uq_classroom_participant_user_classroom").on(
      t.classroomId,
      t.userId
    ),
  ]
);

export const participantPermissions = pgTable(
  "participant_permissions",
  {
    id: serial("id").primaryKey(),
    participantId: integer("participant_id").notNull(),
    classroomId: integer("classroom_id").notNull(),
    feature: text("feature").notNull(),
    action: permissionActionEnum("action").notNull().default("allow"),
    setBy: integer("set_by").notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export const classroomTransfers = pgTable(
  "classroom_transfers",
  {
    id: serial("id").primaryKey(),
    participantId: integer("participant_id").notNull(),
    fromClassroomId: integer("from_classroom_id").notNull(),
    toClassroomId: integer("to_classroom_id").notNull(),
    transferredBy: integer("transferred_by").notNull(),
    reason: text("reason"),
    isTemporary: boolean("is_temporary").notNull().default(true),
    originalClassroomId: integer("original_classroom_id"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    autoReturnAt: timestamp("auto_return_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export const classroomAccessPolicies = pgTable(
  "classroom_access_policies",
  {
    id: serial("id").primaryKey(),
    classroomId: integer("classroom_id").notNull().unique(),
    allowRoom1Access: boolean("allow_room1_access").notNull().default(true),
    room1Policy: text("room1_policy")
      .$type<"always" | "scheduled" | "assigned_only" | "waiting_room" | "emergency">()
      .notNull()
      .default("always"),
    allowedClassroomIds: integer("allowed_classroom_ids").array(),
    requireTeacherApproval: boolean("require_teacher_approval").notNull().default(false),
    capacity: integer("capacity").default(30),
    allowOverride: boolean("allow_override").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false),
    lockReason: text("lock_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const classroomAuditLogs = pgTable(
  "classroom_audit_logs",
  {
    id: serial("id").primaryKey(),
    performedBy: integer("performed_by").notNull(),
    targetUserId: integer("target_user_id"),
    targetClassroomId: integer("target_classroom_id"),
    action: text("action").notNull(),
    details: jsonb("details"),
    previousState: jsonb("previous_state"),
    newState: jsonb("new_state"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export const classroomCapacity = pgTable(
  "classroom_capacity",
  {
    id: serial("id").primaryKey(),
    classroomId: integer("classroom_id").notNull().unique(),
    maxStudents: integer("max_students").notNull().default(30),
    currentCount: integer("current_count").notNull().default(0),
    allowWaitlist: boolean("allow_waitlist").notNull().default(false),
    waitlistCount: integer("waitlist_count").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export type ClassroomAssignment = typeof classroomAssignments.$inferSelect;
export type ClassroomSchedule = typeof classroomSchedules.$inferSelect;
export type ClassroomParticipant = typeof classroomParticipants.$inferSelect;
export type ParticipantPermission = typeof participantPermissions.$inferSelect;
export type ClassroomTransfer = typeof classroomTransfers.$inferSelect;
export type ClassroomAccessPolicy = typeof classroomAccessPolicies.$inferSelect;
export type ClassroomAuditLog = typeof classroomAuditLogs.$inferSelect;
export type ClassroomCapacity = typeof classroomCapacity.$inferSelect;