import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, resultSheets, resultRows } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/v1/results/sheets", requireAuth, async (_req, res) => {
  const rows = await db.select().from(resultSheets).orderBy(resultSheets.updatedAt);
  return res.json({ sheets: rows });
});

router.post("/v1/results/sheets", requireAuth, async (_req, res) => {
  const [sheet] = await db.insert(resultSheets).values({}).returning();
  return res.json({ sheet });
});

router.patch("/v1/results/sheets/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["subject","teacherName","startDate","endDate","groupNo","period","timeRange","room"];
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (req.body[k] !== undefined) set[k] = req.body[k];
  }
  const [row] = await db.update(resultSheets).set(set).where(eq(resultSheets.id, id)).returning();
  return res.json({ sheet: row });
});

router.delete("/v1/results/sheets/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(resultRows).where(eq(resultRows.sheetId, id));
  await db.delete(resultSheets).where(eq(resultSheets.id, id));
  return res.json({ ok: true });
});

router.get("/v1/results/sheets/:id/rows", requireAuth, async (req, res) => {
  const rows = await db.select().from(resultRows).where(eq(resultRows.sheetId, Number(req.params.id))).orderBy(resultRows.rowNumber);
  return res.json({ rows });
});

router.post("/v1/results/sheets/:id/rows", requireAuth, async (req, res) => {
  const sheetId = Number(req.params.id);
  const { rowNumber, studentName } = req.body ?? {};
  const [row] = await db.insert(resultRows).values({
    sheetId, rowNumber: rowNumber ?? 1, studentName: studentName ?? "",
  }).returning();
  return res.json({ row });
});

router.patch("/v1/results/rows/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const allowed = ["studentName","atten","projects","quiz1","quiz2","listening","reading","writing","speaking","final","total","abse"];
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) {
    if (req.body[k] !== undefined) set[k] = req.body[k];
  }
  const [row] = await db.update(resultRows).set(set).where(eq(resultRows.id, id)).returning();
  return res.json({ row });
});

router.delete("/v1/results/rows/:id", requireAuth, async (req, res) => {
  await db.delete(resultRows).where(eq(resultRows.id, Number(req.params.id)));
  return res.json({ ok: true });
});

export default router;
