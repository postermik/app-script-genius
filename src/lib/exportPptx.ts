import type { NarrativeOutputData } from "@/types/narrative";
import type { DeckTheme } from "@/components/SlidePreview";
import { SLIDE, CONTENT_W, CHAR_LIMITS, getHeadlineFontSize, estimateHeight, truncate, resolveLayout, type LayoutType } from "@/lib/slideLayouts";

interface ExportOptions { output: NarrativeOutputData; isPro: boolean; excludedSlides: Set<number>; slideOrder: number[]; deckTheme: DeckTheme; }
interface TC { BG:string; FG:string; PRIMARY:string; MUTED:string; MUTED_TEXT:string; ACCENT:string; }

function getThemeColors(theme: DeckTheme): TC {
  const strip = (h:string) => h.replace("#","");
  if (theme.scheme==="light") return {BG:"ffffff",FG:"1a1a2e",PRIMARY:"3b82f6",MUTED:"6b7280",MUTED_TEXT:"9ca3af",ACCENT:"3b82f6"};
  if (theme.scheme==="custom") {
    const bg=theme.secondary||"#0b0f14"; const b=parseInt(bg.replace("#",""),16);
    return {BG:strip(bg),FG:b>0x888888?"1a1a2e":"dce0e8",PRIMARY:strip(theme.primary||"#3b82f6"),MUTED:"6b7280",MUTED_TEXT:"9ca3af",ACCENT:strip(theme.accent||"#1e3a5f")};
  }
  return {BG:"0b0f14",FG:"dce0e8",PRIMARY:"3b82f6",MUTED:"6b7280",MUTED_TEXT:"9ca3af",ACCENT:"3b82f6"};
}

function slideFields(raw: any) {
  const headline = truncate(typeof raw==="string"?raw:(raw?.headline||""), CHAR_LIMITS.HEADLINE_MAX);
  const subheadline = truncate(raw?.subheadline||raw?.subheader||"", CHAR_LIMITS.SUBHEADLINE_MAX);
  // No double truncation: slideFields truncates once, renderers use as-is
  const bodyContent:string[] = (Array.isArray(raw?.bodyContent)?raw.bodyContent:[]).map((b:string)=>truncate(b.replace(/^[-\u2022*]\s*/,""), CHAR_LIMITS.BULLET_MAX));
  const categoryLabel = truncate(raw?.categoryLabel||"", CHAR_LIMITS.CATEGORY_MAX);
  const closingStatement = truncate(raw?.closingStatement||"", CHAR_LIMITS.CLOSING_MAX);
  const speakerNotes = raw?.speakerNotes||"";
  const dataPoints:string[] = raw?.metadata?.dataPoints||[];
  return {headline,subheadline,bodyContent,categoryLabel,closingStatement,speakerNotes,dataPoints};
}

type Ctx = {pptx:any; slide:any; c:TC; isPro:boolean;};
type F = ReturnType<typeof slideFields>;
const ML = SLIDE.MARGIN_L;

// Shared header: category + headline, returns cursorY
function header(ctx:Ctx, f:F): number {
  let y = 0.35;
  if (f.categoryLabel) {
    ctx.slide.addText(f.categoryLabel.toUpperCase(), {x:ML,y,w:CONTENT_W,h:0.25,fontSize:10,fontFace:"Arial",bold:true,color:ctx.c.ACCENT,align:"left",valign:"top",charSpacing:3});
    y += 0.28;
  }
  const sz = getHeadlineFontSize(f.headline);
  const hH = Math.max(estimateHeight(f.headline, sz), 0.4);
  ctx.slide.addText(f.headline, {x:ML,y,w:CONTENT_W,h:hH+0.1,fontSize:sz,fontFace:"Arial",bold:true,color:ctx.c.PRIMARY,align:"left",valign:"top"});
  return y + hH + 0.15;
}

// ── BULLETS ──
function bullets(ctx:Ctx, f:F) {
  let y = header(ctx, f);
  if (f.subheadline) {
    const h = Math.max(estimateHeight(f.subheadline,14),0.3);
    ctx.slide.addText(f.subheadline, {x:ML,y,w:CONTENT_W,h:h+0.1,fontSize:14,fontFace:"Arial",color:ctx.c.MUTED_TEXT,align:"left",valign:"top"});
    y += h + 0.1;
  }
  if (f.bodyContent.length>0) {
    const bSz = f.bodyContent.length>4?11:12;
    const rows = f.bodyContent.slice(0,6).map(t=>({text:t,options:{fontSize:bSz,fontFace:"Arial",color:ctx.c.FG,bullet:{code:"2022",color:ctx.c.ACCENT},lineSpacingMultiple:1.4,paraSpaceAfter:4}}));
    ctx.slide.addText(rows as any, {x:ML,y,w:CONTENT_W,h:SLIDE.H-y-SLIDE.MARGIN_B-(f.closingStatement?0.4:0),valign:"top"});
  }
  if (f.closingStatement) ctx.slide.addText(f.closingStatement, {x:ML,y:SLIDE.H-SLIDE.MARGIN_B-0.35,w:CONTENT_W,h:0.3,fontSize:11,fontFace:"Arial",bold:true,color:ctx.c.ACCENT,align:"left",valign:"bottom"});
}

// ── STATEMENT ──
function statement(ctx:Ctx, f:F) {
  const {pptx,slide,c} = ctx;
  slide.addShape(pptx.ShapeType.rect, {x:0,y:0,w:SLIDE.W,h:0.05,fill:{color:c.ACCENT}});
  if (f.categoryLabel) slide.addText(f.categoryLabel.toUpperCase(), {x:ML,y:0.7,w:CONTENT_W,h:0.25,fontSize:11,fontFace:"Arial",bold:true,color:c.ACCENT,align:"left",charSpacing:4});
  const sz = f.headline.length>50?20:22;
  slide.addText(f.headline, {x:ML,y:f.categoryLabel?1.1:1.3,w:CONTENT_W,h:1.8,fontSize:sz,fontFace:"Arial",bold:true,color:c.PRIMARY,align:"left",valign:"middle"});
  if (f.subheadline) slide.addText(f.subheadline, {x:ML,y:3.2,w:CONTENT_W*0.75,h:0.5,fontSize:14,fontFace:"Arial",color:c.MUTED_TEXT,align:"left",valign:"top"});
  if (f.closingStatement) {
    slide.addShape(pptx.ShapeType.rect, {x:0,y:SLIDE.H-0.8,w:SLIDE.W,h:0.8,fill:{color:c.ACCENT}});
    slide.addText(f.closingStatement, {x:ML,y:SLIDE.H-0.75,w:CONTENT_W,h:0.6,fontSize:13,fontFace:"Arial",bold:true,color:"ffffff",align:"left",valign:"middle"});
  }
}

// ── DATA-CARDS ──
function dataCards(ctx:Ctx, f:F) {
  let y = header(ctx, f);
  const dp = f.dataPoints; const items = f.bodyContent.slice(0,3);
  const n = Math.max(dp.length, Math.min(items.length,3));
  if (n>0) {
    const gap=0.25; const cW=(CONTENT_W-gap*(n-1))/n; const cH=SLIDE.H-y-SLIDE.MARGIN_B-0.05;
    for (let i=0;i<n;i++) {
      const cx=ML+i*(cW+gap);
      ctx.slide.addShape(ctx.pptx.ShapeType.rect, {x:cx,y,w:cW,h:cH,fill:{color:ctx.c.ACCENT},rectRadius:0.06});
      ctx.slide.addShape(ctx.pptx.ShapeType.rect, {x:cx,y,w:cW,h:0.04,fill:{color:ctx.c.PRIMARY}});
      let ty=y+0.15;
      if (dp[i]) {ctx.slide.addText(dp[i],{x:cx+0.12,y:ty,w:cW-0.24,h:0.4,fontSize:18,fontFace:"Arial",bold:true,color:"ffffff",align:"left",valign:"middle"});ty+=0.45;}
      if (items[i]) ctx.slide.addText(items[i],{x:cx+0.12,y:ty,w:cW-0.24,h:cH-(ty-y)-0.1,fontSize:10,fontFace:"Arial",color:"ffffff",align:"left",valign:"top"});
    }
  }
}

// ── CONCENTRIC CIRCLES ──
function concentric(ctx:Ctx, f:F) {
  let y = header(ctx, f);
  const {pptx,slide,c} = ctx;
  const items = f.bodyContent.slice(0,3); const dp = f.dataPoints.slice(0,3);
  // Available area
  const areaH = SLIDE.H - y - SLIDE.MARGIN_B;
  const centerX = ML + CONTENT_W * 0.38;
  const centerY = y + areaH / 2;
  const outerR = Math.min(areaH/2 - 0.1, 1.4);
  const radii = [outerR, outerR*0.65, outerR*0.35];
  // Draw 3 rings: outer filled with ACCENT, middle with slightly lighter shade, inner with PRIMARY
  // Use separate filled circles layered, each smaller, with different colors for visual separation
  const ringColors = [c.ACCENT, c.PRIMARY, c.ACCENT];
  for (let i=0; i<Math.min(items.length,3); i++) {
    const r = radii[i];
    slide.addShape(pptx.ShapeType.ellipse, {
      x:centerX-r, y:centerY-r, w:r*2, h:r*2,
      fill:{color:ringColors[i]}, line:{color:c.PRIMARY,width:2},
    });
  }
  // Place labels at the TOP of each ring so they don't overlap
  const labelYs = [centerY - outerR + 0.15, centerY - radii[1]*0.3, centerY + radii[2]*0.1];
  for (let i=0; i<Math.min(dp.length,3); i++) {
    slide.addText(dp[i], {
      x:centerX-0.6, y:labelYs[i], w:1.2, h:0.3,
      fontSize:11, fontFace:"Arial", bold:true, color:"ffffff", align:"center", valign:"middle",
    });
  }
  // Legend on right
  const legendX = centerX + outerR + 0.35;
  const legendW = SLIDE.W - SLIDE.MARGIN_R - legendX;
  const tiers = ["TAM","SAM","SOM"];
  for (let i=0; i<Math.min(items.length,3); i++) {
    const ly = centerY - 0.9 + i*0.65;
    slide.addText(tiers[i]+(dp[i]?": "+dp[i]:""), {x:legendX,y:ly,w:legendW,h:0.25,fontSize:12,fontFace:"Arial",bold:true,color:c.PRIMARY,align:"left"});
    slide.addText(items[i], {x:legendX,y:ly+0.25,w:legendW,h:0.35,fontSize:9,fontFace:"Arial",color:c.FG,align:"left",valign:"top"});
  }
}

// ── MATRIX ──
function matrix(ctx:Ctx, f:F) {
  let y = header(ctx, f);
  const items = f.bodyContent.slice(0,4);
  if (items.length>=2) {
    const cols=2; const rows=Math.ceil(items.length/cols);
    const gap=0.2; const cellW=(CONTENT_W-gap)/cols; const cellH=(SLIDE.H-y-SLIDE.MARGIN_B-0.05)/rows-gap/2;
    for (let i=0;i<items.length;i++) {
      const col=i%cols; const row=Math.floor(i/cols);
      const cx=ML+col*(cellW+gap); const cy=y+row*(cellH+gap);
      ctx.slide.addShape(ctx.pptx.ShapeType.rect, {x:cx,y:cy,w:cellW,h:cellH,fill:{color:ctx.c.ACCENT},rectRadius:0.06});
      ctx.slide.addShape(ctx.pptx.ShapeType.rect, {x:cx,y:cy,w:0.04,h:cellH,fill:{color:ctx.c.PRIMARY}});
      ctx.slide.addText(items[i], {x:cx+0.18,y:cy+0.12,w:cellW-0.35,h:cellH-0.24,fontSize:11,fontFace:"Arial",color:"ffffff",align:"left",valign:"top"});
    }
  }
}

// ── TIMELINE ──
function timeline(ctx:Ctx, f:F) {
  let y = header(ctx, f);
  const items = f.bodyContent.slice(0,5);
  if (items.length>=2) {
    const n=items.length; const sp=CONTENT_W/n; const r=0.18;
    // Center the timeline vertically in available space
    const areaH = SLIDE.H - y - SLIDE.MARGIN_B;
    const nodeY = y + areaH * 0.15;
    ctx.slide.addShape(ctx.pptx.ShapeType.rect, {x:ML+sp/2,y:nodeY+r-0.015,w:CONTENT_W-sp,h:0.03,fill:{color:ctx.c.ACCENT}});
    for (let i=0;i<n;i++) {
      const cx=ML+sp*i+sp/2;
      ctx.slide.addShape(ctx.pptx.ShapeType.ellipse, {x:cx-r,y:nodeY,w:r*2,h:r*2,fill:{color:ctx.c.PRIMARY}});
      ctx.slide.addText(String(i+1), {x:cx-r,y:nodeY,w:r*2,h:r*2,fontSize:12,fontFace:"Arial",bold:true,color:"ffffff",align:"center",valign:"middle"});
      // Full text, no truncation, generous height
      ctx.slide.addText(items[i], {x:cx-sp/2+0.05,y:nodeY+r*2+0.15,w:sp-0.1,h:areaH*0.7,fontSize:10,fontFace:"Arial",color:ctx.c.FG,align:"center",valign:"top"});
    }
  }
}

// ── ICON COLUMNS ── full-height cards with icon circle at top
function iconColumns(ctx:Ctx, f:F) {
  let y = header(ctx, f);
  const {pptx,slide,c} = ctx;
  const items = f.bodyContent.slice(0,3); const dp = f.dataPoints;
  if (items.length>=2) {
    const n=items.length; const gap=0.25; const colW=(CONTENT_W-gap*(n-1))/n;
    const cardH = SLIDE.H - y - SLIDE.MARGIN_B - 0.05;
    for (let i=0;i<n;i++) {
      const cx=ML+i*(colW+gap);
      // Full-height card background
      slide.addShape(pptx.ShapeType.rect, {x:cx,y,w:colW,h:cardH,fill:{color:c.ACCENT},rectRadius:0.06});
      // Icon circle at top of card
      const iconR=0.22;
      slide.addShape(pptx.ShapeType.ellipse, {x:cx+colW/2-iconR,y:y+0.2,w:iconR*2,h:iconR*2,fill:{color:c.PRIMARY}});
      slide.addText(String(i+1), {x:cx+colW/2-iconR,y:y+0.2,w:iconR*2,h:iconR*2,fontSize:14,fontFace:"Arial",bold:true,color:"ffffff",align:"center",valign:"middle"});
      // Stat inside card
      let ty = y + 0.2 + iconR*2 + 0.15;
      if (dp[i]) {
        slide.addText(dp[i], {x:cx+0.1,y:ty,w:colW-0.2,h:0.3,fontSize:16,fontFace:"Arial",bold:true,color:"ffffff",align:"center",valign:"middle"});
        ty += 0.35;
      }
      // Body text fills remaining card space
      slide.addText(items[i], {x:cx+0.1,y:ty,w:colW-0.2,h:cardH-(ty-y)-0.1,fontSize:10,fontFace:"Arial",color:"ffffff",align:"center",valign:"top"});
    }
  }
}

// ── TEAM GRID ── name/role cards, no giant stats
function team(ctx:Ctx, f:F) {
  let y = header(ctx, f);
  const {pptx,slide,c} = ctx;
  const items = f.bodyContent.slice(0,3);
  if (items.length>=1) {
    const n=items.length; const gap=0.25; const cardW=(CONTENT_W-gap*(n-1))/n;
    const cardH = SLIDE.H - y - SLIDE.MARGIN_B - 0.05;
    for (let i=0;i<n;i++) {
      const cx=ML+i*(cardW+gap);
      slide.addShape(pptx.ShapeType.rect, {x:cx,y,w:cardW,h:cardH,fill:{color:c.ACCENT},rectRadius:0.06});
      // Person circle
      const pr=0.25;
      slide.addShape(pptx.ShapeType.ellipse, {x:cx+cardW/2-pr,y:y+0.2,w:pr*2,h:pr*2,fill:{color:c.PRIMARY}});
      // Parse "Role: description" or just use as description
      const text=items[i]; const ci=text.indexOf(":");
      const title=ci>0?text.substring(0,ci).trim():"";
      const desc=ci>0?text.substring(ci+1).trim():text;
      let ty = y + 0.2 + pr*2 + 0.2;
      if (title) {
        slide.addText(title, {x:cx+0.1,y:ty,w:cardW-0.2,h:0.3,fontSize:13,fontFace:"Arial",bold:true,color:"ffffff",align:"center",valign:"middle"});
        ty += 0.35;
      }
      slide.addText(desc, {x:cx+0.1,y:ty,w:cardW-0.2,h:cardH-(ty-y)-0.1,fontSize:10,fontFace:"Arial",color:"ffffff",align:"center",valign:"top"});
    }
  }
}

// ── STAIRCASE ── ascending bars from shared baseline
function staircase(ctx:Ctx, f:F) {
  let y = header(ctx, f);
  const {pptx,slide,c} = ctx;
  const items = f.bodyContent.slice(0,4); const dp = f.dataPoints.slice(0,4);
  if (items.length>=2) {
    const n = items.length;
    const gap = 0.15;
    const stepW = (CONTENT_W - gap*(n-1)) / n;
    const maxH = SLIDE.H - y - SLIDE.MARGIN_B - 0.05;
    const baseY = SLIDE.H - SLIDE.MARGIN_B;
    for (let i=0; i<n; i++) {
      // Each step is taller: 35%, 55%, 75%, 95% of maxH
      const pct = (0.3 + 0.65 * ((i+1)/n));
      const stepH = maxH * pct;
      const sx = ML + i*(stepW + gap);
      const sy = baseY - stepH;
      slide.addShape(pptx.ShapeType.rect, {x:sx,y:sy,w:stepW,h:stepH,fill:{color:i===n-1?c.PRIMARY:c.ACCENT},rectRadius:0.04});
      if (dp[i]) slide.addText(dp[i], {x:sx+0.05,y:sy+0.1,w:stepW-0.1,h:0.3,fontSize:13,fontFace:"Arial",bold:true,color:"ffffff",align:"center",valign:"middle"});
      slide.addText(items[i], {x:sx+0.05,y:sy+(dp[i]?0.42:0.1),w:stepW-0.1,h:stepH*0.5,fontSize:9,fontFace:"Arial",color:"ffffff",align:"center",valign:"top"});
    }
  }
}

// ── Dispatcher ──
const R: Record<LayoutType,(ctx:Ctx,f:F)=>void> = {
  "bullets":bullets,"statement":statement,"data-cards":dataCards,"concentric":concentric,
  "matrix":matrix,"timeline":timeline,"icon-columns":iconColumns,"team":team,"staircase":staircase,
};

// ── Main ──
export async function exportPptx({output,isPro,excludedSlides,slideOrder,deckTheme}:ExportOptions) {
  const PptxGenJS=(await import("pptxgenjs")).default;
  const pptx=new PptxGenJS();
  const title=(output as any).title||"Narrative Deck";
  pptx.author="Rhetoric"; pptx.title=title; pptx.layout="LAYOUT_16x9";
  const c=getThemeColors(deckTheme);
  // Title slide
  const ts=pptx.addSlide(); ts.background={color:c.BG};
  ts.addShape(pptx.ShapeType.rect,{x:0,y:0,w:SLIDE.W,h:0.05,fill:{color:c.ACCENT}});
  ts.addShape(pptx.ShapeType.rect,{x:0,y:SLIDE.H-0.05,w:SLIDE.W,h:0.05,fill:{color:c.ACCENT}});
  ts.addText(title,{x:0.8,y:1.5,w:8.4,h:1.4,fontSize:28,fontFace:"Arial",bold:true,color:c.PRIMARY,align:"center",valign:"middle"});
  ts.addText(output.mode.replace(/_/g," ").toUpperCase(),{x:0.8,y:3.0,w:8.4,fontSize:11,fontFace:"Arial",color:c.MUTED_TEXT,align:"center",charSpacing:5});
  if(!isPro)ts.addText("Generated by Rhetoric",{x:0.8,y:4.6,w:8.4,fontSize:9,fontFace:"Arial",color:c.MUTED,align:"center"});
  // Content slides
  const d=(output.data||(output as any).supporting||{}) as any;
  const del=(output as any).deliverable||{};
  const fw=d.deckFramework||del.deckFramework||d.boardDeckOutline||del.boardDeckOutline||[];
  const ordered=slideOrder.length>0?slideOrder:fw.map((_:any,i:number)=>i);
  const active=ordered.filter((i:number)=>!excludedSlides.has(i));
  for(const idx of active){
    const raw=fw[idx]; if(!raw)continue;
    const f=slideFields(raw);
    const layout=resolveLayout(raw?.layoutRecommendation,raw?.selectedLayout);
    const slide=pptx.addSlide(); slide.background={color:c.BG};
    (R[layout]||bullets)({pptx,slide,c,isPro},f);
    if(f.speakerNotes.trim())slide.addNotes(f.speakerNotes.trim());
    if(!isPro)slide.addText("Generated by Rhetoric",{x:ML,y:SLIDE.H-0.3,w:3,fontSize:7,fontFace:"Arial",color:c.MUTED,align:"left"});
  }
  await pptx.writeFile({fileName:`${title.replace(/[^a-zA-Z0-9 ]/g,"")}.pptx`});
}