import type { NarrativeOutputData } from "@/types/narrative";
import type { DeckTheme } from "@/components/SlidePreview";
import { SLIDE, CONTENT_W, CHAR_LIMITS, COLORS, getHeadlineFontSize, estimateHeight, truncate, resolveLayout, type LayoutType } from "@/lib/slideLayouts";

interface ExportOptions { output: NarrativeOutputData; isPro: boolean; excludedSlides: Set<number>; slideOrder: number[]; deckTheme: DeckTheme; }
interface TC { BG:string; FG:string; PRIMARY:string; CAT:string; HEAD:string; BODY:string; SUB:string; CLOSE:string; ACCENT:string; BORDER:string; }

function getThemeColors(theme: DeckTheme): TC {
  const strip=(h:string)=>h.replace("#","");
  if(theme.scheme==="light") return {BG:"ffffff",FG:"334155",PRIMARY:"3b82f6",CAT:"3b82f6",HEAD:"1e293b",BODY:"475569",SUB:"64748b",CLOSE:"3b82f6",ACCENT:"e2e8f0",BORDER:"e2e8f0"};
  if(theme.scheme==="custom"){
    const bg=theme.secondary||"#0b0f14";const b=parseInt(bg.replace("#",""),16);const isLight=b>0x888888;
    return {BG:strip(bg),FG:isLight?"334155":"cbd5e1",PRIMARY:strip(theme.primary||"#3b82f6"),CAT:strip(theme.primary||"#60a5fa"),HEAD:isLight?"1e293b":"e2e8f0",BODY:isLight?"475569":"cbd5e1",SUB:isLight?"64748b":"94a3b8",CLOSE:strip(theme.primary||"#60a5fa"),ACCENT:strip(theme.accent||"#1e3a5f"),BORDER:isLight?"e2e8f0":"1e3a5f"};
  }
  return {BG:"0b0f14",FG:"cbd5e1",PRIMARY:"3b82f6",CAT:"60a5fa",HEAD:"e2e8f0",BODY:"cbd5e1",SUB:"94a3b8",CLOSE:"60a5fa",ACCENT:"1e3a5f",BORDER:"1e3a5f"};
}

function slideFields(raw:any) {
  const headline=truncate(typeof raw==="string"?raw:(raw?.headline||""),CHAR_LIMITS.HEADLINE_MAX);
  const subheadline=truncate(raw?.subheadline||raw?.subheader||"",CHAR_LIMITS.SUBHEADLINE_MAX);
  const bodyContent:string[]=(Array.isArray(raw?.bodyContent)?raw.bodyContent:[]).map((b:string)=>truncate(b.replace(/^[-\u2022*]\s*/,""),CHAR_LIMITS.BULLET_MAX));
  const categoryLabel=truncate(raw?.categoryLabel||"",CHAR_LIMITS.CATEGORY_MAX);
  const closingStatement=truncate(raw?.closingStatement||"",CHAR_LIMITS.CLOSING_MAX);
  const speakerNotes=raw?.speakerNotes||"";
  const dataPoints:string[]=raw?.metadata?.dataPoints||[];
  return {headline,subheadline,bodyContent,categoryLabel,closingStatement,speakerNotes,dataPoints};
}

type Ctx={pptx:any;slide:any;c:TC;isPro:boolean};type F=ReturnType<typeof slideFields>;
const ML=SLIDE.MARGIN_L;

function header(ctx:Ctx,f:F):number {
  let y=0.3;
  if(f.categoryLabel){ctx.slide.addText(f.categoryLabel.toUpperCase(),{x:ML,y,w:CONTENT_W,h:0.25,fontSize:10,fontFace:"Arial",bold:true,color:ctx.c.CAT,align:"left",valign:"top",charSpacing:3});y+=0.26;}
  const sz=getHeadlineFontSize(f.headline);const hH=Math.max(estimateHeight(f.headline,sz),0.38);
  ctx.slide.addText(f.headline,{x:ML,y,w:CONTENT_W,h:hH+0.08,fontSize:sz,fontFace:"Arial",bold:true,color:ctx.c.HEAD,align:"left",valign:"top"});
  return y+hH+0.12;
}

// ── BULLETS ──
function bullets(ctx:Ctx,f:F){
  let y=header(ctx,f);
  if(f.subheadline){const h=Math.max(estimateHeight(f.subheadline,12),0.25);ctx.slide.addText(f.subheadline,{x:ML,y,w:CONTENT_W,h:h+0.05,fontSize:12,fontFace:"Arial",color:ctx.c.SUB,align:"left",valign:"top"});y+=h+0.08;}
  if(f.bodyContent.length>0){const bSz=f.bodyContent.length>4?10:11;const rows=f.bodyContent.slice(0,6).map(t=>({text:t,options:{fontSize:bSz,fontFace:"Arial",color:ctx.c.BODY,bullet:{code:"2022",color:ctx.c.PRIMARY},lineSpacingMultiple:1.5,paraSpaceAfter:3}}));
    ctx.slide.addText(rows as any,{x:ML,y,w:CONTENT_W,h:SLIDE.H-y-SLIDE.MARGIN_B-(f.closingStatement?0.35:0),valign:"top"});}
  if(f.closingStatement)ctx.slide.addText(f.closingStatement,{x:ML,y:SLIDE.H-SLIDE.MARGIN_B-0.28,w:CONTENT_W,h:0.25,fontSize:11,fontFace:"Arial",bold:true,color:ctx.c.CLOSE,align:"left",valign:"bottom"});
}

// ── STATEMENT ──
function statement(ctx:Ctx,f:F){
  const{pptx,slide,c}=ctx;
  slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:SLIDE.W,h:0.05,fill:{color:c.PRIMARY}});
  if(f.categoryLabel)slide.addText(f.categoryLabel.toUpperCase(),{x:ML,y:0.65,w:CONTENT_W,h:0.25,fontSize:11,fontFace:"Arial",bold:true,color:c.CAT,align:"left",charSpacing:4});
  const sz=f.headline.length>50?18:20;
  slide.addText(f.headline,{x:ML,y:f.categoryLabel?1.0:1.2,w:CONTENT_W,h:1.6,fontSize:sz,fontFace:"Arial",bold:true,color:c.HEAD,align:"left",valign:"middle"});
  if(f.subheadline)slide.addText(f.subheadline,{x:ML,y:3.0,w:CONTENT_W*0.75,h:0.45,fontSize:13,fontFace:"Arial",color:c.SUB,align:"left",valign:"top"});
  if(f.closingStatement){
    slide.addShape(pptx.ShapeType.rect,{x:0,y:SLIDE.H-0.7,w:SLIDE.W,h:0.7,fill:{color:c.ACCENT}});
    slide.addShape(pptx.ShapeType.rect,{x:0,y:SLIDE.H-0.7,w:SLIDE.W,h:0.03,fill:{color:c.PRIMARY}});
    slide.addText(f.closingStatement,{x:ML,y:SLIDE.H-0.65,w:CONTENT_W,h:0.5,fontSize:12,fontFace:"Arial",bold:true,color:c.HEAD,align:"left",valign:"middle"});
  }
}

// ── DATA-CARDS ──
function dataCards(ctx:Ctx,f:F){
  let y=header(ctx,f);const dp=f.dataPoints;const items=f.bodyContent.slice(0,3);const n=Math.max(dp.length,Math.min(items.length,3));
  if(n>0){const gap=0.2;const cW=(CONTENT_W-gap*(n-1))/n;const cH=SLIDE.H-y-SLIDE.MARGIN_B;
    for(let i=0;i<n;i++){const cx=ML+i*(cW+gap);
      ctx.slide.addShape(ctx.pptx.ShapeType.rect,{x:cx,y,w:cW,h:cH,fill:{type:"none"},line:{color:ctx.c.BORDER,width:1},rectRadius:0.04});
      ctx.slide.addShape(ctx.pptx.ShapeType.rect,{x:cx,y,w:cW,h:0.04,fill:{color:ctx.c.PRIMARY}});
      let ty=y+0.15;
      if(dp[i]){ctx.slide.addText(dp[i],{x:cx+0.1,y:ty,w:cW-0.2,h:0.35,fontSize:18,fontFace:"Arial",bold:true,color:ctx.c.HEAD,align:"left",valign:"middle"});ty+=0.4;}
      if(items[i])ctx.slide.addText(items[i],{x:cx+0.1,y:ty,w:cW-0.2,h:cH-(ty-y)-0.1,fontSize:10,fontFace:"Arial",color:ctx.c.BODY,align:"left",valign:"top"});
    }}
}

// ── CONCENTRIC (bottom-aligned) ──
function concentric(ctx:Ctx,f:F){
  let y=header(ctx,f);const{pptx,slide,c}=ctx;
  const items=f.bodyContent.slice(0,3);const dp=f.dataPoints.slice(0,3);
  const aH=SLIDE.H-y-SLIDE.MARGIN_B;const baseY=SLIDE.H-SLIDE.MARGIN_B;
  const cxC=ML+CONTENT_W*0.35;const radii=[aH*0.48,aH*0.34,aH*0.18];
  // Bottom-aligned: cy = baseY - r for each
  for(let i=0;i<Math.min(items.length,3);i++){const r=radii[i];const cyC=baseY-r;
    slide.addShape(pptx.ShapeType.ellipse,{x:cxC-r,y:cyC-r,w:r*2,h:r*2,fill:{type:"none"},line:{color:c.PRIMARY,width:1}});}
  // Labels centered between ring tops
  const tops=radii.map(r=>baseY-r*2);tops.push(baseY);
  for(let i=0;i<Math.min(dp.length,3);i++){
    const mid=(tops[i]+tops[i+1])/2;
    slide.addText(dp[i],{x:cxC-0.6,y:mid-0.15,w:1.2,h:0.3,fontSize:i===0?16:i===1?14:12,fontFace:"Arial",bold:true,color:c.HEAD,align:"center",valign:"middle"});
    slide.addText(["TAM","SAM","SOM"][i],{x:cxC-0.4,y:mid+0.12,w:0.8,h:0.2,fontSize:9,fontFace:"Arial",color:c.CAT,align:"center"});
  }
  // Connectors + legend
  const legendX=cxC+radii[0]+0.3;const legendW=SLIDE.W-SLIDE.MARGIN_R-legendX;
  for(let i=0;i<Math.min(items.length,3);i++){
    const mid=(tops[i]+tops[i+1])/2;
    slide.addShape(pptx.ShapeType.ellipse,{x:cxC+radii[i]-0.04,y:mid-0.04,w:0.08,h:0.08,fill:{color:c.PRIMARY}});
    slide.addShape(pptx.ShapeType.rect,{x:cxC+radii[i]+0.04,y:mid-0.01,w:legendX-(cxC+radii[i])-0.04,h:0.02,fill:{color:c.PRIMARY}});
    slide.addText(items[i],{x:legendX,y:mid-0.15,w:legendW,h:0.3,fontSize:9,fontFace:"Arial",color:c.BODY,align:"left",valign:"middle"});
  }
}

// ── MATRIX (X/Y scatter) ──
function matrix(ctx:Ctx,f:F){
  let y=header(ctx,f);const{pptx,slide,c}=ctx;const items=f.bodyContent.slice(0,6);
  const aX=ML+0.6;const aY=y+0.1;const aW=CONTENT_W-0.8;const aH=SLIDE.H-y-SLIDE.MARGIN_B-0.4;
  // Axes
  slide.addShape(pptx.ShapeType.rect,{x:aX,y:aY,w:0.015,h:aH,fill:{color:c.BORDER}});
  slide.addShape(pptx.ShapeType.rect,{x:aX,y:aY+aH,w:aW,h:0.015,fill:{color:c.BORDER}});
  slide.addText("Quality",{x:ML,y:aY+aH/2-0.2,w:0.5,h:0.4,fontSize:8,fontFace:"Arial",color:c.SUB,align:"center",valign:"middle"});
  slide.addText("Speed + Affordability",{x:aX+aW/2-1,y:aY+aH+0.05,w:2,h:0.2,fontSize:8,fontFace:"Arial",color:c.SUB,align:"center"});
  // Grid
  slide.addShape(pptx.ShapeType.rect,{x:aX,y:aY+aH/2,w:aW,h:0.01,fill:{color:c.ACCENT}});
  slide.addShape(pptx.ShapeType.rect,{x:aX+aW/2,y:aY,w:0.01,h:aH,fill:{color:c.ACCENT}});
  // Position competitors
  const positions=[{x:0.2,y:0.15},{x:0.7,y:0.65},{x:0.45,y:0.55},{x:0.3,y:0.72},{x:0.55,y:0.4}];
  const rhetoricPos={x:0.8,y:0.08};
  items.slice(0,-1).forEach((t,i)=>{const pos=positions[i]||{x:0.5,y:0.5};const px=aX+pos.x*aW;const py=aY+pos.y*aH;
    slide.addShape(pptx.ShapeType.ellipse,{x:px-0.06,y:py-0.06,w:0.12,h:0.12,fill:{color:c.SUB}});
    const ci2=t.indexOf(":");const name=ci2>0?t.substring(0,ci2).trim():t.substring(0,20);const desc=ci2>0?t.substring(ci2+1).trim():"";
    slide.addText(name,{x:px+0.1,y:py-0.12,w:1.5,h:0.15,fontSize:9,fontFace:"Arial",bold:true,color:c.BODY,align:"left"});
    if(desc)slide.addText(desc,{x:px+0.1,y:py,w:1.5,h:0.12,fontSize:7,fontFace:"Arial",color:c.SUB,align:"left"});
  });
  // Rhetoric (highlighted, top-right)
  if(items.length>0){const last=items[items.length-1];const ci3=last.indexOf(":");const name2=ci3>0?last.substring(0,ci3).trim():last.substring(0,20);
    const px2=aX+rhetoricPos.x*aW;const py2=aY+rhetoricPos.y*aH;
    slide.addShape(pptx.ShapeType.ellipse,{x:px2-0.12,y:py2-0.12,w:0.24,h:0.24,fill:{color:c.PRIMARY}});
    slide.addText(name2,{x:px2-0.5,y:py2-0.3,w:1,h:0.2,fontSize:11,fontFace:"Arial",bold:true,color:c.HEAD,align:"center"});
  }
}

// ── FLYWHEEL ──
function flywheel(ctx:Ctx,f:F){
  let y=header(ctx,f);const{pptx,slide,c}=ctx;const items=f.bodyContent.slice(0,6);const n=items.length;
  if(n<3){bullets(ctx,f);return;}
  const aH=SLIDE.H-y-SLIDE.MARGIN_B-0.1;const cxF=ML+CONTENT_W/2;const cyF=y+aH/2;const r=Math.min(aH*0.4,CONTENT_W*0.14);
  const angles=n===3?[-90,30,150]:n===4?[-90,0,90,180]:n===5?[-90,-18,54,126,198]:[-90,-30,30,90,150,210];
  // Nodes
  for(let i=0;i<n;i++){
    const a=angles[i]*Math.PI/180;const nx=cxF+r*Math.cos(a);const ny=cyF+r*Math.sin(a);
    // Arrow to next node (line)
    const next=(i+1)%n;const a2=angles[next]*Math.PI/180;
    const nx2=cxF+r*Math.cos(a2);const ny2=cyF+r*Math.sin(a2);
    slide.addShape(pptx.ShapeType.rect,{x:Math.min(nx,nx2),y:Math.min(ny,ny2)-0.01,w:Math.abs(nx2-nx)||0.02,h:Math.abs(ny2-ny)||0.02,fill:{color:c.ACCENT}});
    // Node circle
    slide.addShape(pptx.ShapeType.ellipse,{x:nx-0.16,y:ny-0.16,w:0.32,h:0.32,fill:{color:c.PRIMARY}});
    slide.addText(String(i+1),{x:nx-0.16,y:ny-0.16,w:0.32,h:0.32,fontSize:12,fontFace:"Arial",bold:true,color:"ffffff",align:"center",valign:"middle"});
    // Label outside
    const tx=cxF+(r+0.7)*Math.cos(a);const ty=cyF+(r+0.5)*Math.sin(a);
    const ci2=items[i].indexOf(":");const title=ci2>0?items[i].substring(0,ci2).trim():items[i].substring(0,25);const desc=ci2>0?items[i].substring(ci2+1).trim():"";
    slide.addText(title,{x:tx-0.8,y:ty-0.15,w:1.6,h:0.2,fontSize:10,fontFace:"Arial",bold:true,color:c.HEAD,align:"center",valign:"middle"});
    if(desc)slide.addText(desc,{x:tx-0.8,y:ty+0.05,w:1.6,h:0.2,fontSize:8,fontFace:"Arial",color:c.SUB,align:"center"});
  }
}

// ── ICON COLUMNS ──
function iconColumns(ctx:Ctx,f:F){
  let y=header(ctx,f);const{pptx,slide,c}=ctx;const items=f.bodyContent.slice(0,3);const dp=f.dataPoints;
  if(items.length<2){bullets(ctx,f);return;}
  const n=items.length;const gap=0.2;const colW=(CONTENT_W-gap*(n-1))/n;const cH=SLIDE.H-y-SLIDE.MARGIN_B;
  for(let i=0;i<n;i++){const cx=ML+i*(colW+gap);
    slide.addShape(pptx.ShapeType.rect,{x:cx,y,w:colW,h:cH,fill:{type:"none"},line:{color:c.BORDER,width:1},rectRadius:0.04});
    const ir=0.2;slide.addShape(pptx.ShapeType.ellipse,{x:cx+colW/2-ir,y:y+cH*0.15,w:ir*2,h:ir*2,fill:{type:"none"},line:{color:c.PRIMARY,width:1.5}});
    slide.addText(String(i+1),{x:cx+colW/2-ir,y:y+cH*0.15,w:ir*2,h:ir*2,fontSize:12,fontFace:"Arial",bold:true,color:c.PRIMARY,align:"center",valign:"middle"});
    let ty=y+cH*0.15+ir*2+0.1;
    if(dp[i]){slide.addText(dp[i],{x:cx+0.1,y:ty,w:colW-0.2,h:0.25,fontSize:14,fontFace:"Arial",bold:true,color:c.HEAD,align:"center"});ty+=0.3;}
    slide.addText(items[i],{x:cx+0.08,y:ty,w:colW-0.16,h:cH-(ty-y)-0.08,fontSize:10,fontFace:"Arial",color:c.BODY,align:"center",valign:"top"});
  }
}

// ── TEAM ──
function team(ctx:Ctx,f:F){
  let y=header(ctx,f);const{pptx,slide,c}=ctx;const items=f.bodyContent.slice(0,4);
  const n=items.length;const gap=0.2;const colW=(CONTENT_W-gap*(n-1))/n;const cH=SLIDE.H-y-SLIDE.MARGIN_B;
  for(let i=0;i<n;i++){const cx=ML+i*(colW+gap);
    slide.addShape(pptx.ShapeType.rect,{x:cx,y,w:colW,h:cH,fill:{type:"none"},line:{color:c.BORDER,width:1},rectRadius:0.04});
    const pr=0.2;slide.addShape(pptx.ShapeType.ellipse,{x:cx+colW/2-pr,y:y+cH*0.12,w:pr*2,h:pr*2,fill:{type:"none"},line:{color:c.PRIMARY,width:1.5}});
    const ci2=items[i].indexOf(":");const title=ci2>0?items[i].substring(0,ci2).trim():"";const desc=ci2>0?items[i].substring(ci2+1).trim():items[i];
    let ty=y+cH*0.12+pr*2+0.1;
    if(title){slide.addText(title,{x:cx+0.08,y:ty,w:colW-0.16,h:0.25,fontSize:12,fontFace:"Arial",bold:true,color:c.HEAD,align:"center"});ty+=0.3;}
    slide.addText(desc,{x:cx+0.08,y:ty,w:colW-0.16,h:cH-(ty-y)-0.08,fontSize:10,fontFace:"Arial",color:c.BODY,align:"center",valign:"top"});
  }
}

// ── STAIRCASE ──
function staircase(ctx:Ctx,f:F){
  let y=header(ctx,f);const{pptx,slide,c}=ctx;const items=f.bodyContent.slice(0,4);const dp=f.dataPoints.slice(0,4);const n=items.length;
  const gap=0.12;const stepW=(CONTENT_W-gap*(n-1))/n;const maxH=SLIDE.H-y-SLIDE.MARGIN_B-0.15;const baseY=SLIDE.H-SLIDE.MARGIN_B;
  const pcts=[0.3,0.5,0.7,0.9];
  for(let i=0;i<n;i++){const h=maxH*pcts[i];const sx=ML+i*(stepW+gap);const sy=baseY-h;const isLast=i===n-1;
    slide.addShape(pptx.ShapeType.rect,{x:sx,y:sy,w:stepW,h,fill:{type:isLast?"solid":"none",color:isLast?c.PRIMARY+"15":undefined},line:{color:isLast?c.PRIMARY:c.BORDER,width:isLast?1.5:1},rectRadius:0.03});
    if(dp[i])slide.addText(dp[i],{x:sx+0.05,y:sy+0.08,w:stepW-0.1,h:0.25,fontSize:14,fontFace:"Arial",bold:true,color:isLast?c.PRIMARY:c.HEAD,align:"center"});
    // Bullets inside
    const bullets=items[i].split(/[,;]/).map(b=>b.trim()).filter(Boolean).slice(0,3);
    const bRows=bullets.map(b=>({text:b,options:{fontSize:8,fontFace:"Arial",color:c.SUB,bullet:{code:"2022",color:c.PRIMARY},lineSpacingMultiple:1.3}}));
    if(bRows.length>0)slide.addText(bRows as any,{x:sx+0.06,y:sy+(dp[i]?0.35:0.1),w:stepW-0.12,h:h*0.5,valign:"top"});
  }
  // Zigzag arrow above bars
  for(let i=0;i<n-1;i++){const sx1=ML+i*(stepW+gap)+stepW/2;const sy1=baseY-maxH*pcts[i]-0.12;const sx2=ML+(i+1)*(stepW+gap)+stepW/2;const sy2=baseY-maxH*pcts[i+1]-0.12;
    slide.addShape(pptx.ShapeType.rect,{x:Math.min(sx1,sx2),y:Math.min(sy1,sy2),w:Math.abs(sx2-sx1)||0.02,h:0.02,fill:{color:c.PRIMARY}});
    slide.addShape(pptx.ShapeType.rect,{x:sx2-0.01,y:sy2,w:0.02,h:Math.abs(sy1-sy2)||0.02,fill:{color:c.PRIMARY}});
  }
}

// ── Dispatcher ──
const R:Record<LayoutType,(ctx:Ctx,f:F)=>void>={
  "bullets":bullets,"statement":statement,"data-cards":dataCards,"concentric":concentric,
  "matrix":matrix,"flywheel":flywheel,"icon-columns":iconColumns,"team":team,"staircase":staircase,
};

export async function exportPptx({output,isPro,excludedSlides,slideOrder,deckTheme}:ExportOptions){
  const PptxGenJS=(await import("pptxgenjs")).default;
  const pptx=new PptxGenJS();const title=(output as any).title||"Narrative Deck";
  pptx.author="Rhetoric";pptx.title=title;pptx.layout="LAYOUT_16x9";
  const c=getThemeColors(deckTheme);
  const ts=pptx.addSlide();ts.background={color:c.BG};
  ts.addShape(pptx.ShapeType.rect,{x:0,y:0,w:SLIDE.W,h:0.05,fill:{color:c.PRIMARY}});
  ts.addShape(pptx.ShapeType.rect,{x:0,y:SLIDE.H-0.05,w:SLIDE.W,h:0.05,fill:{color:c.PRIMARY}});
  ts.addText(title,{x:0.8,y:1.5,w:8.4,h:1.4,fontSize:26,fontFace:"Arial",bold:true,color:c.HEAD,align:"center",valign:"middle"});
  ts.addText(output.mode.replace(/_/g," ").toUpperCase(),{x:0.8,y:3.0,w:8.4,fontSize:10,fontFace:"Arial",color:c.SUB,align:"center",charSpacing:5});
  if(!isPro)ts.addText("Generated by Rhetoric",{x:0.8,y:4.6,w:8.4,fontSize:8,fontFace:"Arial",color:c.SUB,align:"center"});
  const d=(output.data||(output as any).supporting||{}) as any;const del=(output as any).deliverable||{};
  const fw=d.deckFramework||del.deckFramework||d.boardDeckOutline||del.boardDeckOutline||[];
  const ordered=slideOrder.length>0?slideOrder:fw.map((_:any,i:number)=>i);
  const active=ordered.filter((i:number)=>!excludedSlides.has(i));
  for(const idx of active){const raw=fw[idx];if(!raw)continue;const f=slideFields(raw);
    const layout=resolveLayout(raw?.layoutRecommendation,raw?.selectedLayout,raw?.categoryLabel,raw?.metadata?.dataPoints);
    const slide=pptx.addSlide();slide.background={color:c.BG};
    (R[layout]||bullets)({pptx,slide,c,isPro},f);
    if(f.speakerNotes.trim())slide.addNotes(f.speakerNotes.trim());
    if(!isPro)slide.addText("Generated by Rhetoric",{x:ML,y:SLIDE.H-0.25,w:3,fontSize:7,fontFace:"Arial",color:c.SUB,align:"left"});
  }
  await pptx.writeFile({fileName:`${title.replace(/[^a-zA-Z0-9 ]/g,"")}.pptx`});
}