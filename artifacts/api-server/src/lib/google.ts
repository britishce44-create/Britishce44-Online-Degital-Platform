import { and, eq, or } from "drizzle-orm";
import { db, reports, type Report } from "@workspace/db";
import { addDaysISO } from "./teaching-days";
import { google } from "googleapis";
import { logger } from "./logger";

const SENDER = "britishce44@gmail.com";

function getOAuth2Client(): typeof google.auth.OAuth2.prototype | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

export interface GoogleStatus {
  gmail: boolean;
  drive: boolean;
  calendar: boolean;
  connected: boolean;
  sender: string;
}

export async function googleStatus(): Promise<GoogleStatus> {
  const client = getOAuth2Client();
  return { gmail: !!client, drive: !!client, calendar: !!client, connected: !!client, sender: SENDER };
}

async function gmailClient(): Promise<typeof google.gmail.prototype | null> {
  const auth = getOAuth2Client();
  if (!auth) return null;
  return google.gmail({ version: "v1", auth });
}

async function driveClient(): Promise<typeof google.drive.prototype | null> {
  const auth = getOAuth2Client();
  if (!auth) return null;
  return google.drive({ version: "v3", auth });
}

async function calendarClient(): Promise<typeof google.calendar.prototype | null> {
  const auth = getOAuth2Client();
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
}

function buildMime(to: string, subject: string, body: string): string {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
  const lines = [
    `From: Britishce44 <${SENDER}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body, "utf-8").toString("base64"),
  ];
  const raw = lines.join("\r\n");
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function ensureDriveFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string,
): Promise<string> {
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    parentId ? `'${parentId}' in parents` : "'root' in parents",
  ].join(" and ");
  const found = await drive.files.list({
    q,
    fields: "files(id,name)",
    spaces: "drive",
  });
  if (found.data.files?.length) return found.data.files[0].id as string;
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: "id",
  });
  return created.data.id as string;
}

function subjectFor(r: Report): string {
  if (r.kind === "teacher_eval")
    return `Teacher Performance Evaluation — ${r.recipientName || ""}`.trim();
  return r.audience === "parent"
    ? `تقرير أداء الطالب — ${r.recipientName || ""}`.trim()
    : `Student Performance Report — ${r.recipientName || ""}`.trim();
}

// Attempt email + Drive archive for one report; persist resulting statuses.
// When Google isn't connected the report keeps emailStatus/driveStatus
// 'pending' so flushPendingDeliveries() can complete it after authorization.
export async function deliverReport(
  r: Report,
  termLabel: string,
): Promise<{ email: string; drive: string }> {
  let emailResult = r.emailStatus;
  let driveResult = r.driveStatus;

  // Email
  if (r.emailStatus !== "sent") {
    try {
      const gmail = await gmailClient();
      if (!gmail) {
        emailResult = "pending";
      } else {
        const raw = buildMime(r.recipientEmail, subjectFor(r), r.body);
        await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
        emailResult = "sent";
        await db
          .update(reports)
          .set({
            emailStatus: "sent",
            sentAt: new Date(),
            emailError: null,
            status: "sent",
            updatedAt: new Date(),
          })
          .where(eq(reports.id, r.id));
      }
    } catch (err) {
      emailResult = "failed";
      await db
        .update(reports)
        .set({
          emailStatus: "failed",
          emailError: err instanceof Error ? err.message : "send failed",
          updatedAt: new Date(),
        })
        .where(eq(reports.id, r.id));
      logger.warn({ err, reportId: r.id }, "email send failed");
    }
  }

  // Drive archive (organized by term / audience)
  if (r.driveStatus !== "archived") {
    try {
      const drive = await driveClient();
      if (!drive) {
        driveResult = "pending";
      } else {
        const rootId = await ensureDriveFolder(drive, "Britishce44 Reports");
        const termId = await ensureDriveFolder(drive, termLabel, rootId);
        const folderId = await ensureDriveFolder(
          drive,
          r.kind === "teacher_eval"
            ? "Teacher Evaluations"
            : r.audience === "parent"
              ? "Parent Reports"
              : "Teacher Reports",
          termId,
        );
        const created = await drive.files.create({
          requestBody: {
            name: `${subjectFor(r)} (#${r.id}).txt`,
            parents: [folderId],
          },
          media: { mimeType: "text/plain", body: r.body },
          fields: "id, webViewLink",
        });
        driveResult = "archived";
        await db
          .update(reports)
          .set({
            driveStatus: "archived",
            driveFileId: created.data.id ?? null,
            driveLink: created.data.webViewLink ?? null,
            updatedAt: new Date(),
          })
          .where(eq(reports.id, r.id));
      }
    } catch (err) {
      driveResult = "failed";
      await db
        .update(reports)
        .set({ driveStatus: "failed", updatedAt: new Date() })
        .where(eq(reports.id, r.id));
      logger.warn({ err, reportId: r.id }, "drive archive failed");
    }
  }

  return { email: emailResult, drive: driveResult };
}

// Retry every report that still has pending or failed email/drive status.
export async function flushPendingDeliveries(
  termLabel = "Term 3 — 2026",
): Promise<{ processed: number }> {
  const pending = await db
    .select()
    .from(reports)
    .where(
      or(
        eq(reports.emailStatus, "pending"),
        eq(reports.emailStatus, "failed"),
        eq(reports.driveStatus, "pending"),
        eq(reports.driveStatus, "failed"),
      ),
    );
  let processed = 0;
  for (const r of pending) {
    await deliverReport(r, termLabel);
    processed++;
  }
  return { processed };
}

export async function createGoogleCalendarEvent(opts: {
  summary: string;
  description?: string;
  date: string; // all-day ISO date
}): Promise<string | null> {
  try {
    const cal = await calendarClient();
    if (!cal) return null;
    const res = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: opts.summary,
        description: opts.description,
        // For all-day events Google treats end.date as exclusive, so the end
        // must be the day after the start or the insert is rejected (400).
        start: { date: opts.date },
        end: { date: addDaysISO(opts.date, 1) },
      },
    });
    return (res.data.id as string) ?? null;
  } catch (err) {
    logger.warn({ err }, "calendar insert failed");
    return null;
  }
}
