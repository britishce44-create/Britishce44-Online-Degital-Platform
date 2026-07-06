import { and, eq } from "drizzle-orm";
import {
  db,
  teachers,
  appUsers,
  reports,
  evalSheets,
  evalTemplates,
  evalCriteria,
  evalScores,
  evalDayMeta,
} from "@workspace/db";
import { aiClient, AI_MODEL } from "./ai";
import { WEEKLY_DAYS } from "./teaching-days";
import { logger } from "./logger";

function evalLevel(avg: number): string {
  if (avg >= 4.5) return "Excellent";
  if (avg >= 3.5) return "Very Good";
  if (avg >= 2.5) return "Good";
  if (avg >= 1.5) return "Fair";
  return "Needs Support";
}

interface EvalGenInput {
  teacherName: string;
  templateName: string;
  termLabel: string;
  weekLabel: string;
  layout: "columns" | "weekly";
  scores: { label: string; score: number; max: number; weight: number; tier: string; feedback?: string }[];
  notes: { label: string; text: string }[];
  durations?: { dayLabel: string; minutes: number }[];
  avg: number;
  language: "en" | "ar";
}

function templateEval(input: EvalGenInput): { level: string; body: string } {
  const level = evalLevel(input.avg);
  const strengths = input.scores
    .filter((s) => s.score / s.max >= 0.8)
    .map((s) => s.label);
  const weak = input.scores
    .filter((s) => s.score / s.max <= 0.4)
    .map((s) => s.label);
  const ar = input.language === "ar";

  const parts: string[] = [];
  parts.push(ar ? `تقرير تقييم أداء المعلم — ${input.teacherName}` : `Teacher Performance Evaluation — ${input.teacherName}`);
  parts.push(
    ar
      ? `${input.templateName} | ${input.termLabel}${input.weekLabel ? ` · ${input.weekLabel}` : ""}`
      : `${input.templateName} | ${input.termLabel}${input.weekLabel ? ` · ${input.weekLabel}` : ""}`,
  );
  parts.push("");
  parts.push(
    ar
      ? `المستوى العام: ${level} (المتوسط ${input.avg.toFixed(1)}/5).`
      : `Overall level: ${level} (average ${input.avg.toFixed(1)}/5).`,
  );
  if (input.scores.length) {
    parts.push(ar ? "الدرجات:" : "Scores:");
    parts.push(
      input.scores.map((s) => `- ${s.label}: ${s.score}/${s.max}`).join("\n"),
    );
  }
  if (input.notes.length) {
    parts.push("");
    parts.push(ar ? "ملاحظات:" : "Notes:");
    parts.push(input.notes.map((n) => `- ${n.label}: ${n.text}`).join("\n"));
  }
  if (input.durations && input.durations.length) {
    parts.push("");
    parts.push(
      ar
        ? `مدة الحصص: ${input.durations.map((d) => `${d.dayLabel} ${d.minutes}د`).join(", ")}.`
        : `Lesson durations: ${input.durations.map((d) => `${d.dayLabel} ${d.minutes}m`).join(", ")}.`,
    );
  }
  parts.push("");
  parts.push(
    ar
      ? `نقاط القوة: ${strengths.length ? strengths.join(", ") : "تتطور عبر المعايير"}.`
      : `Strengths: ${strengths.length ? strengths.join(", ") : "developing across criteria"}.`,
  );
  parts.push(
    ar
      ? `مجالات التحسين: ${weak.length ? weak.join(", ") : "الحفاظ على الأداء الحالي"}.`
      : `Areas to improve: ${weak.length ? weak.join(", ") : "maintain current performance"}.`,
  );
  parts.push("");
  parts.push(
    ar
      ? "التوصيات: اعتمد على نقاط القوة، واعطِ اهتمامًا مستهدفًا للمجالات الأضعف، وحافظ على ثبات الأداء داخل الفصل."
      : "Recommendations: Build on the strengths above, give targeted attention to the weaker areas, and keep classroom delivery consistent.",
  );
  parts.push("");
  parts.push("Britishce44 — Taiz Academic Management.");
  return { level, body: parts.join("\n") };
}

async function generateEvalText(
  input: EvalGenInput,
): Promise<{ level: string; body: string }> {
  if (!aiClient) return templateEval(input);
  const ar = input.language === "ar";
  try {
    const completion = await aiClient.chat.completions.create({
      model: AI_MODEL,
      max_completion_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: ar
            ? "أنت المشرف الأكاديمي في منصة Britishce44 (تعز، اليمن). اكتب تقريرًا موجزًا ومهنيًا باللغة العربية لتقييم أداء معلم. " +
              "أرجع JSON صارم بمفتاحين: level (مستوى قصير بالعربية) و body (نص التقرير). " +
              "يجب أن يتضمن النص المستوى العام ونقاط القوة ومجالات التحسين والتوصيات المحددة والأسباب وراء التقييم. " +
              "اجعله أقل من ~200 كلمة واختمه بـ 'Britishce44 — الإدارة الأكاديمية بتعز.'"
            : "You are the academic supervisor at Britishce44 (Taiz, Yemen). Write a concise, professional ENGLISH teacher performance-evaluation report for one teacher. " +
              "Return STRICT JSON with keys: level (a short English level label) and body (the report text). " +
              "The body MUST include the overall level, strengths, areas to improve, concrete recommendations (reference the provided per-criterion recommendations), and the reasons behind the assessment. " +
              "Keep it under ~200 words and end with 'Britishce44 — Taiz Academic Management.'",
        },
        {
          role: "user",
          content: JSON.stringify({
            teacher: input.teacherName,
            form: input.templateName,
            term: input.termLabel,
            week: input.weekLabel,
            weightedAverage: Number(input.avg.toFixed(2)),
            criteria: input.scores.map((s) => ({
              label: s.label,
              score: s.score,
              max: s.max,
              weight: s.weight,
              tier: s.tier,
              recommendation: s.feedback || undefined,
            })),
            notes: input.notes.map((n) => `${n.label}: ${n.text}`),
            lessonDurations:
              input.durations?.map((d) => `${d.dayLabel}: ${d.minutes}m`) ?? [],
            language: input.language,
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return templateEval(input);
    const parsed = JSON.parse(raw) as { level?: string; body?: string };
    if (!parsed.body) return templateEval(input);
    return { level: parsed.level || evalLevel(input.avg), body: parsed.body };
  } catch (err) {
    logger.warn({ err }, "AI teacher-eval generation failed; using template");
    return templateEval(input);
  }
}

async function upsertEvalReport(row: {
  evalSheetId: number;
  evalTeacherId: number;
  recipientEmail: string;
  recipientName: string;
  level: string;
  body: string;
  language: "en" | "ar";
}): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.kind, "teacher_eval"),
        eq(reports.evalSheetId, row.evalSheetId),
        eq(reports.evalTeacherId, row.evalTeacherId),
      ),
    )
    .limit(1);

  if (existing) {
    // Preserve manual edits and already-sent reports.
    if (existing.status === "edited" || existing.status === "sent") return false;
    await db
      .update(reports)
      .set({
        recipientEmail: row.recipientEmail,
        recipientName: row.recipientName,
        level: row.level,
        body: row.body,
        language: row.language,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, existing.id));
    return true;
  }

  await db.insert(reports).values({
    kind: "teacher_eval",
    evalSheetId: row.evalSheetId,
    evalTeacherId: row.evalTeacherId,
    audience: "teacher",
    language: row.language,
    recipientEmail: row.recipientEmail,
    recipientName: row.recipientName,
    level: row.level,
    body: row.body,
    status: "draft",
    emailStatus: "pending",
    driveStatus: "pending",
  });
  return true;
}

// Generate one English teacher-evaluation report per teacher that has any score
// or note on the sheet. Idempotent; preserves edited/sent reports.
export async function generateEvalReportsForSheet(
  sheetId: number,
): Promise<{ created: number }> {
  const [sheet] = await db
    .select()
    .from(evalSheets)
    .where(eq(evalSheets.id, sheetId))
    .limit(1);
  if (!sheet) throw new Error("eval sheet not found");

  const [tpl] = await db
    .select()
    .from(evalTemplates)
    .where(eq(evalTemplates.id, sheet.templateId))
    .limit(1);
  if (!tpl) throw new Error("eval template not found");

  const crit = await db
    .select()
    .from(evalCriteria)
    .where(
      and(eq(evalCriteria.templateId, tpl.id), eq(evalCriteria.active, true)),
    )
    .orderBy(evalCriteria.orderIndex);

  const allTeachers = await db.select().from(teachers);
  const scoreRows = await db
    .select()
    .from(evalScores)
    .where(eq(evalScores.sheetId, sheetId));
  const metaRows = await db
    .select()
    .from(evalDayMeta)
    .where(eq(evalDayMeta.sheetId, sheetId));

  let created = 0;
  for (const t of allTeachers) {
    const tScores = scoreRows.filter((s) => s.teacherId === t.id);
    const tMeta = metaRows.filter((m) => m.teacherId === t.id);
    const hasData = tScores.some(
      (s) => s.score != null || (s.note != null && s.note.trim() !== ""),
    );
    if (!hasData) continue;

    // Detect language preference from the linked app_user (default 'en')
    const [au] = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.teacherId, t.id))
      .limit(1);
    const lang: "en" | "ar" = au?.role === "teacher" ? "en" : "en"; // default en; can be extended

    const perCrit: { label: string; score: number; max: number; weight: number; tier: string; feedback?: string }[] = [];
    const notes: { label: string; text: string }[] = [];
    let totalWeighted = 0;
    let totalMaxWeighted = 0;
    for (const c of crit) {
      if (c.kind === "text") {
        const noteRow = tScores.find(
          (s) =>
            s.criterionId === c.id && s.note != null && s.note.trim() !== "",
        );
        if (noteRow?.note) notes.push({ label: c.labelEn, text: noteRow.note });
        continue;
      }
      const cScores = tScores
        .filter((s) => s.criterionId === c.id && s.score != null)
        .map((s) => s.score as number);
      if (cScores.length === 0) continue;
      const avg = cScores.reduce((a, b) => a + b, 0) / cScores.length;
      const weight = Number(c.weight);
      const percent = avg / c.maxScore;
      const tier = percent >= 0.8 ? "strong" : percent >= 0.5 ? "developing" : "weak";
      // Pull the tier-specific recommendation from the feedback jsonb
      const fb = c.feedback as any;
      const tierFeedback = fb?.[tier]?.[lang]?.rec || fb?.[tier]?.en?.rec;
      totalWeighted += avg * weight;
      totalMaxWeighted += c.maxScore * weight;
      perCrit.push({
        label: lang === "ar" ? (c.labelAr || c.labelEn) : c.labelEn,
        score: Math.round(avg * 10) / 10,
        max: c.maxScore,
        weight,
        tier,
        feedback: tierFeedback,
      });
    }
    if (perCrit.length === 0 && notes.length === 0) continue;

    // Weighted average normalized to /5
    const avg = totalMaxWeighted > 0
      ? (totalWeighted / totalMaxWeighted) * 5
      : 0;

    const durations =
      tpl.layout === "weekly"
        ? WEEKLY_DAYS.map((d) => {
            const m = tMeta.find((x) => x.day === d.day);
            return { dayLabel: d.en, minutes: m?.minutes ?? 0 };
          }).filter((d) => d.minutes > 0)
        : undefined;

    const gen = await generateEvalText({
      teacherName: t.name,
      templateName: lang === "ar" ? (tpl.nameAr || tpl.name) : tpl.name,
      termLabel: sheet.termLabel,
      weekLabel: sheet.weekLabel,
      layout: tpl.layout,
      scores: perCrit,
      notes,
      durations,
      avg,
      language: lang,
    });

    if (
      await upsertEvalReport({
        evalSheetId: sheetId,
        evalTeacherId: t.id,
        recipientEmail: t.email,
        recipientName: t.name,
        level: gen.level,
        body: gen.body,
        language: lang,
      })
    )
      created++;
  }

  await db
    .update(evalSheets)
    .set({ reportsGeneratedAt: new Date() })
    .where(eq(evalSheets.id, sheetId));

  logger.info({ sheetId, created }, "Teacher-eval reports generated");
  return { created };
}
