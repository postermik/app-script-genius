import type { NarrativeOutputData } from "@/types/narrative";
import type { DeckTheme } from "@/components/SlidePreview";
import { SLIDE, CONTENT_W, CHAR_LIMITS, getHeadlineFontSize, estimateHeight, truncate, resolveLayout, type LayoutType } from "@/lib/slideLayouts";

interface ExportOptions { output: NarrativeOutputData; isPro: boolean; excludedSlides: Set<number>; slideOrder: number[]; deckTheme: DeckTheme; }
interface ThemeColors { BG: string; FG: string; PRIMARY: string; MUTED: string; MUTED_TEXT: string; ACCENT: string; }

function getThemeColors(theme: DeckTheme): ThemeColors {
  const strip = (h: string) => h.replace("#", "");
  if (theme.scheme === "light") return { BG:"ffffff", FG:"1a1a2e", PRIMARY:"3b82f6", MUTED:"6b7280", MUTED_TEXT:"9ca3af", ACCENT:"3b82f6" };
  if (theme.scheme === "custom") {
    const bg = theme.secondary || "#0b0f14"; const b = parseInt(bg.replace("#",""), 16);
    return { BG:strip(bg), FG: b>0x888888?"1a1a2e":"dce0e8", PRIMARY:strip(theme.primary||"#3b82f6"), MUTED:"6b7280", MUTED_TEXT:"9ca3af", ACCENT:strip(theme.accent||"#1e3a5f") };
  }
  return { BG:"0b0f14", FG:"dce0e8", PRIMARY:"3b82f6", MUTED:"6b7280", MUTED_TEXT:"9ca3af", ACCENT:"3b82f6" };
}

function onAccent(c: ThemeColors) { return "ffffff"; }

function slideFields(raw: any) {
  const s = (v: any, max: number) => truncate(typeof v === "string" ? v : (v || ""), max);
  const headline = s(typeof raw === "string" ? raw : raw?.headline, CHAR_LIMITS.HEADLINE_MAX);
  const subheadline = s(raw?.subheadline || raw?.subheader, CHAR_LIMITS.SUBHEADLINE_MAX);
  const bodyContent: string[] = (Array.isArray(raw?.bodyContent) ? raw.bodyContent : []).map((b: string) => truncate(b.replace(/^[-\u2022*]\s*/, ""), CHAR_LIMITS.BULLET_MAX));
  const categoryLabel = s(raw?.categoryLabel, CHAR_LIMITS.CATEGORY_MAX);
  const closingStatement = s(raw?.closingStatement, CHAR_LIMITS.CLOSING_MAX);
  const speakerNotes = raw?.speakerNotes || "";
  const dataPoints: string[] = raw?.metadata?.dataPoints || [];
  return { headline, subheadline, bodyContent, categoryLabel, closingStatement, speakerNotes, dataPoints };
}

type Ctx = { pptx: any; slide: any; c: ThemeColors; isPro: boolean; };
type Fields = ReturnType<typeof slideFields>;
const ML = SLIDE.MARGIN_L;

// ── Shared: category + headline, returns cursor Y ──
function renderHeader(ctx: Ctx, f: Fields): number {
  let y = 0.35;
  if (f.categoryLabel) {
    ctx.slide.addText(f.categoryLabel.toUpperCase(), { x:ML, y, w:CONTENT_W, h:0.25, fontSize:10, fontFace:"Arial", bold:true, color:ctx.c.ACCENT, align:"left", valign:"top", charSpacing:3 });
    y += 0.28;
  }
  const sz = getHeadlineFontSize(f.headline);
  const hH = Math.max(estimateHeight(f.headline, sz), 0.45);
  ctx.slide.addText(f.headline, { x:ML, y, w:CONTENT_W, h:hH+0.1, fontSize:sz, fontFace:"Arial", bold:true, color:ctx.c.PRIMARY, align:"left", valign:"top" });
  return y + hH + 0.18;
}

// ── BULLETS (default) ──
function renderBullets(ctx: Ctx, f: Fields) {
  let y = renderHeader(ctx, f);
  if (f.subheadline) {
    const h = Math.max(estimateHeight(f.subheadline, 14), 0.3);
    ctx.slide.addText(f.subheadline, { x:ML, y, w:CONTENT_W, h:h+0.1, fontSize:14, fontFace:"Arial", color:ctx.c.MUTED_TEXT, align:"left", valign:"top" });
    y += h + 0.12;
  }
  if (f.bodyContent.length > 0) {
    const bSz = f.bodyContent.length > 4 ? 11 : 12;
    const rows = f.bodyContent.slice(0,6).map(t => ({ text:t, options:{ fontSize:bSz, fontFace:"Arial", color:ctx.c.FG, bullet:{code:"2022",color:ctx.c.ACCENT}, lineSpacingMultiple:1.4, paraSpaceAfter:4 }}));
    ctx.slide.addText(rows as any, { x:ML, y, w:CONTENT_W, h:SLIDE.H-y-SLIDE.MARGIN_B-(f.closingStatement?0.45:0), valign:"top" });
  }
  if (f.closingStatement) ctx.slide.addText(f.closingStatement, { x:ML, y:SLIDE.H-SLIDE.MARGIN_B-0.35, w:CONTENT_W, h:0.3, fontSize:11, fontFace:"Arial", bold:true, color:ctx.c.ACCENT, align:"left", valign:"bottom" });
}

// ── STATEMENT ──
function renderStatement(ctx: Ctx, f: Fields) {
  const { pptx, slide, c } = ctx;
  slide.addShape(pptx.ShapeType.rect, { x:0, y:0, w:SLIDE.W, h:0.05, fill:{color:c.ACCENT} });
  if (f.categoryLabel) slide.addText(f.categoryLabel.toUpperCase(), { x:ML, y:0.7, w:CONTENT_W, h:0.25, fontSize:11, fontFace:"Arial", bold:true, color:c.ACCENT, align:"left", charSpacing:4 });
  const sz = f.headline.length > 50 ? 22 : 24;
  slide.addText(f.headline, { x:ML, y:f.categoryLabel?1.1:1.3, w:CONTENT_W, h:1.8, fontSize:sz, fontFace:"Arial", bold:true, color:c.PRIMARY, align:"left", valign:"middle" });
  if (f.subheadline) slide.addText(f.subheadline, { x:ML, y:3.2, w:CONTENT_W*0.75, h:0.5, fontSize:14, fontFace:"Arial", color:c.MUTED_TEXT, align:"left", valign:"top" });
  if (f.closingStatement) {
    slide.addShape(pptx.ShapeType.rect, { x:0, y:SLIDE.H-0.8, w:SLIDE.W, h:0.8, fill:{color:c.ACCENT} });
    slide.addText(f.closingStatement, { x:ML, y:SLIDE.H-0.75, w:CONTENT_W, h:0.6, fontSize:13, fontFace:"Arial", bold:true, color:"ffffff", align:"left", valign:"middle" });
  }
}

// ── DATA-CARDS ──
function renderDataCards(ctx: Ctx, f: Fields) {
  let y = renderHeader(ctx, f);
  const dp = f.dataPoints;
  const labels = f.bodyContent.slice(0, 3);
  const n = Math.max(dp.length, Math.min(labels.length, 3));
  if (n > 0) {
    const gap = 0.25; const cW = (CONTENT_W - gap*(n-1))/n; const cH = SLIDE.H - y - SLIDE.MARGIN_B - 0.1;
    for (let i = 0; i < n; i++) {
      const cx = ML + i*(cW+gap);
      ctx.slide.addShape(ctx.pptx.ShapeType.rect, { x:cx, y, w:cW, h:cH, fill:{color:ctx.c.ACCENT}, rectRadius:0.06 });
      ctx.slide.addShape(ctx.pptx.ShapeType.rect, { x:cx, y, w:cW, h:0.04, fill:{color:ctx.c.PRIMARY} });
      let ty = y + 0.2;
      if (dp[i]) { ctx.slide.addText(dp[i], { x:cx+0.15, y:ty, w:cW-0.3, h:0.5, fontSize:18, fontFace:"Arial", bold:true, color:"ffffff", align:"left", valign:"middle" }); ty += 0.55; }
      if (labels[i]) ctx.slide.addText(truncate(labels[i], 90), { x:cx+0.15, y:ty, w:cW-0.3, h:cH-(ty-y)-0.15, fontSize:11, fontFace:"Arial", color:"ffffff", align:"left", valign:"top" });
    }
  }
}

// ── CONCENTRIC CIRCLES (TAM/SAM/SOM) ──
function renderConcentric(ctx: Ctx, f: Fields) {
  let y = renderHeader(ctx, f);
  const { pptx, slide, c } = ctx;
  const items = f.bodyContent.slice(0, 3);
  const dp = f.dataPoints.slice(0, 3);
  const centerX = ML + CONTENT_W * 0.4;
  const centerY = y + (SLIDE.H - y - SLIDE.MARGIN_B) / 2;
  const radii = [1.35, 0.95, 0.55];
  const fills = [c.ACCENT, c.PRIMARY, c.ACCENT];

  // Draw rings from largest to smallest
  for (let i = 0; i < Math.min(items.length, 3); i++) {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: centerX - radii[i], y: centerY - radii[i],
      w: radii[i] * 2, h: radii[i] * 2,
      fill: { color: fills[i] },
      line: { color: c.PRIMARY, width: 1.5 },
    });
  }
  // Labels on each ring (positioned to not overlap)
  const labelPositions = [
    { x: centerX - 0.5, y: centerY - radii[0] + 0.12, w: 1, fs: 11 },
    { x: centerX - 0.5, y: centerY - 0.15, w: 1, fs: 10 },
    { x: centerX - 0.4, y: centerY + radii[2] - 0.35, w: 0.8, fs: 9 },
  ];
  for (let i = 0; i < Math.min(items.length, 3); i++) {
    if (dp[i]) {
      slide.addText(dp[i], {
        x: labelPositions[i].x, y: labelPositions[i].y, w: labelPositions[i].w, h: 0.3,
        fontSize: labelPositions[i].fs, fontFace: "Arial", bold: true, color: "ffffff",
        align: "center", valign: "middle",
      });
    }
  }
  // Legend on the right
  const legendX = centerX + radii[0] + 0.3;
  for (let i = 0; i < Math.min(items.length, 3); i++) {
    const ly = centerY - 0.9 + i * 0.7;
    const tierLabel = ["TAM", "SAM", "SOM"][i] || "";
    slide.addText(tierLabel + (dp[i] ? ": " + dp[i] : ""), {
      x: legendX, y: ly, w: 2.8, h: 0.28,
      fontSize: 13, fontFace: "Arial", bold: true, color: c.PRIMARY, align: "left",
    });
    slide.addText(truncate(items[i], 55), {
      x: legendX, y: ly + 0.28, w: 2.8, h: 0.3,
      fontSize: 9, fontFace: "Arial", color: c.FG, align: "left",
    });
  }
}

// ── MATRIX (2x2) ──
function renderMatrix(ctx: Ctx, f: Fields) {
  let y = renderHeader(ctx, f);
  const items = f.bodyContent.slice(0, 4);
  if (items.length >= 2) {
    const cols = 2; const rows = Math.ceil(items.length/cols);
    const gap = 0.2; const cellW = (CONTENT_W-gap)/cols; const cellH = (SLIDE.H-y-SLIDE.MARGIN_B-0.1)/rows - gap/2;
    for (let i = 0; i < items.length; i++) {
      const col = i%cols; const row = Math.floor(i/cols);
      const cx = ML + col*(cellW+gap); const cy = y + row*(cellH+gap);
      ctx.slide.addShape(ctx.pptx.ShapeType.rect, { x:cx, y:cy, w:cellW, h:cellH, fill:{color:ctx.c.ACCENT}, rectRadius:0.06 });
      ctx.slide.addShape(ctx.pptx.ShapeType.rect, { x:cx, y:cy, w:0.04, h:cellH, fill:{color:ctx.c.PRIMARY} });
      ctx.slide.addText(truncate(items[i], 120), { x:cx+0.2, y:cy+0.15, w:cellW-0.4, h:cellH-0.3, fontSize:11, fontFace:"Arial", color:"ffffff", align:"left", valign:"top" });
    }
  }
}

// ── TIMELINE ──
function renderTimeline(ctx: Ctx, f: Fields) {
  let y = renderHeader(ctx, f);
  const items = f.bodyContent.slice(0, 5);
  if (items.length >= 2) {
    const n = items.length; const sp = CONTENT_W/n; const r = 0.16;
    ctx.slide.addShape(ctx.pptx.ShapeType.rect, { x:ML+sp/2, y:y+r-0.015, w:CONTENT_W-sp, h:0.03, fill:{color:ctx.c.ACCENT} });
    for (let i = 0; i < n; i++) {
      const cx = ML + sp*i + sp/2;
      ctx.slide.addShape(ctx.pptx.ShapeType.ellipse, { x:cx-r, y, w:r*2, h:r*2, fill:{color:ctx.c.PRIMARY} });
      ctx.slide.addText(String(i+1), { x:cx-r, y, w:r*2, h:r*2, fontSize:11, fontFace:"Arial", bold:true, color:onAccent(ctx.c), align:"center", valign:"middle" });
      ctx.slide.addText(truncate(items[i], 100), { x:cx-sp/2+0.08, y:y+r*2+0.12, w:sp-0.16, h:SLIDE.H-(y+r*2+0.12)-SLIDE.MARGIN_B, fontSize:10, fontFace:"Arial", color:ctx.c.FG, align:"center", valign:"top" });
    }
  }
}

// ── ICON COLUMNS (3-column-with-icons) ──
function renderIconColumns(ctx: Ctx, f: Fields) {
  let y = renderHeader(ctx, f);
  const { pptx, slide, c } = ctx;
  const items = f.bodyContent.slice(0, 3);
  const dp = f.dataPoints;
  const icons = ["\u{1F4CA}", "\u{1F680}", "\u{2705}"]; // 📊 🚀 ✅
  if (items.length >= 2) {
    const n = items.length; const gap = 0.3; const colW = (CONTENT_W - gap*(n-1))/n;
    for (let i = 0; i < n; i++) {
      const cx = ML + i*(colW+gap);
      // Icon circle
      const iconR = 0.25;
      slide.addShape(pptx.ShapeType.ellipse, { x:cx+colW/2-iconR, y, w:iconR*2, h:iconR*2, fill:{color:c.ACCENT} });
      slide.addText(String(i+1), { x:cx+colW/2-iconR, y, w:iconR*2, h:iconR*2, fontSize:14, fontFace:"Arial", bold:true, color:"ffffff", align:"center", valign:"middle" });
      // Stat if exists
      let ty = y + iconR*2 + 0.15;
      if (dp[i]) {
        slide.addText(dp[i], { x:cx, y:ty, w:colW, h:0.35, fontSize:18, fontFace:"Arial", bold:true, color:c.PRIMARY, align:"center", valign:"middle" });
        ty += 0.38;
      }
      // Body text
      slide.addText(truncate(items[i], 90), { x:cx+0.05, y:ty, w:colW-0.1, h:SLIDE.H-ty-SLIDE.MARGIN_B, fontSize:10, fontFace:"Arial", color:c.FG, align:"center", valign:"top" });
    }
  }
}

// ── TEAM GRID ──
function renderTeam(ctx: Ctx, f: Fields) {
  let y = renderHeader(ctx, f);
  const { pptx, slide, c } = ctx;
  const items = f.bodyContent.slice(0, 3);
  if (items.length >= 1) {
    const n = items.length; const gap = 0.25; const cardW = (CONTENT_W - gap*(n-1))/n;
    const cardH = SLIDE.H - y - SLIDE.MARGIN_B - 0.1;
    for (let i = 0; i < n; i++) {
      const cx = ML + i*(cardW+gap);
      slide.addShape(pptx.ShapeType.rect, { x:cx, y, w:cardW, h:cardH, fill:{color:c.ACCENT}, rectRadius:0.06 });
      // Person icon circle
      const pr = 0.22;
      slide.addShape(pptx.ShapeType.ellipse, { x:cx+cardW/2-pr, y:y+0.2, w:pr*2, h:pr*2, fill:{color:c.PRIMARY} });
      // Parse "Role: description" format from body content
      const text = items[i];
      const colonIdx = text.indexOf(":");
      const title = colonIdx > 0 ? text.substring(0, colonIdx).trim() : "";
      const desc = colonIdx > 0 ? text.substring(colonIdx+1).trim() : text;
      if (title) slide.addText(title, { x:cx+0.15, y:y+pr*2+0.35, w:cardW-0.3, h:0.3, fontSize:12, fontFace:"Arial", bold:true, color:"ffffff", align:"center", valign:"top" });
      slide.addText(truncate(desc, 100), { x:cx+0.15, y:y+pr*2+(title?0.7:0.4), w:cardW-0.3, h:cardH-pr*2-1, fontSize:10, fontFace:"Arial", color:"ffffff", align:"center", valign:"top" });
    }
  }
}

// ── STAIRCASE CHART ──
function renderStaircase(ctx: Ctx, f: Fields) {
  let y = renderHeader(ctx, f);
  const { pptx, slide, c } = ctx;
  const items = f.bodyContent.slice(0, 4);
  const dp = f.dataPoints.slice(0, 4);
  if (items.length >= 2) {
    const n = items.length;
    const gap = 0.15;
    const stepW = (CONTENT_W - gap * (n - 1)) / n;
    const maxH = SLIDE.H - y - SLIDE.MARGIN_B - 0.15;
    const baseY = y + maxH;
    for (let i = 0; i < n; i++) {
      const pct = 0.3 + 0.7 * ((i + 1) / n);
      const stepH = maxH * pct;
      const sx = ML + i * (stepW + gap);
      const sy = baseY - stepH;
      slide.addShape(pptx.ShapeType.rect, {
        x: sx, y: sy, w: stepW, h: stepH,
        fill: { color: i === n - 1 ? c.PRIMARY : c.ACCENT }, rectRadius: 0.04,
      });
      if (dp[i]) slide.addText(dp[i], {
        x: sx + 0.08, y: sy + 0.08, w: stepW - 0.16, h: 0.35,
        fontSize: 14, fontFace: "Arial", bold: true, color: "ffffff", align: "center", valign: "middle",
      });
      slide.addText(truncate(items[i], 50), {
        x: sx + 0.08, y: sy + (dp[i] ? 0.45 : 0.12), w: stepW - 0.16, h: 0.7,
        fontSize: 9, fontFace: "Arial", color: "ffffff", align: "center", valign: "top",
      });
    }
  }
}

// ── Dispatcher ──
const R: Record<LayoutType, (ctx: Ctx, f: Fields) => void> = {
  "bullets": renderBullets, "statement": renderStatement, "data-cards": renderDataCards,
  "concentric": renderConcentric, "matrix": renderMatrix, "timeline": renderTimeline,
  "icon-columns": renderIconColumns, "team": renderTeam, "staircase": renderStaircase,
};

// ── Main export ──
export async function exportPptx({ output, isPro, excludedSlides, slideOrder, deckTheme }: ExportOptions) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const title = (output as any).title || "Narrative Deck";
  pptx.author = "Rhetoric"; pptx.title = title; pptx.layout = "LAYOUT_16x9";
  const c = getThemeColors(deckTheme);

  // Title slide
  const ts = pptx.addSlide(); ts.background = { color: c.BG };
  ts.addShape(pptx.ShapeType.rect, { x:0, y:0, w:SLIDE.W, h:0.05, fill:{color:c.ACCENT} });
  ts.addShape(pptx.ShapeType.rect, { x:0, y:SLIDE.H-0.05, w:SLIDE.W, h:0.05, fill:{color:c.ACCENT} });
  ts.addText(title, { x:0.8, y:1.5, w:8.4, h:1.4, fontSize:28, fontFace:"Arial", bold:true, color:c.PRIMARY, align:"center", valign:"middle" });
  ts.addText(output.mode.replace(/_/g," ").toUpperCase(), { x:0.8, y:3.0, w:8.4, fontSize:11, fontFace:"Arial", color:c.MUTED_TEXT, align:"center", charSpacing:5 });
  if (!isPro) ts.addText("Generated by Rhetoric", { x:0.8, y:4.6, w:8.4, fontSize:9, fontFace:"Arial", color:c.MUTED, align:"center" });

  // Content slides
  const d = (output.data || (output as any).supporting || {}) as any;
  const del = (output as any).deliverable || {};
  const fw = d.deckFramework || del.deckFramework || d.boardDeckOutline || del.boardDeckOutline || [];
  const ordered = slideOrder.length > 0 ? slideOrder : fw.map((_:any, i:number) => i);
  const active = ordered.filter((i:number) => !excludedSlides.has(i));

  for (const idx of active) {
    const raw = fw[idx]; if (!raw) continue;
    const f = slideFields(raw);
    const layout = resolveLayout(raw?.layoutRecommendation, raw?.selectedLayout);
    const slide = pptx.addSlide(); slide.background = { color: c.BG };
    const ctx: Ctx = { pptx, slide, c, isPro };
    (R[layout] || renderBullets)(ctx, f);
    if (f.speakerNotes.trim()) slide.addNotes(f.speakerNotes.trim());
    if (!isPro) slide.addText("Generated by Rhetoric", { x:ML, y:SLIDE.H-0.3, w:3, fontSize:7, fontFace:"Arial", color:c.MUTED, align:"left" });
  }
  await pptx.writeFile({ fileName: `${title.replace(/[^a-zA-Z0-9 ]/g,"")}.pptx` });
}