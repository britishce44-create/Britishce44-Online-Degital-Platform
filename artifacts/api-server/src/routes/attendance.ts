import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, attendanceSheets, attendanceRows } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/v1/attendance/sheets", requireAuth, async (_req, res) => {
  const rows = await db.select().from(attendanceSheets).orderBy(attendanceSheets.updatedAt);
  return res.json({ sheets: rows });
});

router.post("/v1/attendance/sheets", requireAuth, async (req, res) => {
  const [sheet] = await db.insert(attendanceSheets).values({}).returning();
  return res.json({ sheet });
});

router.patch("/v1/attendance/sheets/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["subject","termId","groupNo","teacherName","startDate","endDate","period","room","timeRange","dateHeaders"];
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (req.body[k] !== undefined) set[k] = req.body[k];
  }
  const [row] = await db.update(attendanceSheets).set(set).where(eq(attendanceSheets.id, id)).returning();
  return res.json({ sheet: row });
});

router.delete("/v1/attendance/sheets/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(attendanceRows).where(eq(attendanceRows.sheetId, id));
  await db.delete(attendanceSheets).where(eq(attendanceSheets.id, id));
  return res.json({ ok: true });
});

router.get("/v1/attendance/sheets/:id/rows", requireAuth, async (req, res) => {
  const rows = await db.select().from(attendanceRows).where(eq(attendanceRows.sheetId, Number(req.params.id))).orderBy(attendanceRows.rowNumber);
  return res.json({ rows });
});

router.post("/v1/attendance/sheets/:id/rows", requireAuth, async (req, res) => {
  const sheetId = Number(req.params.id);
  const { rowNumber, studentName } = req.body ?? {};
  const [row] = await db.insert(attendanceRows).values({
    sheetId,
    rowNumber: rowNumber ?? 1,
    studentName: studentName ?? "",
  }).returning();
  return res.json({ row });
});

router.patch("/v1/attendance/rows/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["studentName","dates","pr","ma1","re","ma2","wr","ma3","aps"];
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (req.body[k] !== undefined) set[k] = req.body[k];
  }
  const [row] = await db.update(attendanceRows).set(set).where(eq(attendanceRows.id, id)).returning();
  return res.json({ row });
});

router.delete("/v1/attendance/rows/:id", requireAuth, async (req, res) => {
  await db.delete(attendanceRows).where(eq(attendanceRows.id, Number(req.params.id)));
  return res.json({ ok: true });
});

export default router;
