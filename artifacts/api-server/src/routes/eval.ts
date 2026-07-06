import { Router, type IRouter } from "express";
import { and, eq, sql, inArray } from "drizzle-orm";
import {
  db,
  teachers,
  courses,
  students,
  reports,
  evalTemplates,
  evalCriteria,
  evalSheets,
  evalScores,
  evalDayMeta,
  evalTrainingPlans,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { WEEKLY_DAYS } from "../lib/teaching-days";
import { generateEvalReportsForSheet } from "../lib/eval-reports";
import { deliverReport, flushPendingDeliveries } from "../lib/google";

const router: IRouter = Router();

const staff = requireRole("admin", "supervisor");

/* ── Templates ──────────────────────────────────────────────────────────── */

// All evaluation routes are academic-management facing (admin / supervisor).
router.get("/v1/eval/templates", requireAuth, staff, async (req, res) => {
  const all = req.query.all === "1";
  const tpls = all
    ? await db.select().from(evalTemplates).orderBy(evalTemplates.orderIndex)
    : await db
        .select()
        .from(evalTemplates)
        .where(eq(evalTemplates.active, true))
        .orderBy(evalTemplates.orderIndex);

  const out = [];
  for (const t of tpls) {
    const crit = await db
      .select()
      .from(evalCriteria)
      .where(eq(evalCriteria.templateId, t.id))
      .orderBy(evalCriteria.orderIndex);
    out.push({ ...t, criteria: crit });
  }
  return res.json({ templates: out });
});

router.post("/v1/eval/templates", requireAuth, staff, async (req, res) => {
  const { key, name, nameAr, layout, termLabel, description } = req.body ?? {};
  if (!name) return res.status(400).json({ message: "name is required" });
  if (layout && !["columns", "weekly"].includes(layout))
    return res.status(400).json({ message: "invalid layout" });
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(order_index), -1)::int` })
    .from(evalTemplates);
  const [row] = await db
    .insert(evalTemplates)
    .values({
      key: key || String(name).toLowerCase().replace(/\s+/g, "_").slice(0, 60),
      name,
      nameAr: nameAr ?? null,
      subjectType: "teacher",
      layout: layout ?? "columns",
      termLabel: termLabel ?? null,
      description: description ?? null,
      orderIndex: (max ?? -1) + 1,
      active: true,
    })
    .returning();
  return res.json({ template: row });
});

router.patch("/v1/eval/templates/:id", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const { name, nameAr, layout, termLabel, description, active, orderIndex } =
    req.body ?? {};
  const set: Record<string, unknown> = {};
  if (name !== undefined) set.name = name;
  if (nameAr !== undefined) set.nameAr = nameAr;
  if (layout !== undefined) {
    if (!["columns", "weekly"].includes(layout))
      return res.status(400).json({ message: "invalid layout" });
    set.layout = layout;
  }
  if (termLabel !== undefined) set.termLabel = termLabel;
  if (description !== undefined) set.description = description;
  if (active !== undefined) set.active = !!active;
  if (orderIndex !== undefined) set.orderIndex = Number(orderIndex);
  if (Object.keys(set).length === 0)
    return res.status(400).json({ message: "nothing to update" });
  const [row] = await db
    .update(evalTemplates)
    .set(set)
    .where(eq(evalTemplates.id, id))
    .returning();
  return res.json({ template: row });
});

// Delete a template and everything beneath it (criteria, sheets, scores,
// day-meta and its teacher-eval reports).
router.delete("/v1/eval/templates/:id", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const sheets = await db
    .select()
    .from(evalSheets)
    .where(eq(evalSheets.templateId, id));
  for (const s of sheets) {
    await db.delete(reports).where(eq(reports.evalSheetId, s.id));
    await db.delete(evalScores).where(eq(evalScores.sheetId, s.id));
    await db.delete(evalDayMeta).where(eq(evalDayMeta.sheetId, s.id));
  }
  await db.delete(evalSheets).where(eq(evalSheets.templateId, id));
  await db.delete(evalCriteria).where(eq(evalCriteria.templateId, id));
  await db.delete(evalTemplates).where(eq(evalTemplates.id, id));
  return res.json({ ok: true });
});

/* ── Criteria ───────────────────────────────────────────────────────────── */

router.post(
  "/v1/eval/templates/:id/criteria",
  requireAuth,
  staff,
  async (req, res) => {
    const templateId = Number(req.params.id);
    const { key, labelEn, labelAr, kind, maxScore, weight, isKpi, feedback, tierBoundaries } = req.body ?? {};
    if (!labelEn) return res.status(400).json({ message: "labelEn is required" });
    if (kind && !["score", "text"].includes(kind))
      return res.status(400).json({ message: "invalid kind" });
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(order_index), -1)::int` })
      .from(evalCriteria)
      .where(eq(evalCriteria.templateId, templateId));
    const [row] = await db
      .insert(evalCriteria)
      .values({
        templateId,
        key: key || String(labelEn).toLowerCase().replace(/\s+/g, "_").slice(0, 60),
        labelEn,
        labelAr: labelAr ?? null,
        kind: kind ?? "score",
        maxScore: maxScore ? Number(maxScore) : 5,
        weight: weight != null ? String(weight) : "1",
        isKpi: isKpi ?? false,
        feedback: feedback ?? null,
        tierBoundaries: tierBoundaries ?? null,
        orderIndex: (max ?? -1) + 1,
        active: true,
      })
      .returning();
    return res.json({ criterion: row });
  },
);

router.patch("/v1/eval/criteria/:id", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const { labelEn, labelAr, kind, maxScore, weight, isKpi, feedback, tierBoundaries, active, orderIndex } =
    req.body ?? {};
  const set: Record<string, unknown> = {};
  if (labelEn !== undefined) set.labelEn = labelEn;
  if (labelAr !== undefined) set.labelAr = labelAr;
  if (kind !== undefined) {
    if (!["score", "text"].includes(kind))
      return res.status(400).json({ message: "invalid kind" });
    set.kind = kind;
  }
  if (maxScore !== undefined) set.maxScore = Number(maxScore);
  if (weight !== undefined) set.weight = String(weight);
  if (isKpi !== undefined) set.isKpi = !!isKpi;
  if (feedback !== undefined) set.feedback = feedback;
  if (tierBoundaries !== undefined) set.tierBoundaries = tierBoundaries;
  if (active !== undefined) set.active = !!active;
  if (orderIndex !== undefined) set.orderIndex = Number(orderIndex);
  if (Object.keys(set).length === 0)
    return res.status(400).json({ message: "nothing to update" });
  const [row] = await db
    .update(evalCriteria)
    .set(set)
    .where(eq(evalCriteria.id, id))
    .returning();
  return res.json({ criterion: row });
});

router.delete("/v1/eval/criteria/:id", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(evalScores).where(eq(evalScores.criterionId, id));
  await db.delete(evalCriteria).where(eq(evalCriteria.id, id));
  return res.json({ ok: true });
});

/* ── Sheets ─────────────────────────────────────────────────────────────── */

router.get("/v1/eval/sheets", requireAuth, staff, async (req, res) => {
  const templateId = req.query.templateId
    ? Number(req.query.templateId)
    : null;
  let rows = await db.select().from(evalSheets).orderBy(evalSheets.id);
  if (templateId) rows = rows.filter((s) => s.templateId === templateId);
  return res.json({ sheets: rows });
});

router.post("/v1/eval/sheets", requireAuth, staff, async (req, res) => {
  const { templateId, termLabel, weekLabel, dueDate } = req.body ?? {};
  if (!templateId || !termLabel)
    return res
      .status(400)
      .json({ message: "templateId and termLabel are required" });
  const [tpl] = await db
    .select()
    .from(evalTemplates)
    .where(eq(evalTemplates.id, Number(templateId)))
    .limit(1);
  if (!tpl) return res.status(404).json({ message: "template not found" });
  const week =
    tpl.layout === "weekly" ? String(weekLabel ?? "").trim() : "";
  const [row] = await db
    .insert(evalSheets)
    .values({
      templateId: Number(templateId),
      termLabel,
      weekLabel: week,
      dueDate: dueDate ?? null,
      status: "open",
      assessorId: (req as any).user?.id ? Number((req as any).user.id) : null,
    })
    .onConflictDoNothing({
      target: [
        evalSheets.templateId,
        evalSheets.termLabel,
        evalSheets.weekLabel,
      ],
    })
    .returning();
  if (!row) {
    const [existing] = await db
      .select()
      .from(evalSheets)
      .where(
        and(
          eq(evalSheets.templateId, Number(templateId)),
          eq(evalSheets.termLabel, termLabel),
          eq(evalSheets.weekLabel, week),
        ),
      )
      .limit(1);
    return res.json({ sheet: existing });
  }
  return res.json({ sheet: row });
});

router.patch("/v1/eval/sheets/:id", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!["open", "submitted", "locked"].includes(status))
    return res.status(400).json({ message: "invalid status" });
  const [row] = await db
    .update(evalSheets)
    .set({
      status,
      ...(status === "submitted" ? { submittedAt: new Date() } : {}),
    })
    .where(eq(evalSheets.id, id))
    .returning();
  return res.json({ sheet: row });
});

// Full grid for one sheet: template, criteria, teachers, scores keyed by
// [teacherId][criterionId][day], day-meta keyed by [teacherId][day].
router.get("/v1/eval/sheet/:id", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const [sheet] = await db
    .select()
    .from(evalSheets)
    .where(eq(evalSheets.id, id))
    .limit(1);
  if (!sheet) return res.status(404).json({ message: "sheet not found" });
  const [tpl] = await db
    .select()
    .from(evalTemplates)
    .where(eq(evalTemplates.id, sheet.templateId))
    .limit(1);
  const crit = await db
    .select()
    .from(evalCriteria)
    .where(
      and(
        eq(evalCriteria.templateId, sheet.templateId),
        eq(evalCriteria.active, true),
      ),
    )
    .orderBy(evalCriteria.orderIndex);
  const tch = await db.select().from(teachers).orderBy(teachers.id);

  // Enrich each teacher with their courses (room, level, time, student count)
  // so the eval UI can show real context connected to Users Manage.
  const teacherCourses: Record<number, unknown[]> = {};
  for (const t of tch) {
    const cs = await db
      .select({
        id: courses.id,
        name: courses.name,
        level: courses.level,
        room: courses.room,
        startTime: courses.startTime,
        endTime: courses.endTime,
        teachingWeekdays: courses.teachingWeekdays,
        termLabel: courses.termLabel,
      })
      .from(courses)
      .where(eq(courses.teacherId, t.id));
    const studentCounts = await Promise.all(
      cs.map(async (c) => {
        const [agg] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(students)
          .where(eq(students.courseId, c.id));
        return { ...c, studentCount: agg?.count ?? 0 };
      }),
    );
    teacherCourses[t.id] = studentCounts;
  }

  const scoreRows = await db
    .select()
    .from(evalScores)
    .where(eq(evalScores.sheetId, id));
  const scores: Record<
    number,
    Record<number, Record<number, { score: number | null; note: string | null }>>
  > = {};
  for (const s of scoreRows) {
    scores[s.teacherId] ??= {};
    scores[s.teacherId][s.criterionId] ??= {};
    scores[s.teacherId][s.criterionId][s.day] = {
      score: s.score,
      note: s.note,
    };
  }

  const metaRows = await db
    .select()
    .from(evalDayMeta)
    .where(eq(evalDayMeta.sheetId, id));
  const dayMeta: Record<number, Record<number, number | null>> = {};
  for (const m of metaRows) {
    dayMeta[m.teacherId] ??= {};
    dayMeta[m.teacherId][m.day] = m.minutes;
  }

  return res.json({
    sheet,
    template: tpl,
    criteria: crit,
    teachers: tch.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      courses: teacherCourses[t.id] ?? [],
    })),
    days: WEEKLY_DAYS.map((d) => d.day),
    scores,
    dayMeta,
  });
});

// Save scores and (weekly) per-day durations.
router.post(
  "/v1/eval/sheet/:id/scores",
  requireAuth,
  staff,
  async (req, res) => {
    const id = Number(req.params.id);
    const [sheet] = await db
      .select()
      .from(evalSheets)
      .where(eq(evalSheets.id, id))
      .limit(1);
    if (!sheet) return res.status(404).json({ message: "sheet not found" });
    if (sheet.status !== "open")
      return res
        .status(409)
        .json({ message: "sheet is not open for editing" });

    const { scores, dayMeta } = req.body ?? {};

    if (Array.isArray(scores)) {
      for (const s of scores) {
        const teacherId = Number(s.teacherId);
        const criterionId = Number(s.criterionId);
        const day = Number(s.day ?? 0);
        if (!teacherId || !criterionId) continue;
        const score: number | null =
          s.score === null || s.score === undefined || s.score === ""
            ? null
            : Number(s.score);
        const note: string | null =
          s.note === undefined || s.note === null || s.note === ""
            ? null
            : String(s.note);
        await db
          .insert(evalScores)
          .values({ sheetId: id, teacherId, criterionId, day, score, note })
          .onConflictDoUpdate({
            target: [
              evalScores.sheetId,
              evalScores.teacherId,
              evalScores.criterionId,
              evalScores.day,
            ],
            set: { score, note, updatedAt: new Date() },
          });
      }
    }

    if (Array.isArray(dayMeta)) {
      for (const m of dayMeta) {
        const teacherId = Number(m.teacherId);
        const day = Number(m.day);
        if (!teacherId || Number.isNaN(day)) continue;
        const minutes: number | null =
          m.minutes === null || m.minutes === undefined || m.minutes === ""
            ? null
            : Number(m.minutes);
        await db
          .insert(evalDayMeta)
          .values({ sheetId: id, teacherId, day, minutes })
          .onConflictDoUpdate({
            target: [
              evalDayMeta.sheetId,
              evalDayMeta.teacherId,
              evalDayMeta.day,
            ],
            set: { minutes, updatedAt: new Date() },
          });
      }
    }

    return res.json({ ok: true });
  },
);

// Generate reports without changing the sheet status (generate-all).
router.post(
  "/v1/eval/sheet/:id/generate",
  requireAuth,
  staff,
  async (req, res) => {
    const id = Number(req.params.id);
    const r = await generateEvalReportsForSheet(id);
    return res.json(r);
  },
);

// Submit the sheet and generate teacher-eval reports.
router.post("/v1/eval/sheet/:id/submit", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const [sheet] = await db
    .select()
    .from(evalSheets)
    .where(eq(evalSheets.id, id))
    .limit(1);
  if (!sheet) return res.status(404).json({ message: "sheet not found" });
  if (sheet.status === "locked")
    return res.status(409).json({ message: "sheet is locked" });
  await db
    .update(evalSheets)
    .set({ status: "submitted", submittedAt: new Date() })
    .where(eq(evalSheets.id, id));
  let generated = 0;
  try {
    const r = await generateEvalReportsForSheet(id);
    generated = r.created;
    const rows = await db
      .select()
      .from(reports)
      .where(eq(reports.evalSheetId, id));
    for (const row of rows) await deliverReport(row, sheet.termLabel);
  } catch {
    // generation/delivery failure should not block submission; pending
    // reports are completed later by a manual flush once Google is connected
  }
  return res.json({ ok: true, generated });
});

// Generate (if needed) and queue delivery for every report on this sheet.
router.post(
  "/v1/eval/sheet/:id/send",
  requireAuth,
  staff,
  async (req, res) => {
    const id = Number(req.params.id);
    const [sheet] = await db
      .select()
      .from(evalSheets)
      .where(eq(evalSheets.id, id))
      .limit(1);
    if (!sheet) return res.status(404).json({ message: "sheet not found" });
    await generateEvalReportsForSheet(id);
    const rows = await db
      .select()
      .from(reports)
      .where(eq(reports.evalSheetId, id));
    for (const r of rows) await deliverReport(r, sheet.termLabel);
    return res.json({ sent: rows.length });
  },
);

router.post(
  "/v1/eval/flush",
  requireAuth,
  staff,
  async (_req, res) => {
    return res.json(await flushPendingDeliveries());
  },
);

/* ── Analytics: weighted averages + per-criterion breakdown for charts ──── */

router.get("/v1/eval/sheet/:id/analytics", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const [sheet] = await db.select().from(evalSheets).where(eq(evalSheets.id, id)).limit(1);
  if (!sheet) return res.status(404).json({ message: "sheet not found" });
  const [tpl] = await db.select().from(evalTemplates).where(eq(evalTemplates.id, sheet.templateId)).limit(1);
  if (!tpl) return res.status(404).json({ message: "template not found" });
  const crit = await db
    .select()
    .from(evalCriteria)
    .where(and(eq(evalCriteria.templateId, tpl.id), eq(evalCriteria.active, true)))
    .orderBy(evalCriteria.orderIndex);
  const scoreRows = await db.select().from(evalScores).where(eq(evalScores.sheetId, id));
  const tch = await db.select().from(teachers).orderBy(teachers.id);

  const teachersAnalytics: Record<number, {
    teacherId: number;
    teacherName: string;
    weightedAvg: number;
    overallPercent: number;
    level: string;
    perCriterion: { criterionId: number; label: string; labelAr: string | null; score: number; max: number; percent: number; tier: string; weight: number; isKpi: boolean }[];
  }> = {};

  for (const t of tch) {
    const tScores = scoreRows.filter((s) => s.teacherId === t.id);
    const hasData = tScores.some((s) => s.score != null);
    if (!hasData) continue;
    const perCriterion: { criterionId: number; label: string; labelAr: string | null; score: number; max: number; percent: number; tier: string; weight: number; isKpi: boolean }[] = [];
    let totalWeighted = 0;
    let totalMaxWeighted = 0;
    for (const c of crit) {
      if (c.kind === "text") continue;
      const cScores = tScores.filter((s) => s.criterionId === c.id && s.score != null).map((s) => s.score as number);
      if (cScores.length === 0) continue;
      const avg = cScores.reduce((a, b) => a + b, 0) / cScores.length;
      const weight = Number(c.weight);
      const percent = Math.round((avg / c.maxScore) * 100);
      const tier = percent >= 80 ? "strong" : percent >= 50 ? "developing" : "weak";
      totalWeighted += avg * weight;
      totalMaxWeighted += c.maxScore * weight;
      perCriterion.push({ criterionId: c.id, label: c.labelEn, labelAr: c.labelAr, score: Math.round(avg * 10) / 10, max: c.maxScore, percent, tier, weight, isKpi: c.isKpi });
    }
    const overallPercent = totalMaxWeighted > 0 ? Math.round((totalWeighted / totalMaxWeighted) * 100) : 0;
    const weightedAvg = totalMaxWeighted > 0 ? (totalWeighted / totalMaxWeighted) * 5 : 0;
    const level = overallPercent >= 80 ? "Strong" : overallPercent >= 50 ? "Developing" : "Weak";
    teachersAnalytics[t.id] = { teacherId: t.id, teacherName: t.name, weightedAvg: Math.round(weightedAvg * 10) / 10, overallPercent, level, perCriterion };
  }

  // Per-criterion averages across all teachers (for bar charts)
  const criterionAverages = crit
    .filter((c) => c.kind === "score")
    .map((c) => {
      const all = scoreRows.filter((s) => s.criterionId === c.id && s.score != null).map((s) => s.score as number);
      const avg = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
      return { criterionId: c.id, label: c.labelEn, labelAr: c.labelAr, avg: Math.round(avg * 10) / 10, max: c.maxScore, percent: Math.round((avg / c.maxScore) * 100), isKpi: c.isKpi };
    });

  return res.json({ sheet, template: tpl, teachersAnalytics: Object.values(teachersAnalytics), criterionAverages });
});

/* ── Training Plans ─────────────────────────────────────────────────────── */

router.get("/v1/eval/training-plans", requireAuth, staff, async (req, res) => {
  const sheetId = req.query.sheetId ? Number(req.query.sheetId) : undefined;
  let rows = await db.select().from(evalTrainingPlans).orderBy(evalTrainingPlans.id);
  if (sheetId) rows = rows.filter((r) => r.sheetId === sheetId);
  return res.json({ plans: rows });
});

router.post("/v1/eval/training-plans", requireAuth, staff, async (req, res) => {
  const { sheetId, teacherId, criterionId, action, status, dueDate } = req.body ?? {};
  if (!teacherId || !action) return res.status(400).json({ message: "teacherId and action required" });
  const [row] = await db
    .insert(evalTrainingPlans)
    .values({
      sheetId: sheetId ? Number(sheetId) : null,
      teacherId: Number(teacherId),
      criterionId: criterionId ? Number(criterionId) : null,
      action,
      status: status ?? "pending",
      dueDate: dueDate ?? null,
    })
    .returning();
  return res.json({ plan: row });
});

router.patch("/v1/eval/training-plans/:id", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const { action, status, dueDate } = req.body ?? {};
  const set: Record<string, unknown> = {};
  if (action !== undefined) set.action = action;
  if (status !== undefined) {
    if (!["pending", "in-progress", "done"].includes(status))
      return res.status(400).json({ message: "invalid status" });
    set.status = status;
  }
  if (dueDate !== undefined) set.dueDate = dueDate;
  if (Object.keys(set).length === 0) return res.status(400).json({ message: "nothing to update" });
  const [row] = await db.update(evalTrainingPlans).set(set).where(eq(evalTrainingPlans.id, id)).returning();
  return res.json({ plan: row });
});

router.delete("/v1/eval/training-plans/:id", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(evalTrainingPlans).where(eq(evalTrainingPlans.id, id));
  return res.json({ ok: true });
});

// Auto-generate training plans from weak criteria (<50% = Weak tier) using
// the 3-tier recommendations stored on each criterion's feedback jsonb.
router.post("/v1/eval/sheet/:id/training-plans/generate", requireAuth, staff, async (req, res) => {
  const id = Number(req.params.id);
  const [sheet] = await db.select().from(evalSheets).where(eq(evalSheets.id, id)).limit(1);
  if (!sheet) return res.status(404).json({ message: "sheet not found" });
  const crit = await db
    .select()
    .from(evalCriteria)
    .where(and(eq(evalCriteria.templateId, sheet.templateId), eq(evalCriteria.active, true)))
    .orderBy(evalCriteria.orderIndex);
  const scoreRows = await db.select().from(evalScores).where(eq(evalScores.sheetId, id));
  const tch = await db.select().from(teachers);

  let created = 0;
  for (const t of tch) {
    const tScores = scoreRows.filter((s) => s.teacherId === t.id && s.score != null);
    if (!tScores.length) continue;
    for (const c of crit) {
      if (c.kind === "text") continue;
      const cScores = tScores.filter((s) => s.criterionId === c.id).map((s) => s.score as number);
      if (!cScores.length) continue;
      const avg = cScores.reduce((a, b) => a + b, 0) / cScores.length;
      const percent = avg / c.maxScore;
      if (percent < 0.5) {
        const fb = c.feedback as any;
        const rec = fb?.weak?.en?.rec || fb?.weak?.ar?.rec || `Improve ${c.labelEn}`;
        // Avoid duplicates: skip if a plan already exists for this sheet+teacher+criterion
        const existing = await db
          .select()
          .from(evalTrainingPlans)
          .where(
            and(
              eq(evalTrainingPlans.sheetId, id),
              eq(evalTrainingPlans.teacherId, t.id),
              eq(evalTrainingPlans.criterionId, c.id),
            ),
          )
          .limit(1);
        if (existing.length) continue;
        await db.insert(evalTrainingPlans).values({
          sheetId: id,
          teacherId: t.id,
          criterionId: c.id,
          action: rec,
          status: "pending",
        });
        created++;
      }
    }
  }
  return res.json({ created });
});

export default router;
