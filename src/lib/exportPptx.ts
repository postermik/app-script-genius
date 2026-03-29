import type { NarrativeOutputData } from "@/types/narrative";
import type { DeckTheme } from "@/components/SlidePreview";
import {
  SLIDE, CONTENT_W,
  CHAR_LIMITS,
  getHeadlineFontSize, estimateHeight, truncate, resolveLayout,
  type LayoutType,
} from "@/lib/slideLayouts";

interface ExportOptions {
  output: NarrativeOutputData;
  isPro: boolean;
  excludedSlides: Set<number>;
  slideOrder: number[];
  deckTheme: DeckTheme;
}

interface ThemeColors {
  BG: string; FG: string; PRIMARY: string;
  MUTED: string; MUTED_TEXT: string; ACCENT: string;
}

function getThemeColors(theme: DeckTheme): ThemeColors {
  const strip = (hex: string) => hex.replace("#", "");
  if (theme.scheme === "light") {
    return { BG: "ffffff", FG: "1a1a2e", PRIMARY: "3b82f6", MUTED: "6b7280", MUTED_TEXT: "9ca3af", ACCENT: "3b82f6" };
  }
  if (theme.scheme === "custom") {
    const bgHex = theme.secondary || "#0b0f14";
    const brightness = parseInt(bgHex.replace("#", ""), 16);
    return {
      BG: strip(bgHex),
      FG: brightness > 0x888888 ? "1a1a2e" : "dce0e8",
      PRIMARY: strip(theme.primary || "#3b82f6"),
      MUTED: "6b7280", MUTED_TEXT: "9ca3af",
      ACCENT: strip(theme.accent || "#1e3a5f"),
    };
  }
  return { BG: "0b0f14", FG: "dce0e8", PRIMARY: "3b82f6", MUTED: "6b7280", MUTED_TEXT: "9ca3af", ACCENT: "3b82f6" };
}

function extractDataPoints(raw: any): string[] {
  const points: string[] = [];
  if (raw?.metadata?.dataPoints) {
    for (const dp of raw.metadata.dataPoints) {
      if (typeof dp === "string") points.push(dp);
    }
  }
  if (points.length === 0 && Array.isArray(raw?.bodyContent)) {
    for (const line of raw.bodyContent) {
      const match = line.match(/^[\$\d][\d,\.]+[KMBkmb%]?\b/);
      if (match) points.push(match[0]);
      if (points.length >= 3) break;
    }
  }
  return points;
}

function slideFields(raw: any) {
  const headline = truncate(typeof raw === "string" ? raw : (raw.headline || ""), CHAR_LIMITS.HEADLINE_MAX);
  const subheadline = truncate(typeof raw === "string" ? "" : (raw.subheadline || raw.subheader || ""), CHAR_LIMITS.SUBHEADLINE_MAX);
  const bodyContent: string[] = (typeof raw === "string" ? [] : (Array.isArray(raw.bodyContent) ? raw.bodyContent : []))
    .map((b: string) => truncate(b.replace(/^[-\u2022*]\s*/, ""), CHAR_LIMITS.BULLET_MAX));
  const speakerNotes = typeof raw === "string" ? "" : (raw.speakerNotes || "");
  const categoryLabel = truncate(typeof raw === "string" ? "" : (raw.categoryLabel || ""), CHAR_LIMITS.CATEGORY_MAX);
  const closingStatement = truncate(typeof raw === "string" ? "" : (raw.closingStatement || ""), CHAR_LIMITS.CLOSING_MAX);
  const layoutRecommendation = typeof raw === "string" ? "" : (raw.layoutRecommendation || "");
  const selectedLayout = typeof raw === "string" ? undefined : (raw.selectedLayout || undefined);
  return { headline, subheadline, bodyContent, speakerNotes, categoryLabel, closingStatement, layoutRecommendation, selectedLayout };
}

// Invert text color for elements on accent background
function onAccent(colors: ThemeColors): string {
  return colors.BG === "ffffff" ? "ffffff" : colors.BG;
}

interface RenderContext { pptx: any; slide: any; colors: ThemeColors; isPro: boolean; raw: any; }

// ── LAYOUT: Bullets (default) ──
function renderBullets(ctx: RenderContext, f: ReturnType<typeof slideFields>) {
  const { slide, colors, isPro } = ctx;
  const ML = SLIDE.MARGIN_L;
  let y = 0.35;

  if (f.categoryLabel) {
    slide.addText(f.categoryLabel.toUpperCase(), { x: ML, y, w: CONTENT_W, h: 0.25, fontSize: 10, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "top", charSpacing: 3 });
    y += 0.3;
  }

  const hSize = getHeadlineFontSize(f.headline);
  const hH = Math.max(estimateHeight(f.headline, hSize), 0.5);
  slide.addText(f.headline, { x: ML, y, w: CONTENT_W, h: hH + 0.15, fontSize: hSize, fontFace: "Arial", bold: true, color: colors.PRIMARY, align: "left", valign: "top" });
  y += hH + 0.2;

  if (f.subheadline) {
    const sH = Math.max(estimateHeight(f.subheadline, 16), 0.35);
    slide.addText(f.subheadline, { x: ML, y, w: CONTENT_W, h: sH + 0.1, fontSize: 16, fontFace: "Arial", color: colors.MUTED_TEXT, align: "left", valign: "top" });
    y += sH + 0.15;
  }

  if (f.bodyContent.length > 0) {
    const remaining = SLIDE.H - SLIDE.MARGIN_B - y - (f.closingStatement ? 0.5 : 0) - (isPro ? 0 : 0.3);
    const bSize = f.bodyContent.length > 4 ? 12 : 13;
    const rows = f.bodyContent.slice(0, 6).map((line: string) => ({ text: line, options: { fontSize: bSize, fontFace: "Arial", color: colors.FG, bullet: { code: "2022", color: colors.ACCENT }, lineSpacingMultiple: 1.4, paraSpaceAfter: 5 } }));
    slide.addText(rows as any, { x: ML, y, w: CONTENT_W, h: Math.max(remaining, 1.5), valign: "top" });
  }

  if (f.closingStatement) {
    slide.addText(f.closingStatement, { x: ML, y: SLIDE.H - SLIDE.MARGIN_B - 0.4, w: CONTENT_W, h: 0.35, fontSize: 12, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "bottom" });
  }
}

// ── LAYOUT: Statement ──
function renderStatement(ctx: RenderContext, f: ReturnType<typeof slideFields>) {
  const { pptx, slide, colors } = ctx;
  const ML = SLIDE.MARGIN_L;

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: SLIDE.W, h: 0.06, fill: { color: colors.ACCENT } });

  if (f.categoryLabel) {
    slide.addText(f.categoryLabel.toUpperCase(), { x: ML, y: 0.8, w: CONTENT_W, h: 0.3, fontSize: 12, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "top", charSpacing: 4 });
  }

  const hSize = f.headline.length > 60 ? 28 : 32;
  slide.addText(f.headline, { x: ML, y: f.categoryLabel ? 1.2 : 1.4, w: CONTENT_W, h: 2.0, fontSize: hSize, fontFace: "Arial", bold: true, color: colors.PRIMARY, align: "left", valign: "middle" });

  if (f.subheadline) {
    slide.addText(f.subheadline, { x: ML, y: 3.5, w: CONTENT_W * 0.75, h: 0.6, fontSize: 16, fontFace: "Arial", color: colors.MUTED_TEXT, align: "left", valign: "top" });
  }

  if (f.closingStatement) {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: SLIDE.H - 0.9, w: SLIDE.W, h: 0.9, fill: { color: colors.ACCENT } });
    slide.addText(f.closingStatement, { x: ML, y: SLIDE.H - 0.85, w: CONTENT_W, h: 0.7, fontSize: 14, fontFace: "Arial", bold: true, color: onAccent(colors), align: "left", valign: "middle" });
  }
}

// ── LAYOUT: Data Callout ──
function renderDataCallout(ctx: RenderContext, f: ReturnType<typeof slideFields>) {
  const { pptx, slide, colors, raw } = ctx;
  const ML = SLIDE.MARGIN_L;
  let y = 0.35;

  if (f.categoryLabel) {
    slide.addText(f.categoryLabel.toUpperCase(), { x: ML, y, w: CONTENT_W, h: 0.25, fontSize: 10, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "top", charSpacing: 3 });
    y += 0.3;
  }

  const hSize = getHeadlineFontSize(f.headline);
  const hH = Math.max(estimateHeight(f.headline, hSize), 0.5);
  slide.addText(f.headline, { x: ML, y, w: CONTENT_W, h: hH + 0.1, fontSize: hSize, fontFace: "Arial", bold: true, color: colors.PRIMARY, align: "left", valign: "top" });
  y += hH + 0.25;

  const dataPoints = extractDataPoints(raw);
  const labels = f.bodyContent.slice(0, 3);
  const cardCount = Math.max(dataPoints.length, Math.min(labels.length, 3));

  if (cardCount > 0) {
    const gap = 0.3;
    const cardW = (CONTENT_W - gap * (cardCount - 1)) / cardCount;
    const cardH = 1.6;

    for (let i = 0; i < cardCount; i++) {
      const cx = ML + i * (cardW + gap);
      slide.addShape(pptx.ShapeType.rect, { x: cx, y, w: cardW, h: cardH, fill: { color: colors.ACCENT }, rectRadius: 0.06 });
      if (dataPoints[i]) {
        slide.addText(dataPoints[i], { x: cx + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.7, fontSize: 36, fontFace: "Arial", bold: true, color: onAccent(colors), align: "left", valign: "middle" });
      }
      if (labels[i]) {
        slide.addText(truncate(labels[i], 80), { x: cx + 0.2, y: y + (dataPoints[i] ? 0.85 : 0.2), w: cardW - 0.4, h: 0.6, fontSize: 11, fontFace: "Arial", color: onAccent(colors), align: "left", valign: "top" });
      }
    }
    y += cardH + 0.2;
  }

  const rest = f.bodyContent.slice(cardCount);
  if (rest.length > 0) {
    const rows = rest.map((line: string) => ({ text: line, options: { fontSize: 12, fontFace: "Arial", color: colors.FG, bullet: { code: "2022", color: colors.ACCENT }, lineSpacingMultiple: 1.3, paraSpaceAfter: 4 } }));
    slide.addText(rows as any, { x: ML, y, w: CONTENT_W, h: SLIDE.H - y - SLIDE.MARGIN_B, valign: "top" });
  }
}

// ── LAYOUT: Matrix (2x2 grid) ──
function renderMatrix(ctx: RenderContext, f: ReturnType<typeof slideFields>) {
  const { pptx, slide, colors } = ctx;
  const ML = SLIDE.MARGIN_L;
  let y = 0.35;

  if (f.categoryLabel) {
    slide.addText(f.categoryLabel.toUpperCase(), { x: ML, y, w: CONTENT_W, h: 0.25, fontSize: 10, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "top", charSpacing: 3 });
    y += 0.3;
  }

  const hSize = getHeadlineFontSize(f.headline);
  const hH = Math.max(estimateHeight(f.headline, hSize), 0.4);
  slide.addText(f.headline, { x: ML, y, w: CONTENT_W, h: hH + 0.1, fontSize: hSize, fontFace: "Arial", bold: true, color: colors.PRIMARY, align: "left", valign: "top" });
  y += hH + 0.25;

  const items = f.bodyContent.slice(0, 4);
  if (items.length >= 2) {
    const cols = 2;
    const rows = Math.ceil(items.length / cols);
    const gap = 0.2;
    const cellW = (CONTENT_W - gap) / cols;
    const cellH = (SLIDE.H - y - SLIDE.MARGIN_B - 0.1) / rows - gap / 2;

    for (let i = 0; i < items.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = ML + col * (cellW + gap);
      const cy = y + row * (cellH + gap);

      slide.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: cellW, h: cellH, fill: { color: colors.ACCENT }, rectRadius: 0.06 });
      slide.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: 0.04, h: cellH, fill: { color: colors.PRIMARY } });
      slide.addText(truncate(items[i], 120), { x: cx + 0.2, y: cy + 0.15, w: cellW - 0.4, h: cellH - 0.3, fontSize: 12, fontFace: "Arial", color: onAccent(colors), align: "left", valign: "top" });
    }
  }
}

// ── LAYOUT: Timeline ──
function renderTimeline(ctx: RenderContext, f: ReturnType<typeof slideFields>) {
  const { pptx, slide, colors } = ctx;
  const ML = SLIDE.MARGIN_L;
  let y = 0.35;

  if (f.categoryLabel) {
    slide.addText(f.categoryLabel.toUpperCase(), { x: ML, y, w: CONTENT_W, h: 0.25, fontSize: 10, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "top", charSpacing: 3 });
    y += 0.3;
  }

  const hSize = getHeadlineFontSize(f.headline);
  const hH = Math.max(estimateHeight(f.headline, hSize), 0.4);
  slide.addText(f.headline, { x: ML, y, w: CONTENT_W, h: hH + 0.1, fontSize: hSize, fontFace: "Arial", bold: true, color: colors.PRIMARY, align: "left", valign: "top" });
  y += hH + 0.35;

  const items = f.bodyContent.slice(0, 5);
  if (items.length >= 2) {
    const n = items.length;
    const spacing = CONTENT_W / n;
    const r = 0.18;
    const lineY = y + r;

    slide.addShape(pptx.ShapeType.rect, { x: ML + spacing / 2, y: lineY - 0.015, w: CONTENT_W - spacing, h: 0.03, fill: { color: colors.ACCENT } });

    for (let i = 0; i < n; i++) {
      const cx = ML + spacing * i + spacing / 2;
      slide.addShape(pptx.ShapeType.ellipse, { x: cx - r, y, w: r * 2, h: r * 2, fill: { color: colors.PRIMARY } });
      slide.addText(String(i + 1), { x: cx - r, y, w: r * 2, h: r * 2, fontSize: 12, fontFace: "Arial", bold: true, color: onAccent(colors), align: "center", valign: "middle" });
      slide.addText(truncate(items[i], 80), { x: cx - spacing / 2 + 0.1, y: y + r * 2 + 0.15, w: spacing - 0.2, h: SLIDE.H - (y + r * 2 + 0.15) - SLIDE.MARGIN_B, fontSize: 11, fontFace: "Arial", color: colors.FG, align: "center", valign: "top" });
    }
  }
}

// ── LAYOUT: Cards (3-column) ──
function renderCards(ctx: RenderContext, f: ReturnType<typeof slideFields>) {
  const { pptx, slide, colors, raw } = ctx;
  const ML = SLIDE.MARGIN_L;
  let y = 0.35;

  if (f.categoryLabel) {
    slide.addText(f.categoryLabel.toUpperCase(), { x: ML, y, w: CONTENT_W, h: 0.25, fontSize: 10, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "top", charSpacing: 3 });
    y += 0.3;
  }

  const hSize = getHeadlineFontSize(f.headline);
  const hH = Math.max(estimateHeight(f.headline, hSize), 0.4);
  slide.addText(f.headline, { x: ML, y, w: CONTENT_W, h: hH + 0.1, fontSize: hSize, fontFace: "Arial", bold: true, color: colors.PRIMARY, align: "left", valign: "top" });
  y += hH + 0.3;

  const items = f.bodyContent.slice(0, 3);
  const dp = extractDataPoints(raw);
  if (items.length >= 2) {
    const n = items.length;
    const gap = 0.25;
    const cW = (CONTENT_W - gap * (n - 1)) / n;
    const cH = SLIDE.H - y - SLIDE.MARGIN_B - 0.1;

    for (let i = 0; i < n; i++) {
      const cx = ML + i * (cW + gap);
      slide.addShape(pptx.ShapeType.rect, { x: cx, y, w: cW, h: cH, fill: { color: colors.ACCENT }, rectRadius: 0.06 });
      slide.addShape(pptx.ShapeType.rect, { x: cx, y, w: cW, h: 0.04, fill: { color: colors.PRIMARY } });

      let ty = y + 0.2;
      if (dp[i]) {
        slide.addText(dp[i], { x: cx + 0.2, y: ty, w: cW - 0.4, h: 0.5, fontSize: 28, fontFace: "Arial", bold: true, color: onAccent(colors), align: "left", valign: "middle" });
        ty += 0.55;
      }
      slide.addText(truncate(items[i], 100), { x: cx + 0.2, y: ty, w: cW - 0.4, h: cH - (ty - y) - 0.2, fontSize: 12, fontFace: "Arial", color: onAccent(colors), align: "left", valign: "top" });
    }
  } else {
    renderBullets(ctx, f);
  }
}

// ── LAYOUT: Two Column ──
function renderTwoColumn(ctx: RenderContext, f: ReturnType<typeof slideFields>) {
  const { pptx, slide, colors } = ctx;
  const ML = SLIDE.MARGIN_L;
  const leftW = CONTENT_W * 0.55;
  const rightW = CONTENT_W * 0.4;
  const rightX = ML + leftW + CONTENT_W * 0.05;
  let y = 0.35;

  if (f.categoryLabel) {
    slide.addText(f.categoryLabel.toUpperCase(), { x: ML, y, w: leftW, h: 0.25, fontSize: 10, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "top", charSpacing: 3 });
    y += 0.3;
  }

  const hSize = getHeadlineFontSize(f.headline);
  const hH = Math.max(estimateHeight(f.headline, hSize, leftW), 0.5);
  slide.addText(f.headline, { x: ML, y, w: leftW, h: hH + 0.1, fontSize: hSize, fontFace: "Arial", bold: true, color: colors.PRIMARY, align: "left", valign: "top" });
  y += hH + 0.2;

  if (f.subheadline) {
    const sH = Math.max(estimateHeight(f.subheadline, 14, leftW), 0.3);
    slide.addText(f.subheadline, { x: ML, y, w: leftW, h: sH + 0.1, fontSize: 14, fontFace: "Arial", color: colors.MUTED_TEXT, align: "left", valign: "top" });
    y += sH + 0.15;
  }

  if (f.bodyContent.length > 0) {
    const rows = f.bodyContent.slice(0, 5).map((line: string) => ({ text: line, options: { fontSize: 12, fontFace: "Arial", color: colors.FG, bullet: { code: "2022", color: colors.ACCENT }, lineSpacingMultiple: 1.3, paraSpaceAfter: 4 } }));
    slide.addText(rows as any, { x: ML, y, w: leftW, h: SLIDE.H - y - SLIDE.MARGIN_B - (f.closingStatement ? 0.5 : 0), valign: "top" });
  }

  // Right accent area
  const rTop = 0.6;
  const rH = SLIDE.H - rTop - SLIDE.MARGIN_B;
  slide.addShape(pptx.ShapeType.rect, { x: rightX, y: rTop, w: rightW, h: rH, fill: { color: colors.ACCENT }, rectRadius: 0.08 });
  const vDir = typeof ctx.raw !== "string" ? (ctx.raw?.metadata?.visualDirection || "") : "";
  if (vDir) {
    slide.addText(vDir, { x: rightX + 0.3, y: rTop + rH / 2 - 0.3, w: rightW - 0.6, h: 0.6, fontSize: 12, fontFace: "Arial", italic: true, color: onAccent(colors), align: "center", valign: "middle" });
  }

  if (f.closingStatement) {
    slide.addText(f.closingStatement, { x: ML, y: SLIDE.H - SLIDE.MARGIN_B - 0.4, w: leftW, h: 0.35, fontSize: 11, fontFace: "Arial", bold: true, color: colors.ACCENT, align: "left", valign: "bottom" });
  }
}

// ── Dispatcher ──
const RENDERERS: Record<LayoutType, (ctx: RenderContext, f: ReturnType<typeof slideFields>) => void> = {
  "bullets": renderBullets, "statement": renderStatement, "data-callout": renderDataCallout,
  "two-column": renderTwoColumn, "matrix": renderMatrix, "timeline": renderTimeline, "cards": renderCards,
};

// ── Main export ──
export async function exportPptx({ output, isPro, excludedSlides, slideOrder, deckTheme }: ExportOptions) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const title = (output as any).title || "Narrative Deck";
  pptx.author = "Rhetoric"; pptx.title = title; pptx.layout = "LAYOUT_16x9";
  const colors = getThemeColors(deckTheme);

  // Title slide
  const ts = pptx.addSlide();
  ts.background = { color: colors.BG };
  ts.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: SLIDE.W, h: 0.06, fill: { color: colors.ACCENT } });
  ts.addShape(pptx.ShapeType.rect, { x: 0, y: SLIDE.H - 0.06, w: SLIDE.W, h: 0.06, fill: { color: colors.ACCENT } });
  ts.addText(title, { x: 0.8, y: 1.6, w: 8.4, h: 1.4, fontSize: 36, fontFace: "Arial", bold: true, color: colors.PRIMARY, align: "center", valign: "middle" });
  ts.addText(output.mode.replace(/_/g, " ").toUpperCase(), { x: 0.8, y: 3.1, w: 8.4, fontSize: 12, fontFace: "Arial", color: colors.MUTED_TEXT, align: "center", charSpacing: 5 });
  if (!isPro) ts.addText("Generated by Rhetoric", { x: 0.8, y: 4.8, w: 8.4, fontSize: 10, fontFace: "Arial", color: colors.MUTED, align: "center" });

  // Content slides
  const d = (output.data || (output as any).supporting || {}) as any;
  const del = (output as any).deliverable || {};
  const framework = d.deckFramework || del.deckFramework || d.boardDeckOutline || del.boardDeckOutline || [];
  const ordered = slideOrder.length > 0 ? slideOrder : framework.map((_: any, i: number) => i);
  const active = ordered.filter((i: number) => !excludedSlides.has(i));

  for (const idx of active) {
    const raw = framework[idx];
    if (!raw) continue;
    const fields = slideFields(raw);
    const layout = resolveLayout(fields.layoutRecommendation, fields.selectedLayout);
    const slide = pptx.addSlide();
    slide.background = { color: colors.BG };
    const ctx: RenderContext = { pptx, slide, colors, isPro, raw };
    (RENDERERS[layout] || renderBullets)(ctx, fields);
    if (fields.speakerNotes.trim()) slide.addNotes(fields.speakerNotes.trim());
    if (!isPro) slide.addText("Generated by Rhetoric", { x: SLIDE.MARGIN_L, y: SLIDE.H - 0.35, w: 3, fontSize: 8, fontFace: "Arial", color: colors.MUTED, align: "left" });
  }

  await pptx.writeFile({ fileName: `${title.replace(/[^a-zA-Z0-9 ]/g, "")}.pptx` });
}