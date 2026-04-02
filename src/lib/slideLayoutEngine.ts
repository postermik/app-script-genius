// slideLayoutEngine.ts
// Single source of truth for slide element positioning.
// All coordinates are in inches matching PPTX 10" x 5.625" (16:9).
// Canvas can convert: x_pct = (x - ML) / CW * 100.

import { CHAR_LIMITS, truncate, type LayoutType } from "@/lib/slideLayouts";

// ── Slide dimensions (inches) ──
export const S = { W: 10, H: 5.625, ML: 0.6, MR: 0.6, MT: 0.3, MB: 0.35 } as const;
export const CW = S.W - S.ML - S.MR;       // 8.8
export const CB = S.H - S.MB;              // 5.275

// ── Font sizing ──
export function headlinePt(text: string): number {
  if (text.length <= 40) return 28;
  if (text.length <= 52) return 24;
  if (text.length <= 72) return 22;
  return 18;
}

export function textH(text: string, pt: number, w: number = CW): number {
  // Characters per inch varies with font size: ~12 at 11pt, ~5.5 at 24pt
  const cpi = 12 * (11 / pt);
  const cpl = Math.max(10, Math.floor(w * cpi));
  const lines = Math.max(1, Math.ceil(text.length / cpl));
  return lines * (pt / 72 * 1.35);
}

// ── Slide data (cleaned by caller) ──
export interface SlideData {
  headline: string;
  subheadline?: string;
  bodyContent?: string[];
  categoryLabel?: string;
  closingStatement?: string;
  cards?: { category: string; stats: { label: string; value: string }[] }[];
  tiers?: { label: string; amount: string; description: string }[];
  flywheelSteps?: { label: string; description: string; leadsTo: string }[];
  milestones?: { amount: string; bullets: string[] }[];
  competitors?: { name: string; description: string; x: number; y: number }[];
  axisLabels?: { x: string; y: string };
  dataPoints?: string[];
}

// ── Element types ──
// Color values: theme keys (head, body, primary, etc.) or hex (#ffffff)
// Special fill format: "primary:0.08" = primary color at 8% opacity
interface TextEl   { t:"text";    x:number; y:number; w:number; h:number; text:string; pt:number; bold?:boolean; color:string; align?:string; valign?:string; upper?:boolean; spacing?:number; }
interface BulletEl { t:"bullets"; x:number; y:number; w:number; h:number; items:string[]; pt:number; color:string; bulletColor:string; lineH?:number; }
interface RectEl   { t:"rect";    x:number; y:number; w:number; h:number; fill?:string; stroke?:string; sw?:number; r?:number; }
interface EllipEl  { t:"ellipse"; cx:number; cy:number; rx:number; ry:number; fill?:string; stroke?:string; sw?:number; }
interface LineEl   { t:"line";    x1:number; y1:number; x2:number; y2:number; color:string; w?:number; }
export type El = TextEl | BulletEl | RectEl | EllipEl | LineEl;

// ── Parse raw slide into clean SlideData ──
export function parseSlide(raw: any): SlideData {
  return {
    headline: truncate(typeof raw === "string" ? raw : (raw?.headline || ""), CHAR_LIMITS.HEADLINE_MAX),
    subheadline: truncate(raw?.subheadline || raw?.subheader || "", CHAR_LIMITS.SUBHEADLINE_MAX),
    bodyContent: (Array.isArray(raw?.bodyContent) ? raw.bodyContent : []).map((b: string) => truncate(b.replace(/^[-\u2022*]\s*/, ""), CHAR_LIMITS.BULLET_MAX)).filter((b: string) => b.length > 0),
    categoryLabel: truncate((raw?.categoryLabel || "").replace(/_/g, " "), CHAR_LIMITS.CATEGORY_MAX),
    closingStatement: truncate(raw?.closingStatement || "", CHAR_LIMITS.CLOSING_MAX),
    dataPoints: raw?.metadata?.dataPoints || [],
    cards: raw?.cards, tiers: raw?.tiers, competitors: raw?.competitors,
    axisLabels: raw?.axisLabels, flywheelSteps: raw?.flywheelSteps, milestones: raw?.milestones,
  };
}

// ── Shared header (category + headline) ──
function hdr(s: SlideData): { els: El[]; y: number } {
  const els: El[] = [];
  let y = S.MT;
  if (s.categoryLabel) {
    els.push({ t:"text", x:S.ML, y, w:CW, h:0.25, text:s.categoryLabel.toUpperCase(), pt:10, bold:true, color:"cat", spacing:3, upper:true });
    y += 0.26;
  }
  const pt = headlinePt(s.headline);
  const hh = Math.max(textH(s.headline, pt), 0.38);
  els.push({ t:"text", x:S.ML, y, w:CW, h:hh+0.12, text:s.headline, pt, bold:true, color:"head" });
  y += hh + 0.18;
  return { els, y };
}

function addSub(els: El[], s: SlideData, y: number): number {
  if (!s.subheadline) return y;
  const h = Math.max(textH(s.subheadline, 12), 0.25);
  els.push({ t:"text", x:S.ML, y, w:CW, h:h+0.05, text:s.subheadline, pt:12, color:"sub" });
  return y + h + 0.08;
}

function addClose(els: El[], s: SlideData) {
  if (s.closingStatement) els.push({ t:"text", x:S.ML, y:CB-0.28, w:CW, h:0.25, text:s.closingStatement, pt:11, bold:true, color:"close", valign:"bottom" });
}

// Available height after header, accounting for closing
function avail(y: number, hasClose: boolean): number { return CB - y - (hasClose ? 0.35 : 0); }

// ════════════════════════════════════════
// LAYOUT FUNCTIONS
// ════════════════════════════════════════

// ── BULLETS ──
function layoutBullets(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  let y = addSub(els, s, hy);
  const bc = s.bodyContent || [];
  if (bc.length > 0) {
    const pt = bc.length > 4 ? 10 : 11;
    els.push({ t:"bullets", x:S.ML, y, w:CW, h:avail(y, !!s.closingStatement), items:bc.slice(0,6), pt, color:"body", bulletColor:"primary", lineH:1.5 });
  }
  addClose(els, s);
  return els;
}

// ── BULLETS-TWO-COLUMN ──
function layoutBulletsTwoCol(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  let y = addSub(els, s, hy);
  const bc = (s.bodyContent || []).slice(0,6);
  const mid = Math.ceil(bc.length / 2);
  const colW = (CW - 0.3) / 2;
  const h = avail(y, !!s.closingStatement);
  els.push({ t:"bullets", x:S.ML,              y, w:colW, h, items:bc.slice(0, mid), pt:10, color:"body", bulletColor:"primary", lineH:1.5 });
  els.push({ t:"bullets", x:S.ML + colW + 0.3, y, w:colW, h, items:bc.slice(mid),   pt:10, color:"body", bulletColor:"primary", lineH:1.5 });
  addClose(els, s);
  return els;
}

// ── BULLETS-ACCENT ──
function layoutBulletsAccent(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  let y = addSub(els, s, hy);
  els.push({ t:"rect", x:S.ML, y:y-0.05, w:0.04, h:CB-y, fill:"primary" });
  const bc = s.bodyContent || [];
  if (bc.length > 0) {
    const pt = bc.length > 4 ? 10 : 11;
    els.push({ t:"bullets", x:S.ML+0.2, y, w:CW-0.2, h:avail(y, !!s.closingStatement), items:bc.slice(0,6), pt, color:"body", bulletColor:"primary", lineH:1.5 });
  }
  addClose(els, s);
  return els;
}

// ── BULLETS-NUMBERED ──
function layoutBulletsNumbered(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  let y = addSub(els, s, hy);
  const bc = (s.bodyContent || []).slice(0,6);
  const pt = bc.length > 4 ? 10 : 11;
  for (let i = 0; i < bc.length; i++) {
    els.push({ t:"text", x:S.ML, y, w:0.25, h:0.25, text:String(i+1), pt, bold:true, color:"primary", align:"center", valign:"middle" });
    els.push({ t:"text", x:S.ML+0.3, y, w:CW-0.3, h:0.25, text:bc[i], pt, color:"body", valign:"middle" });
    y += 0.32;
  }
  addClose(els, s);
  return els;
}

// ── STATEMENT ──
function layoutStatement(s: SlideData): El[] {
  const els: El[] = [];
  els.push({ t:"rect", x:0, y:0, w:S.W, h:0.05, fill:"primary" });
  if (s.categoryLabel) els.push({ t:"text", x:S.ML, y:0.65, w:CW, h:0.25, text:s.categoryLabel.toUpperCase(), pt:11, bold:true, color:"cat", spacing:4, upper:true });
  const pt = s.headline.length > 50 ? 18 : 20;
  els.push({ t:"text", x:S.ML, y:s.categoryLabel?1.0:1.2, w:CW, h:1.6, text:s.headline, pt, bold:true, color:"head", valign:"middle" });
  if (s.subheadline) els.push({ t:"text", x:S.ML, y:3.0, w:CW*0.75, h:0.45, text:s.subheadline, pt:13, color:"sub" });
  if (s.closingStatement) {
    els.push({ t:"rect", x:0, y:S.H-0.7, w:S.W, h:0.7, fill:"accent" });
    els.push({ t:"rect", x:0, y:S.H-0.7, w:S.W, h:0.03, fill:"primary" });
    els.push({ t:"text", x:S.ML, y:S.H-0.65, w:CW, h:0.5, text:s.closingStatement, pt:12, bold:true, color:"head", valign:"middle" });
  }
  return els;
}

// ── DATA-CARDS ──
function layoutDataCards(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  let y = addSub(els, s, hy);
  const aH = avail(y, !!s.closingStatement);
  const cards = s.cards;

  if (cards && cards.length > 0) {
    const n = cards.length; const gap = 0.2; const cardW = (CW - gap*(n-1)) / n;
    for (let i = 0; i < n; i++) {
      const cx = S.ML + i*(cardW+gap); const card = cards[i];
      els.push({ t:"rect", x:cx, y, w:cardW, h:aH, stroke:"border", sw:1, r:0.04 });
      els.push({ t:"rect", x:cx, y, w:cardW, h:0.04, fill:"primary" });
      let ty = y + 0.15;
      els.push({ t:"text", x:cx+0.1, y:ty, w:cardW-0.2, h:0.25, text:card.category, pt:10, bold:true, color:"primary" });
      els.push({ t:"line", x1:cx+0.1, y1:ty+0.28, x2:cx+cardW-0.1, y2:ty+0.28, color:"border" });
      ty += 0.38;
      const statArea = aH - 0.55; const gap2 = Math.min(0.55, statArea / Math.max(card.stats.length, 1));
      for (const stat of card.stats) {
        els.push({ t:"text", x:cx+0.1, y:ty, w:cardW-0.2, h:0.18, text:stat.label, pt:9, color:"sub" });
        els.push({ t:"text", x:cx+0.1, y:ty+0.16, w:cardW-0.2, h:0.3, text:stat.value, pt:16, bold:true, color:"head" });
        ty += gap2;
      }
    }
  } else {
    const dp = s.dataPoints || []; const items = (s.bodyContent || []).slice(0,6);
    const n = Math.max(dp.length, Math.min(items.length, 6));
    if (n > 0) {
      const gap = n > 3 ? 0.12 : 0.2; const cardW = (CW - gap*(n-1)) / n;
      const headPt = n > 3 ? 14 : 18; const bodyPt = n > 4 ? 8 : 10;
      for (let i = 0; i < n; i++) {
        const cx = S.ML + i*(cardW+gap);
        els.push({ t:"rect", x:cx, y, w:cardW, h:aH, stroke:"border", sw:1, r:0.04 });
        els.push({ t:"rect", x:cx, y, w:cardW, h:0.04, fill:"primary" });
        let ty = y + 0.15;
        if (dp[i]) { els.push({ t:"text", x:cx+0.1, y:ty, w:cardW-0.2, h:0.35, text:dp[i], pt:headPt, bold:true, color:"head", valign:"middle" }); ty += 0.4; }
        if (items[i]) els.push({ t:"text", x:cx+0.1, y:ty, w:cardW-0.2, h:aH-(ty-y)-0.1, text:items[i], pt:bodyPt, color:"body" });
      }
    }
  }
  addClose(els, s);
  return els;
}

// ── CONCENTRIC ──
function layoutConcentric(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  const tiers = s.tiers || [];
  const items = tiers.length > 0 ? tiers.map(t => t.description) : (s.bodyContent || []).slice(0,3);
  const dp    = tiers.length > 0 ? tiers.map(t => t.amount)      : (s.dataPoints || []);
  const labels= tiers.length > 0 ? tiers.map(t => t.label)       : ["TAM","SAM","SOM"];

  const aH = CB - hy;
  const circX = S.ML + CW * 0.35;
  const baseY = CB;
  const radii = [aH*0.46, aH*0.32, aH*0.17];

  // Concentric circles (bottom-aligned)
  for (let i = 0; i < Math.min(items.length, 3); i++) {
    const r = radii[i]; const cy = baseY - r;
    els.push({ t:"ellipse", cx:circX, cy, rx:r, ry:r, stroke:"primary", sw:1 });
  }

  // Amount + tier labels inside circles
  const tops = radii.map(r => baseY - r*2); tops.push(baseY);
  for (let i = 0; i < Math.min(dp.length, 3); i++) {
    const mid = (tops[i] + tops[i+1]) / 2;
    els.push({ t:"text", x:circX-0.6, y:mid-0.15, w:1.2, h:0.3, text:dp[i], pt:i===0?16:i===1?14:12, bold:true, color:"head", align:"center", valign:"middle" });
    els.push({ t:"text", x:circX-0.4, y:mid+0.12, w:0.8, h:0.2, text:labels[i], pt:9, color:"cat", align:"center" });
  }

  // Legend (right side) - all connectors start from outermost circle edge for clean alignment
  const connectorX = circX + radii[0] + 0.15; // just outside the largest circle
  const legX = connectorX + 0.3;
  const legW = S.W - S.MR - legX;
  for (let i = 0; i < Math.min(items.length, 3); i++) {
    const mid = (tops[i] + tops[i+1]) / 2;
    els.push({ t:"ellipse", cx:connectorX, cy:mid, rx:0.04, ry:0.04, fill:"primary" });
    els.push({ t:"line", x1:connectorX+0.04, y1:mid, x2:legX-0.05, y2:mid, color:"primary" });
    els.push({ t:"text", x:legX, y:mid-0.25, w:legW, h:0.2, text:labels[i], pt:10, bold:true, color:"cat", valign:"bottom" });
    els.push({ t:"text", x:legX, y:mid-0.05, w:legW, h:0.3, text:items[i], pt:9, color:"body" });
  }
  return els;
}

// ── MATRIX ──
function layoutMatrix(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  const axes = s.axisLabels || { x:"Speed + Affordability", y:"Quality" };
  const aX = S.ML + 0.8; const aY = hy + 0.1;
  const aW = CW - 1.0;   const aH = CB - hy - 0.4;

  // Axes
  els.push({ t:"rect", x:aX, y:aY, w:0.015, h:aH, fill:"border" });
  els.push({ t:"rect", x:aX, y:aY+aH, w:aW, h:0.015, fill:"border" });
  els.push({ t:"text", x:S.ML-0.1, y:aY+aH/2-0.3, w:0.8, h:0.6, text:axes.y, pt:7, color:"sub", align:"center", valign:"middle" });
  els.push({ t:"text", x:aX+aW/2-0.7, y:aY+aH+0.03, w:1.4, h:0.25, text:axes.x, pt:7, color:"sub", align:"center" });

  if (s.competitors && s.competitors.length > 0) {
    for (let i = 0; i < s.competitors.length; i++) {
      const c = s.competitors[i]; const last = i === s.competitors.length - 1;
      const px = aX + c.x * aW; const py = aY + (1 - c.y) * aH;
      const dr = last ? 0.1 : 0.06;
      // Dot first, then name and description below it with clear gap
      els.push({ t:"ellipse", cx:px, cy:py, rx:dr, ry:dr, fill:last?"primary":"sub" });
      els.push({ t:"text", x:px-0.9, y:py+dr+0.04, w:1.8, h:0.2, text:c.name, pt:last?10:9, bold:last, color:last?"head":"body", align:"center" });
      if (c.description) els.push({ t:"text", x:px-0.9, y:py+dr+0.22, w:1.8, h:0.25, text:c.description, pt:7, color:"sub", align:"center" });
    }
  } else {
    const items = (s.bodyContent || []).slice(0,6);
    for (let i = 0; i < items.length; i++) {
      const ci = items[i].indexOf(":"); const name = ci > 0 ? items[i].substring(0,ci).trim() : items[i];
      const last = i === items.length - 1;
      const px = aX + ((i*0.15+0.2)%0.8)*aW; const py = aY + (0.2+i*0.12)*aH;
      els.push({ t:"ellipse", cx:px, cy:py, rx:0.06, ry:0.06, fill:last?"primary":"sub" });
      els.push({ t:"text", x:px-0.5, y:py+0.1, w:1, h:0.2, text:name, pt:9, color:"body", align:"center" });
    }
  }
  return els;
}

// ── FLYWHEEL ──
function layoutFlywheel(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  const steps = s.flywheelSteps || [];
  const body  = s.bodyContent || [];
  const useStruct = steps.length >= 3;
  const n = useStruct ? steps.length : body.length;
  if (n < 3) return layoutBullets(s);

  const aH = CB - hy - 0.1;
  const cxF = S.ML + CW / 2; const cyF = hy + aH / 2;
  const r = Math.min(aH * 0.4, CW * 0.14);
  const angles = n===3 ? [-90,30,150] : n===4 ? [-90,0,90,180] : n===5 ? [-90,-18,54,126,198] : [-90,-30,30,90,150,210];

  // Draw the wheel circle (outline)
  els.push({ t:"ellipse", cx:cxF, cy:cyF, rx:r, ry:r, stroke:"accent", sw:2 });

  for (let i = 0; i < n; i++) {
    const aDeg = angles[i];
    const a = aDeg * Math.PI / 180;
    const nx = cxF + r*Math.cos(a); const ny = cyF + r*Math.sin(a);
    // Node circle on the wheel
    els.push({ t:"ellipse", cx:nx, cy:ny, rx:0.16, ry:0.16, fill:"primary" });
    els.push({ t:"text", x:nx-0.16, y:ny-0.16, w:0.32, h:0.32, text:String(i+1), pt:12, bold:true, color:"#ffffff", align:"center", valign:"middle" });

    // Label outside: determine alignment based on angle so text extends AWAY from circle
    const isRight = aDeg > -90 && aDeg < 90;
    const isLeft = aDeg > 90 || aDeg < -90;
    const isTop = aDeg === -90;
    const isBottom = aDeg === 180 || aDeg === -180;
    const labelAlign = isTop || isBottom ? "center" : isRight ? "left" : "right";

    // Push labels further from center
    const tx = cxF + (r + 1.0) * Math.cos(a);
    const ty = cyF + (r + 0.6) * Math.sin(a);
    // Position text box: for left-aligned, start at the node side; for right-aligned, end at the node side
    const lw = 2.2;
    const lx = labelAlign === "center" ? tx - lw/2 : labelAlign === "left" ? tx - 0.3 : tx - lw + 0.3;

    const getLabel = () => {
      if (useStruct) return steps[i].label;
      const ci = body[i].indexOf(":");
      return ci > 0 ? body[i].substring(0,ci).trim() : body[i].substring(0,30);
    };
    const getDesc = () => useStruct ? steps[i].description : "";

    els.push({ t:"text", x:lx, y:ty-0.2, w:lw, h:0.25, text:getLabel(), pt:10, bold:true, color:"head", align:labelAlign, valign:"middle" });
    const desc = getDesc();
    if (desc) els.push({ t:"text", x:lx, y:ty+0.05, w:lw, h:0.5, text:desc, pt:8, color:"sub", align:labelAlign });
  }
  return els;
}

// ── STAIRCASE ──
function layoutStaircase(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  const ms = s.milestones || (s.bodyContent || []).slice(0,6).map((t, i) => ({
    amount: (s.dataPoints || [])[i] || "",
    bullets: t.split(/[,;]/).map(b => b.trim()).filter(Boolean).slice(0,3),
  }));
  const n = ms.length; const gap = 0.12;
  const stepW = (CW - gap*(n-1)) / n;
  const maxH = CB - hy - 0.15; const baseY = CB;
  const pcts = n <= 4 ? [0.35, 0.55, 0.75, 0.92] : n === 5 ? [0.25, 0.40, 0.55, 0.72, 0.92] : [0.2, 0.33, 0.46, 0.59, 0.75, 0.92];

  for (let i = 0; i < n; i++) {
    const h = maxH * (pcts[i] || 0.92);
    const sx = S.ML + i*(stepW+gap); const sy = baseY - h;
    const last = i === n - 1;
    els.push({ t:"rect", x:sx, y:sy, w:stepW, h, fill:last?"primary:0.08":undefined, stroke:last?"primary":"border", sw:last?1.5:1, r:0.03 });
    if (ms[i].amount) els.push({ t:"text", x:sx+0.05, y:sy+0.08, w:stepW-0.1, h:0.25, text:ms[i].amount, pt:14, bold:true, color:last?"primary":"head", align:"center" });
    const bY = sy + (ms[i].amount ? 0.38 : 0.1);
    const bH = h - (ms[i].amount ? 0.45 : 0.15); // fill to near bottom of bar
    els.push({ t:"bullets", x:sx+0.06, y:bY, w:stepW-0.12, h:Math.max(0.2, bH), items:ms[i].bullets.slice(0,3), pt:8, color:"sub", bulletColor:"primary", lineH:1.3 });
  }
  return els;
}

// ── ICON COLUMNS ──
function layoutIconCols(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  const items = (s.bodyContent || []).slice(0,6); const dp = s.dataPoints || [];
  if (items.length < 1) return layoutBullets(s);
  const n = items.length; const gap = n > 3 ? 0.12 : 0.2;
  const colW = (CW - gap*(n-1)) / n; const colH = CB - hy;
  const ir = n > 3 ? 0.15 : 0.2;
  const bodyPt = n > 4 ? 8 : n > 3 ? 9 : 10;
  const headPt = n > 3 ? 11 : 14;

  for (let i = 0; i < n; i++) {
    const cx = S.ML + i*(colW+gap);
    els.push({ t:"rect", x:cx, y:hy, w:colW, h:colH, stroke:"border", sw:1, r:0.04 });
    els.push({ t:"ellipse", cx:cx+colW/2, cy:hy+colH*0.15+ir, rx:ir, ry:ir, stroke:"primary", sw:1.5 });
    els.push({ t:"text", x:cx+colW/2-ir, y:hy+colH*0.15, w:ir*2, h:ir*2, text:String(i+1), pt:n>3?10:12, bold:true, color:"primary", align:"center", valign:"middle" });
    let ty = hy + colH*0.15 + ir*2 + 0.1;
    if (dp[i]) { els.push({ t:"text", x:cx+0.1, y:ty, w:colW-0.2, h:0.25, text:dp[i], pt:headPt, bold:true, color:"head", align:"center" }); ty += 0.3; }
    els.push({ t:"text", x:cx+0.08, y:ty, w:colW-0.16, h:colH-(ty-hy)-0.08, text:items[i], pt:bodyPt, color:"body", align:"center" });
  }
  return els;
}

// ── TEAM ──
function layoutTeam(s: SlideData): El[] {
  const { els, y: hy } = hdr(s);
  const items = (s.bodyContent || []).slice(0,6);
  const n = items.length; const gap = 0.2;
  const colW = (CW - gap*(n-1)) / n; const colH = CB - hy;

  for (let i = 0; i < n; i++) {
    const cx = S.ML + i*(colW+gap);
    els.push({ t:"rect", x:cx, y:hy, w:colW, h:colH, stroke:"border", sw:1, r:0.04 });
    const pr = 0.2;
    els.push({ t:"ellipse", cx:cx+colW/2, cy:hy+colH*0.12+pr, rx:pr, ry:pr, stroke:"primary", sw:1.5 });
    const ci = items[i].indexOf(":"); const title = ci > 0 ? items[i].substring(0,ci).trim() : ""; const desc = ci > 0 ? items[i].substring(ci+1).trim() : items[i];
    let ty = hy + colH*0.12 + pr*2 + 0.1;
    if (title) { els.push({ t:"text", x:cx+0.08, y:ty, w:colW-0.16, h:0.25, text:title, pt:12, bold:true, color:"head", align:"center" }); ty += 0.3; }
    els.push({ t:"text", x:cx+0.08, y:ty, w:colW-0.16, h:colH-(ty-hy)-0.08, text:desc, pt:10, color:"body", align:"center" });
  }
  return els;
}

// ── DISPATCHER ──
const FNS: Record<string, (s: SlideData) => El[]> = {
  "bullets": layoutBullets, "bullets-two-column": layoutBulletsTwoCol,
  "bullets-accent": layoutBulletsAccent, "bullets-numbered": layoutBulletsNumbered,
  "statement": layoutStatement, "data-cards": layoutDataCards,
  "concentric": layoutConcentric, "matrix": layoutMatrix,
  "flywheel": layoutFlywheel, "staircase": layoutStaircase,
  "icon-columns": layoutIconCols, "team": layoutTeam,
};

export function computeLayout(s: SlideData, layout: string): El[] {
  return (FNS[layout] || layoutBullets)(s);
}