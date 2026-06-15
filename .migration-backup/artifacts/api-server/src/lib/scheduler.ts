import { and, eq, isNull } from "drizzle-orm";
import cron from "node-cron";
import {
  db,
  courses,
  teachers,
  assessmentSheets,
  calendarEvents,
  tasks,
  notifications,
  messages,
  reports,
  evalTemplates,
  evalSheets,
} from "@workspace/db";
import { addDaysISO, todayISO } from "./teaching-days";
import { generateReportsForSheet } from "./reports";
import { deliverReport, createGoogleCalendarEvent } from "./google";
import { logger } from "./logger";

async function notifyIfNew(values: {
  audienceRole: string;
  recipientEmail?: string | null;
  title: string;
  body: string;
  category: string;
  icon: string;
  dedupeKey: string;
}): Promise<void> {
  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.dedupeKey, values.dedupeKey))
    .limit(1);
  if (existing) return;
  await db.insert(notifications).values(values);
}

async function messageIfNew(values: {
  threadKey: string;
  toEmail?: string | null;
  toRole?: string | null;
  body: string;
  dedupeKey: string;
}): Promise<void> {
  const [existing] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.dedupeKey, values.dedupeKey))
    .limit(1);
  if (existing) return;
  await db.insert(messages).values(values);
}

// Ensure each sheet has its milestone calendar event, reminder calendar event,
// and a teacher task. Idempotent via dedupeKey unique constraints.
export async function reconcileSheets(): Promise<void> {
  const sheets = await db.select().from(assessmentSheets);
  for (const sheet of sheets) {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, sheet.courseId))
      .limit(1);
    if (!course) continue;
    const teacher = course.teacherId
      ? (
          await db
            .select()
            .from(teachers)
            .where(eq(teachers.id, course.teacherId))
            .limit(1)
        )[0]
      : null;

    const phaseLabel = sheet.phase === "first" ? "First-Week" : "Last-Week";
    const reminderDate = addDaysISO(sheet.dueDate, -1);

    await db
      .insert(calendarEvents)
      .values({
        title: `${phaseLabel} Assessment — ${course.name}`,
        description: `Teaching day ${sheet.teachingDay}. Submit the ${phaseLabel.toLowerCase()} assessment sheet.`,
        date: sheet.dueDate,
        type: "milestone",
        courseId: course.id,
        dedupeKey: `cal:milestone:${sheet.id}`,
      })
      .onConflictDoNothing();

    await db
      .insert(calendarEvents)
      .values({
        title: `Reminder: ${phaseLabel} Assessment — ${course.name}`,
        description: `Reminder — the ${phaseLabel.toLowerCase()} assessment sheet is due tomorrow (teaching day ${sheet.teachingDay}).`,
        date: reminderDate,
        type: "reminder",
        courseId: course.id,
        dedupeKey: `cal:reminder:${sheet.id}`,
      })
      .onConflictDoNothing();

    await db
      .insert(tasks)
      .values({
        title: `Fill ${phaseLabel} assessment — ${course.name}`,
        description: `Score every student 1–5 on each criterion, then submit. Due ${sheet.dueDate} (teaching day ${sheet.teachingDay}).`,
        assigneeType: "teacher",
        assigneeId: teacher?.id ?? null,
        courseId: course.id,
        sheetId: sheet.id,
        dueDate: sheet.dueDate,
        type: "assessment_reminder",
        status: sheet.status === "open" ? "pending" : "done",
        dedupeKey: `task:${sheet.id}`,
      })
      .onConflictDoNothing();
  }
}

// Fire reminders for open sheets whose reminder date has arrived, and mark
// sheets overdue. Idempotent via dedupeKey existence checks.
export async function runDueReminders(): Promise<number> {
  const today = todayISO();
  const sheets = await db.select().from(assessmentSheets);
  let fired = 0;
  for (const sheet of sheets) {
    if (sheet.status !== "open") continue;
    const reminderDate = addDaysISO(sheet.dueDate, -1);
    if (reminderDate > today) continue; // not yet time

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, sheet.courseId))
      .limit(1);
    if (!course) continue;
    const teacher = course.teacherId
      ? (
          await db
            .select()
            .from(teachers)
            .where(eq(teachers.id, course.teacherId))
            .limit(1)
        )[0]
      : null;

    const phaseLabel = sheet.phase === "first" ? "First-Week" : "Last-Week";
    const overdue = sheet.dueDate < today;
    const title = overdue
      ? `Overdue: ${phaseLabel} assessment — ${course.name}`
      : `Reminder: ${phaseLabel} assessment — ${course.name}`;
    const body = overdue
      ? `The ${phaseLabel.toLowerCase()} assessment sheet for ${course.name} was due ${sheet.dueDate}. Please submit it.`
      : `The ${phaseLabel.toLowerCase()} assessment sheet for ${course.name} is due ${sheet.dueDate} (teaching day ${sheet.teachingDay}).`;

    await notifyIfNew({
      audienceRole: "teacher",
      recipientEmail: teacher?.email ?? null,
      title,
      body,
      category: "assessment",
      icon: "📋",
      dedupeKey: `notif:reminder:${sheet.id}`,
    });
    await notifyIfNew({
      audienceRole: "admin",
      title,
      body,
      category: "assessment",
      icon: "📋",
      dedupeKey: `notif:reminder:admin:${sheet.id}`,
    });
    await messageIfNew({
      threadKey: teacher?.email ?? "system",
      toEmail: teacher?.email ?? null,
      toRole: "teacher",
      body: `${title} — ${body}`,
      dedupeKey: `msg:reminder:${sheet.id}`,
    });
    fired++;
  }
  return fired;
}

// On/after the milestone day, if the sheet is submitted and reports haven't
// been generated yet, generate + deliver them, and announce readiness.
export async function runMilestones(): Promise<number> {
  const today = todayISO();
  const sheets = await db.select().from(assessmentSheets);
  let processed = 0;
  for (const sheet of sheets) {
    if (sheet.status === "open") continue;
    if (sheet.reportsGeneratedAt) continue;
    if (sheet.dueDate > today) continue;

    await generateReportsForSheet(sheet.id);
    const sheetReports = await db
      .select()
      .from(reports)
      .where(eq(reports.sheetId, sheet.id));
    for (const r of sheetReports) await deliverReport(r, sheet.termLabel);

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, sheet.courseId))
      .limit(1);
    await notifyIfNew({
      audienceRole: "admin",
      title: `Reports ready — ${course?.name ?? "course"}`,
      body: `Assessment reports for ${course?.name ?? "the course"} have been generated and queued for delivery.`,
      category: "assessment",
      icon: "✅",
      dedupeKey: `notif:reportready:${sheet.id}`,
    });
    processed++;
  }
  return processed;
}

// Push local calendar events to Google Calendar and persist the returned event
// id. Selecting only rows whose googleEventId is still null makes this both the
// create path (new events) and the backfill path (events made while Calendar was
// disconnected) — it is naturally idempotent because synced rows are excluded.
// When Calendar isn't connected, createGoogleCalendarEvent returns null and the
// row stays unsynced for a later tick once authorization is granted.
export async function syncCalendarToGoogle(): Promise<number> {
  const events = await db
    .select()
    .from(calendarEvents)
    .where(isNull(calendarEvents.googleEventId));
  let synced = 0;
  for (const ev of events) {
    const googleEventId = await createGoogleCalendarEvent({
      summary: ev.title,
      description: ev.description ?? undefined,
      date: ev.date,
    });
    if (!googleEventId) continue;
    await db
      .update(calendarEvents)
      .set({ googleEventId })
      .where(eq(calendarEvents.id, ev.id));
    synced++;
  }
  return synced;
}

export async function tick(): Promise<{
  reminders: number;
  milestones: number;
  calendarSynced: number;
}> {
  await reconcileSheets();
  const reminders = await runDueReminders();
  const milestones = await runMilestones();
  const calendarSynced = await syncCalendarToGoogle();
  logger.info(
    { reminders, milestones, calendarSynced },
    "scheduler tick complete",
  );
  return { reminders, milestones, calendarSynced };
}

// Label of the current teaching week, anchored to its Saturday (week start).
function currentWeekLabel(): string {
  const d = new Date();
  const back = (d.getUTCDay() - 6 + 7) % 7; // days since most recent Saturday
  d.setUTCDate(d.getUTCDate() - back);
  return `Week of ${d.toISOString().slice(0, 10)}`;
}

// Thursday job: ensure the current week's evaluation sheet exists for each
// active template and remind the academic / assessor to complete it. Idempotent
// via dedupeKey. Returns counts for the manual-trigger response.
export async function weeklyEvalTick(): Promise<{
  ensured: number;
  notified: number;
  calendarSynced: number;
}> {
  const templates = await db
    .select()
    .from(evalTemplates)
    .where(eq(evalTemplates.active, true));
  let ensured = 0;
  let notified = 0;
  for (const tpl of templates) {
    const week = tpl.layout === "weekly" ? currentWeekLabel() : "";
    const termLabel = tpl.termLabel || "Term 3 — 2026";

    let [sheet] = await db
      .select()
      .from(evalSheets)
      .where(
        and(
          eq(evalSheets.templateId, tpl.id),
          eq(evalSheets.termLabel, termLabel),
          eq(evalSheets.weekLabel, week),
        ),
      )
      .limit(1);
    if (!sheet) {
      const [row] = await db
        .insert(evalSheets)
        .values({ templateId: tpl.id, termLabel, weekLabel: week, status: "open" })
        .onConflictDoNothing({
          target: [
            evalSheets.templateId,
            evalSheets.termLabel,
            evalSheets.weekLabel,
          ],
        })
        .returning();
      sheet = row;
      if (sheet) ensured++;
    }
    if (!sheet) continue;

    await notifyIfNew({
      audienceRole: "admin",
      title: `Weekly teacher evaluation due — ${tpl.name}`,
      body: `It's Thursday. Please complete the teacher performance evaluation (${tpl.name}${week ? ` · ${week}` : ""}) and submit it so reports are sent to each teacher.`,
      category: "evaluation",
      icon: "📝",
      dedupeKey: `notif:teval:${sheet.id}`,
    });
    await messageIfNew({
      threadKey: "academic",
      toRole: "supervisor",
      body: `Weekly teacher evaluation reminder — ${tpl.name}${week ? ` · ${week}` : ""}. Please complete and submit.`,
      dedupeKey: `msg:teval:${sheet.id}`,
    });
    await db
      .insert(calendarEvents)
      .values({
        title: `Weekly teacher evaluation — ${tpl.name}`,
        description: `Complete and submit the teacher performance evaluation (${tpl.name}${week ? ` · ${week}` : ""}) so reports are sent to each teacher.`,
        date: todayISO(),
        type: "reminder",
        dedupeKey: `cal:teval:${sheet.id}`,
      })
      .onConflictDoNothing();
    notified++;
  }
  const calendarSynced = await syncCalendarToGoogle();
  logger.info({ ensured, notified, calendarSynced }, "weekly eval tick complete");
  return { ensured, notified, calendarSynced };
}

export function startScheduler(): void {
  // Daily at 06:00 server time.
  cron.schedule("0 6 * * *", () => {
    tick().catch((err) => logger.error({ err }, "scheduled tick failed"));
  });
  // Thursday at 06:00 — weekly teacher-evaluation reminder.
  cron.schedule("0 6 * * 4", () => {
    weeklyEvalTick().catch((err) =>
      logger.error({ err }, "weekly eval tick failed"),
    );
  });
  logger.info("assessment scheduler started (daily 06:00, weekly Thu 06:00)");
}
