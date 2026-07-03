import { logger } from "./logger";

export interface PdfReportInput {
  reportKind: "parent" | "teacher" | "academic";
  language: "ar" | "en";
  studentName: string;
  courseName: string;
  teacherName: string;
  level: string;
  body: string;
  scores: { label: string; score: number | null }[];
  teacherFeedback?: string;
  activityLinks?: { title: string; url: string }[];
  teachingMethods?: string[];
  absences?: { date: string; studentName: string; phone: string }[];
  generatedAt: string;
}

/**
 * Generate a beautifully formatted HTML report that can be:
 * 1. Displayed in-app
 * 2. Printed to PDF via browser (window.print)
 * 3. Emailed as HTML
 */
export function generateReportHtml(input: PdfReportInput): string {
  const isAr = input.language === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const fontFamily = isAr ? "'Amiri', 'Times New Roman', serif" : "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

  // Score table
  const scoreRows = input.scores
    .map(s => `<tr><td>${s.label}</td><td>${s.score !== null ? `${s.score}/5` : "—"}</td></tr>`)
    .join("");

  // Activity links for teacher report
  const activitySection = input.activityLinks?.length
    ? `
    <div class="section">
      <h3>${isAr ? "📚 أنشطة ومواقع مقترحة" : "📚 Suggested Activities & Resources"}</h3>
      <ul class="links-list">
        ${input.activityLinks.map(l => `<li><a href="${l.url}" target="_blank">${l.title}</a></li>`).join("")}
      </ul>
    </div>`
    : "";

  // Teaching methods for teacher report
  const methodsSection = input.teachingMethods?.length
    ? `
    <div class="section">
      <h3>${isAr ? "🎯 طرق تدريس حديثة" : "🎯 Modern Teaching Methods"}</h3>
      <ul class="methods-list">
        ${input.teachingMethods.map(m => `<li>${m}</li>`).join("")}
      </ul>
    </div>`
    : "";

  // Teacher feedback
  const feedbackSection = input.teacherFeedback
    ? `
    <div class="section feedback">
      <h3>${isAr ? "💡 ملاحظات للمعلّم" : "💡 Teacher Feedback"}</h3>
      <p>${input.teacherFeedback}</p>
    </div>`
    : "";

  // Absence table (academic report)
  const absenceSection = input.absences?.length
    ? `
    <div class="section">
      <h3>${isAr ? "⚠️ سجل الغياب" : "⚠️ Absence Record"}</h3>
      <table class="absence-table">
        <tr><th>${isAr ? "التاريخ" : "Date"}</th><th>${isAr ? "الطالب" : "Student"}</th><th>${isAr ? "رقم الهاتف" : "Phone"}</th></tr>
        ${input.absences.map(a => `<tr><td>${a.date}</td><td>${a.studentName}</td><td>${a.phone || "—"}</td></tr>`).join("")}
      </table>
    </div>`
    : "";

  const headerTitle = {
    parent: isAr ? "تقرير الطالب" : "Student Report",
    teacher: isAr ? "تقرير المعلّم" : "Teacher Report",
    academic: isAr ? "تقرير إدارة الأكاديمية" : "Academic Management Report",
  }[input.reportKind];

  const watermarkText = {
    parent: "",
    teacher: isAr ? "نسخة المعلّم" : "Teacher Copy",
    academic: isAr ? "تقارير الإدارة" : "Management Reports",
  }[input.reportKind];

  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
<meta charset="utf-8">
<title>${headerTitle} — ${input.studentName}</title>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Segoe+UI:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { margin: 20mm 15mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${fontFamily};
    color: #1a1a2e;
    background: #f8f9fc;
    line-height: 1.7;
    padding: 40px;
  }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 80px;
    font-weight: 900;
    color: rgba(37,99,235,0.04);
    pointer-events: none;
    z-index: 0;
    letter-spacing: 8px;
    white-space: nowrap;
  }
  .report-container {
    max-width: 900px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.08);
    overflow: hidden;
    position: relative;
    z-index: 1;
  }
  .header {
    background: linear-gradient(135deg, #1a1a5e 0%, #2d2d8a 40%, #1e3a72 100%);
    padding: 40px 48px 32px;
    position: relative;
    overflow: hidden;
  }
  .header::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%);
    pointer-events: none;
  }
  .header .pattern {
    position: absolute; inset: 0;
    opacity: 0.03;
    background-image: radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px);
    background-size: 16px 16px;
  }
  .header-content { position: relative; z-index: 1; }
  .header-badge {
    display: inline-block;
    background: rgba(0,174,116,0.2);
    border: 1px solid rgba(0,174,116,0.3);
    color: #00ae74;
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 12px;
  }
  .header h1 {
    color: #ffffff;
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }
  .header p {
    color: rgba(255,255,255,0.65);
    font-size: 14px;
  }
  .header .meta-row {
    display: flex;
    gap: 24px;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .header .meta-item {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 12px;
    color: rgba(255,255,255,0.8);
  }
  .header .meta-item strong {
    color: #ffffff;
    display: block;
    font-size: 13px;
    margin-bottom: 2px;
  }
  .body { padding: 40px 48px; }
  .section {
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid #eef0f6;
  }
  .section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .section h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a5e;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section p {
    font-size: 14px;
    color: #374151;
    line-height: 1.8;
    white-space: pre-wrap;
  }
  .score-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  .score-table th {
    background: linear-gradient(135deg, #f0f4ff, #e8edff);
    color: #1a1a5e;
    font-weight: 700;
    font-size: 13px;
    padding: 12px 16px;
    text-align: ${isAr ? "right" : "left"};
    border-bottom: 2px solid #c7d2fe;
  }
  .score-table td {
    padding: 10px 16px;
    font-size: 13px;
    color: #374151;
    border-bottom: 1px solid #f0f2f7;
  }
  .score-table tr:last-child td { border-bottom: none; }
  .score-table tr:hover td { background: #f8faff; }
  .score-value {
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 6px;
    display: inline-block;
    font-size: 13px;
  }
  .score-good { background: rgba(0,174,116,0.15); color: #047857; }
  .score-avg { background: rgba(245,158,11,0.15); color: #b45309; }
  .score-low { background: rgba(239,68,68,0.15); color: #b91c1c; }
  .links-list, .methods-list {
    list-style: none;
    padding: 0;
  }
  .links-list li, .methods-list li {
    padding: 8px 12px;
    margin-bottom: 6px;
    background: #f8faff;
    border-radius: 8px;
    border: 1px solid #eef0f6;
    font-size: 13px;
    color: #374151;
  }
  .links-list a {
    color: #2563eb;
    text-decoration: none;
    font-weight: 600;
  }
  .links-list a:hover { text-decoration: underline; }
  .feedback {
    background: linear-gradient(135deg, #fef9ee, #fff8e7);
    border: 1px solid #fde68a;
    border-radius: 12px;
    padding: 20px 24px !important;
  }
  .feedback h3 { color: #92400e; }
  .absence-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #fecaca;
  }
  .absence-table th {
    background: #fef2f2;
    color: #991b1b;
    font-weight: 700;
    font-size: 12px;
    padding: 10px 14px;
    text-align: ${isAr ? "right" : "left"};
    border-bottom: 2px solid #fecaca;
  }
  .absence-table td {
    padding: 8px 14px;
    font-size: 12px;
    color: #374151;
    border-bottom: 1px solid #fee2e2;
  }
  .footer {
    background: #f8f9fc;
    padding: 24px 48px;
    border-top: 1px solid #eef0f6;
    text-align: center;
  }
  .footer p {
    font-size: 11px;
    color: #9ca3af;
    line-height: 1.6;
  }
  .footer .brand {
    font-weight: 700;
    color: #1a1a5e;
    font-size: 13px;
  }
  .status-badge {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .status-sent { background: rgba(0,174,116,0.15); color: #047857; }
  .status-draft { background: rgba(245,158,11,0.15); color: #b45309; }
  @media print {
    body { background: white; padding: 0; }
    .report-container { box-shadow: none; border-radius: 0; }
    .watermark { opacity: 1; }
  }
</style>
</head>
<body>
<div class="watermark">${watermarkText}</div>
<div class="report-container">
  <div class="header">
    <div class="pattern"></div>
    <div class="header-content">
      <div class="header-badge">${headerTitle}</div>
      <h1>${input.studentName}</h1>
      <p>${input.courseName} · ${input.teacherName || "Britishce44"}</p>
      <div class="meta-row">
        <div class="meta-item"><strong>${isAr ? "المستوى" : "Level"}</strong>${input.level}</div>
        <div class="meta-item"><strong>${isAr ? "التاريخ" : "Date"}</strong>${new Date(input.generatedAt).toLocaleDateString(isAr ? "ar-YE" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        <div class="meta-item"><strong>${isAr ? "التقرير" : "Report"}</strong>${isAr ? "تقرير الأداء" : "Performance Report"}</div>
      </div>
    </div>
  </div>
  <div class="body">
    ${input.scores.length ? `
    <div class="section">
      <h3>${isAr ? "📊 درجات التقييم" : "📊 Assessment Scores"}</h3>
      <table class="score-table">
        <tr><th>${isAr ? "المعيار" : "Criterion"}</th><th>${isAr ? "الدرجة" : "Score"}</th></tr>
        ${input.scores.map(s => {
          const cls = s.score !== null && s.score >= 4 ? "score-good" : s.score !== null && s.score >= 3 ? "score-avg" : "score-low";
          return `<tr><td>${s.label}</td><td><span class="score-value ${cls}">${s.score !== null ? `${s.score}/5` : "—"}</span></td></tr>`;
        }).join("")}
      </table>
    </div>` : ""}
    <div class="section">
      <h3>${isAr ? "📝 التقرير التفصيلي" : "📝 Detailed Report"}</h3>
      <p>${input.body}</p>
    </div>
    ${feedbackSection}
    ${activitySection}
    ${methodsSection}
    ${absenceSection}
  </div>
  <div class="footer">
    <p class="brand">${isAr ? "المركز البريطاني الأول" : "Britishce44"} — ${isAr ? "تعليم اللغة الإنجليزية عن بُعد" : "Online English Language School"}</p>
    <p>Taiz, Yemen · ${isAr ? "جميع الحقوق محفوظة" : "All Rights Reserved"} © ${new Date().getFullYear()}</p>
    <p style="margin-top:4px;font-size:10px;color:#d1d5db">${isAr ? "تم إنشاء هذا التقرير تلقائياً" : "This report was automatically generated"} · ${new Date(input.generatedAt).toISOString().split("T")[0]}</p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Create a PDF buffer from report HTML using pdfmake (server-side).
 * Falls back to returning the HTML string for client-side rendering.
 */
export async function generatePdfBuffer(input: PdfReportInput): Promise<Buffer | null> {
  try {
    const PdfPrinter = (await import("pdfmake")).default;
    const fonts = {
      Roboto: {
        normal: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.18/fonts/Roboto/Roboto-Regular.ttf",
        bold: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.18/fonts/Roboto/Roboto-Medium.ttf",
        italics: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.18/fonts/Roboto/Roboto-Italic.ttf",
        bolditalics: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.18/fonts/Roboto/Roboto-MediumItalic.ttf",
      },
    };

    const printer = new PdfPrinter(fonts);
    const isAr = input.language === "ar";

    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.5 },
      header: () => ({
        columns: [
          { text: "Britishce44", fontSize: 8, color: "#9ca3af", alignment: "left", margin: [40, 15, 0, 0] },
          { text: new Date().toISOString().split("T")[0], fontSize: 8, color: "#9ca3af", alignment: "right", margin: [0, 15, 40, 0] },
        ],
      }),
      footer: (currentPage: number, pageCount: number) => ({
        text: `${currentPage}/${pageCount}`,
        alignment: "center",
        fontSize: 8,
        color: "#9ca3af",
        margin: [0, 0, 0, 15],
      }),
      content: [
        // Header block
        { stack: [
          { text: input.studentName, fontSize: 24, bold: true, color: "#1a1a5e", margin: [0, 0, 0, 4] },
          { text: `${input.courseName} · ${input.teacherName || "Britishce44"}`, fontSize: 11, color: "#6b7280", margin: [0, 0, 0, 12] },
          { columns: [
            { width: "*", text: `Level: ${input.level}`, fontSize: 9, color: "#374151" },
            { width: "*", text: `Date: ${new Date(input.generatedAt).toLocaleDateString()}`, fontSize: 9, color: "#374151", alignment: "center" },
            { width: "*", text: "Performance Report", fontSize: 9, color: "#374151", alignment: "right" },
          ], margin: [0, 0, 0, 20] },
        ], margin: [0, 0, 0, 0] },

        // Scores table
        ...(input.scores.length ? [{
          table: {
            headerRows: 1,
            widths: ["*", "auto"],
            body: [
              [{ text: isAr ? "المعيار" : "Criterion", style: "tableHeader" },
               { text: isAr ? "الدرجة" : "Score", style: "tableHeader", alignment: "center" }],
              ...input.scores.map(s => [
                s.label,
                { text: s.score !== null ? `${s.score}/5` : "—", alignment: "center", color: s.score !== null && s.score >= 4 ? "#047857" : s.score !== null && s.score >= 3 ? "#b45309" : "#b91c1c", bold: true },
              ]),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => rowIndex === 0 ? "#1a1a5e" : rowIndex % 2 === 0 ? "#f8faff" : null,
            hLineColor: () => "#e5e7eb",
            vLineColor: () => "#e5e7eb",
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 8,
            paddingBottom: () => 8,
          },
          margin: [0, 0, 0, 20],
        }] : []),

        // Body text
        { text: isAr ? "التقرير التفصيلي" : "Detailed Report", fontSize: 14, bold: true, color: "#1a1a5e", margin: [0, 0, 0, 8] },
        { text: input.body, fontSize: 10, color: "#374151", lineHeight: 1.7, margin: [0, 0, 0, 20] },

        // Teacher feedback
        ...(input.teacherFeedback ? [
          { text: isAr ? "ملاحظات للمعلّم" : "Teacher Feedback", fontSize: 14, bold: true, color: "#92400e", margin: [0, 0, 0, 6] },
          { text: input.teacherFeedback, fontSize: 10, color: "#374151", margin: [0, 0, 0, 16] },
        ] : []),

        // Activity links
        ...(input.activityLinks?.length ? [
          { text: isAr ? "أنشطة ومواقع مقترحة" : "Suggested Activities & Resources", fontSize: 14, bold: true, color: "#1a1a5e", margin: [0, 0, 0, 6] },
          ...input.activityLinks.map(a => ({
            text: `• ${a.title}: ${a.url}`,
            fontSize: 10,
            color: "#2563eb",
            margin: [0, 2, 0, 2],
          })),
          { text: "", margin: [0, 0, 0, 12] },
        ] : []),

        // Teaching methods
        ...(input.teachingMethods?.length ? [
          { text: isAr ? "طرق تدريس حديثة" : "Modern Teaching Methods", fontSize: 14, bold: true, color: "#1a1a5e", margin: [0, 0, 0, 6] },
          ...input.teachingMethods.map(m => ({
            text: `• ${m}`,
            fontSize: 10,
            color: "#374151",
            margin: [0, 2, 0, 2],
          })),
          { text: "", margin: [0, 0, 0, 12] },
        ] : []),

        // Absence table
        ...(input.absences?.length ? [{
          text: isAr ? "سجل الغياب" : "Absence Record", fontSize: 14, bold: true, color: "#991b1b", margin: [0, 0, 0, 6],
        }, {
          table: {
            headerRows: 1,
            widths: ["auto", "*", "auto"],
            body: [
              [{ text: isAr ? "التاريخ" : "Date", style: "tableHeader" },
               { text: isAr ? "الطالب" : "Student", style: "tableHeader" },
               { text: isAr ? "رقم الهاتف" : "Phone", style: "tableHeader" }],
              ...input.absences.map(a => [a.date, a.studentName, a.phone || "—"]),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => rowIndex === 0 ? "#991b1b" : rowIndex % 2 === 0 ? "#fef2f2" : null,
            hLineColor: () => "#fecaca",
            vLineColor: () => "#fecaca",
          },
          margin: [0, 0, 0, 20],
        }] : []),
      ],
      styles: {
        tableHeader: { fontSize: 10, bold: true, color: "#ffffff", alignment: "center" },
      },
    };

    return new Promise<Buffer>((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });
  } catch (err) {
    logger.warn({ err }, "PDF generation failed, falling back to HTML");
    return null;
  }
}
