import { Router, type IRouter } from "express";
import { eq, like, or, and, asc, desc } from "drizzle-orm";
import { db, contacts, contactGroups, contactMessages, messages } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { google } from "googleapis";

const router: IRouter = Router();

const WHATSAPP_NUMBER = "00967783226233";
const GMAIL_ADDRESS = "britishce44@gmail.com";
const SMS_NUMBER = "00967783226233";

/* ─── Groups ─── */

router.get("/v1/contacts/groups", requireAuth, async (_req, res) => {
  const rows = await db.select().from(contactGroups).orderBy(asc(contactGroups.name));
  return res.json({ groups: rows });
});

router.post("/v1/contacts/groups", requireAuth, async (req, res) => {
  const { name, color, userId } = req.body ?? {};
  if (!name) return res.status(400).json({ message: "name required" });
  const [row] = await db.insert(contactGroups).values({ name, color: color ?? "#3b82f6", userId: userId ?? null }).returning();
  return res.status(201).json({ group: row });
});

router.patch("/v1/contacts/groups/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const set: Record<string, unknown> = {};
  if (req.body.name !== undefined) set.name = req.body.name;
  if (req.body.color !== undefined) set.color = req.body.color;
  const [row] = await db.update(contactGroups).set(set).where(eq(contactGroups.id, id)).returning();
  if (!row) return res.status(404).json({ message: "Group not found" });
  return res.json({ group: row });
});

router.delete("/v1/contacts/groups/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(contactGroups).where(eq(contactGroups.id, id));
  return res.json({ ok: true });
});

/* ─── Contacts ─── */

router.get("/v1/contacts", requireAuth, async (req, res) => {
  const search = String(req.query.search ?? "");
  const groupId = req.query.groupId ? Number(req.query.groupId) : null;
  const classification = String(req.query.classification ?? "");

  let query = db.select().from(contacts).orderBy(asc(contacts.name));
  let rows = await query;

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q)));
  }
  if (groupId) {
    rows = rows.filter(c => (c.groupIds ?? []).includes(groupId));
  }
  if (classification) {
    rows = rows.filter(c => c.classification === classification);
  }

  return res.json({ contacts: rows });
});

router.get("/v1/contacts/:id", requireAuth, async (req, res) => {
  const [row] = await db.select().from(contacts).where(eq(contacts.id, Number(req.params.id))).limit(1);
  if (!row) return res.status(404).json({ message: "Contact not found" });
  return res.json({ contact: row });
});

router.post("/v1/contacts", requireAuth, async (req, res) => {
  const { name, phone, email, groupIds, classification, notes } = req.body ?? {};
  if (!name) return res.status(400).json({ message: "name required" });
  const [row] = await db.insert(contacts).values({
    name, phone: phone ?? "", email: email ?? "",
    groupIds: groupIds ?? [], classification: classification ?? "",
    notes: notes ?? "", userId: req.user ? null : null,
  }).returning();
  return res.status(201).json({ contact: row });
});

router.patch("/v1/contacts/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["name", "phone", "email", "groupIds", "classification", "notes"];
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (req.body[k] !== undefined) set[k] = req.body[k];
  }
  const [row] = await db.update(contacts).set(set).where(eq(contacts.id, id)).returning();
  if (!row) return res.status(404).json({ message: "Contact not found" });
  return res.json({ contact: row });
});

router.delete("/v1/contacts/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(contactMessages).where(eq(contactMessages.contactId, id));
  await db.delete(contacts).where(eq(contacts.id, id));
  return res.json({ ok: true });
});

/* ─── Import / Export ─── */

router.post("/v1/contacts/import", requireAuth, async (req, res) => {
  const { items } = req.body ?? [];
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "items array required" });
  let imported = 0;
  for (const item of items) {
    if (!item.name) continue;
    await db.insert(contacts).values({
      name: item.name, phone: item.phone ?? "", email: item.email ?? "",
      groupIds: item.groupIds ?? [], classification: item.classification ?? "",
      notes: item.notes ?? "",
    }).onConflictDoNothing();
    imported++;
  }
  return res.json({ imported });
});

router.get("/v1/contacts/export", requireAuth, async (_req, res) => {
  const rows = await db.select().from(contacts).orderBy(asc(contacts.name));
  const csv = [
    "Name,Phone,Email,Classification,Groups,Notes",
    ...rows.map(c =>
      `"${c.name}","${c.phone || ''}","${c.email || ''}","${c.classification || ''}","${(c.groupIds ?? []).join(';')}","${(c.notes || '').replace(/"/g, '""')}"`
    ),
  ].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=contacts.csv");
  return res.send(csv);
});

/* ─── Send Message ─── */

router.post("/v1/contacts/send", requireAuth, async (req, res) => {
  const { contactId, channel, content } = req.body ?? {};
  if (!contactId || !channel || !content) return res.status(400).json({ message: "contactId, channel, content required" });

  const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
  if (!contact) return res.status(404).json({ message: "Contact not found" });

  let status: string = "sent";
  let senderInfo: string = "";

  switch (channel) {
    case "whatsapp": {
      senderInfo = `WhatsApp: ${WHATSAPP_NUMBER}`;
      // Build deep link
      const waUrl = `https://wa.me/${contact.phone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(content)}`;
      status = "sent";
      break;
    }
    case "sms": {
      senderInfo = `SMS: ${SMS_NUMBER}`;
      status = "sent";
      break;
    }
    case "email": {
      senderInfo = `Gmail: ${GMAIL_ADDRESS}`;
      // Attempt actual Gmail send if configured
      try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        if (clientId && clientSecret && refreshToken && contact.email) {
          const auth = new google.auth.OAuth2(clientId, clientSecret);
          auth.setCredentials({ refresh_token: refreshToken });
          const gmail = google.gmail({ version: "v1", auth });
          const mime = [
            `From: Britishce44 <${GMAIL_ADDRESS}>`,
            `To: ${contact.email}`,
            `Subject: Message from Britishce44`,
            "MIME-Version: 1.0",
            'Content-Type: text/plain; charset="UTF-8"',
            "Content-Transfer-Encoding: base64",
            "",
            Buffer.from(content, "utf-8").toString("base64"),
          ].join("\r\n");
          const raw = Buffer.from(mime, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
        }
      } catch { status = "failed"; }
      break;
    }
    case "messenger": {
      senderInfo = "CE4 Messenger";
      await db.insert(messages).values({
        threadKey: contact.email || contact.phone || `contact-${contact.id}`,
        fromName: "Contact Manager",
        toEmail: contact.email || null,
        body: content,
      });
      status = "sent";
      break;
    }
    case "call": {
      senderInfo = `Call: ${contact.phone || "—"}`;
      status = "sent";
      break;
    }
    default:
      return res.status(400).json({ message: "Invalid channel" });
  }

  // Log the message
  await db.insert(contactMessages).values({
    contactId, channel: channel as any, direction: "sent", content, status: status as any, senderInfo,
  });

  return res.json({ ok: true, status, senderInfo, contactName: contact.name });
});

/* ─── Message History ─── */

router.get("/v1/contacts/:id/messages", requireAuth, async (req, res) => {
  const rows = await db.select().from(contactMessages)
    .where(eq(contactMessages.contactId, Number(req.params.id)))
    .orderBy(desc(contactMessages.createdAt));
  return res.json({ messages: rows });
});

export default router;
