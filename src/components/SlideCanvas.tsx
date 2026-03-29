import { useState, useEffect, useRef } from "react";
import { resolveLayout, truncate, CHAR_LIMITS, COLORS, type LayoutType, LAYOUT_DEFINITIONS } from "@/lib/slideLayouts";
import type { DeckTheme } from "@/components/SlidePreview";

export interface SlideCanvasData {
  headline: string; subheadline?: string; bodyContent?: string[]; categoryLabel?: string;
  closingStatement?: string; layoutRecommendation?: string; selectedLayout?: string; dataPoints?: string[];
}
interface Props { slide: SlideCanvasData; theme: DeckTheme; className?: string; }

function gc(theme: DeckTheme) {
  if (theme.scheme==="light") return {bg:"#ffffff",fg:"#334155",primary:"#3b82f6",cat:"#3b82f6",head:"#1e293b",body:"#475569",sub:"#64748b",close:"#3b82f6",accent:"#e2e8f0",onAcc:"#1e293b",border:"#e2e8f0"};
  if (theme.scheme==="custom") {
    const s=theme.secondary||"#0b0f14";const [r,g,b]=[s.slice(1,3),s.slice(3,5),s.slice(5,7)].map(h=>parseInt(h,16));
    const isLight=(r*299+g*587+b*114)/1000>128;
    return {bg:s,fg:isLight?"#334155":"#cbd5e1",primary:theme.primary||"#3b82f6",cat:theme.primary||"#60a5fa",head:isLight?"#1e293b":"#e2e8f0",body:isLight?"#475569":"#cbd5e1",sub:isLight?"#64748b":"#94a3b8",close:theme.primary||"#60a5fa",accent:theme.accent||"#1e3a5f",onAcc:"#ffffff",border:isLight?"#e2e8f0":"#1e3a5f"};
  }
  return {bg:"#0b0f14",fg:"#cbd5e1",primary:"#3b82f6",cat:"#60a5fa",head:"#e2e8f0",body:"#cbd5e1",sub:"#94a3b8",close:"#60a5fa",accent:"#1e3a5f",onAcc:"#ffffff",border:"#1e3a5f"};
}
type C=ReturnType<typeof gc>;
function hSz(t:string){return t.length<=40?"1.05em":t.length<=60?"0.9em":t.length<=80?"0.8em":"0.7em";}

function Header({s,c}:{s:SlideCanvasData;c:C}) {
  return <>
    {s.categoryLabel && <div style={{fontSize:"0.38em",fontWeight:700,color:c.cat,letterSpacing:"0.15em",textTransform:"uppercase"}}>{s.categoryLabel}</div>}
    <div style={{fontSize:hSz(s.headline),fontWeight:700,color:c.head,lineHeight:1.25,marginTop:"1%"}}>{s.headline}</div>
  </>;
}

// ── BULLETS ──
function Bullets({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <Header s={s} c={c}/>
    {s.subheadline && <div style={{fontSize:"0.48em",color:c.sub,marginTop:"2%",lineHeight:1.4}}>{s.subheadline}</div>}
    {s.bodyContent&&s.bodyContent.length>0 && <div style={{marginTop:"3%",flex:1}}>{s.bodyContent.slice(0,6).map((t,i)=><div key={i} style={{fontSize:"0.43em",color:c.body,lineHeight:1.7,display:"flex",gap:"0.5em",marginBottom:"0.15em"}}><span style={{color:c.primary}}>•</span><span>{t}</span></div>)}</div>}
    {s.closingStatement && <div style={{fontSize:"0.42em",fontWeight:600,color:c.close,marginTop:"2%"}}>{s.closingStatement}</div>}
  </div>;
}

// ── STATEMENT ──
function Statement({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <div style={{height:"0.8%",background:c.primary}}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"7%"}}>
      <Header s={s} c={c}/>
      {s.subheadline && <div style={{fontSize:"0.52em",color:c.sub,marginTop:"3%",maxWidth:"75%",lineHeight:1.4}}>{s.subheadline}</div>}
    </div>
    {s.closingStatement && <div style={{background:c.accent,padding:"2.5% 7%",borderTop:`2px solid ${c.primary}`}}><div style={{fontSize:"0.45em",fontWeight:600,color:c.head}}>{s.closingStatement}</div></div>}
  </div>;
}

// ── DATA-CARDS ──
function DataCards({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const dp=s.dataPoints||[];const items=(s.bodyContent||[]).slice(0,3);const n=Math.max(dp.length,Math.min(items.length,3));
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <Header s={s} c={c}/>
    {n>0 && <div style={{display:"flex",gap:"2.5%",marginTop:"3%",flex:1}}>
      {Array.from({length:n}).map((_,i)=><div key={i} style={{flex:1,border:`1px solid ${c.border}`,borderTop:`3px solid ${c.primary}`,borderRadius:4,padding:"3% 4%",display:"flex",flexDirection:"column"}}>
        {dp[i] && <div style={{fontSize:"0.75em",fontWeight:700,color:c.head,marginBottom:"4%"}}>{dp[i]}</div>}
        {items[i] && <div style={{fontSize:"0.38em",color:c.body,lineHeight:1.5}}>{items[i]}</div>}
      </div>)}
    </div>}
  </div>;
}

// ── CONCENTRIC ──
function Concentric({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,3);const dp=s.dataPoints||[];
  return <div style={{display:"flex",height:"100%",padding:"3.5% 3%"}}>
    <div style={{flex:"0 0 22%",paddingTop:"1%"}}><Header s={s} c={c}/></div>
    <div style={{flex:"0 0 48%",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <svg viewBox="0 0 440 400" width="100%" height="100%" style={{overflow:"visible"}}>
        <ellipse cx="200" cy="215" rx="185" ry="185" fill={`${c.primary}10`} stroke={`${c.primary}33`} strokeWidth="1.5"/>
        <ellipse cx="200" cy="272" rx="128" ry="128" fill={`${c.primary}1a`} stroke={`${c.primary}55`} strokeWidth="1.5"/>
        <ellipse cx="200" cy="332" rx="68" ry="68" fill={`${c.primary}33`} stroke={`${c.primary}88`} strokeWidth="1.5"/>
        <text x="200" y="82" textAnchor="middle" fill={c.head} fontSize="20" fontWeight="700" fontFamily="Arial">{dp[0]||""}</text>
        <text x="200" y="98" textAnchor="middle" fill={c.cat} fontSize="9" fontFamily="Arial">TAM</text>
        <text x="200" y="199" textAnchor="middle" fill={c.head} fontSize="17" fontWeight="700" fontFamily="Arial">{dp[1]||""}</text>
        <text x="200" y="215" textAnchor="middle" fill={c.cat} fontSize="9" fontFamily="Arial">SAM</text>
        <text x="200" y="327" textAnchor="middle" fill={c.head} fontSize="14" fontWeight="700" fontFamily="Arial">{dp[2]||""}</text>
        <text x="200" y="343" textAnchor="middle" fill={c.cat} fontSize="9" fontFamily="Arial">SOM</text>
        <circle cx="370" cy="87" r="4" fill={c.primary}/><line x1="374" y1="87" x2="440" y2="87" stroke={c.primary} strokeWidth="1"/>
        <circle cx="323" cy="204" r="4" fill={c.primary}/><line x1="327" y1="204" x2="440" y2="204" stroke={c.primary} strokeWidth="1"/>
        <circle cx="266" cy="332" r="4" fill={c.primary}/><line x1="270" y1="332" x2="440" y2="332" stroke={c.primary} strokeWidth="1"/>
      </svg>
    </div>
    <div style={{flex:"0 0 26%",display:"flex",flexDirection:"column",paddingTop:"6%"}}>
      {items.map((t,i)=><div key={i} style={{marginTop:i===0?0:i===1?"12%":"14%"}}><div style={{fontSize:"0.35em",color:c.body,lineHeight:1.4}}>{t}</div></div>)}
    </div>
  </div>;
}

// ── MATRIX (X/Y scatter) ──
function Matrix({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,6);
  // Parse items: try "Name: description" format
  const parsed=items.map(t=>{const ci=t.indexOf(":");return ci>0?{name:t.substring(0,ci).trim(),desc:t.substring(ci+1).trim()}:{name:t.substring(0,30),desc:""};});
  // Position competitors in scatter. Last item is highlighted (Rhetoric)
  const positions=[{x:18,y:15},{x:68,y:65},{x:42,y:55},{x:28,y:72},{x:50,y:40}];
  const rhetoricPos={x:78,y:10};
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <Header s={s} c={c}/>
    <div style={{flex:1,marginTop:"2.5%"}}>
      <svg viewBox="0 0 800 340" width="100%" height="100%" fontFamily="Arial">
        <line x1="80" y1="20" x2="80" y2="320" stroke={c.border} strokeWidth="1"/>
        <text x="40" y="170" textAnchor="middle" fill={c.sub} fontSize="10" transform="rotate(-90,40,170)">Narrative Quality</text>
        <line x1="80" y1="320" x2="780" y2="320" stroke={c.border} strokeWidth="1"/>
        <text x="430" y="338" textAnchor="middle" fill={c.sub} fontSize="10">Speed + Affordability</text>
        <line x1="80" y1="170" x2="780" y2="170" stroke={c.accent} strokeWidth="0.5" strokeDasharray="4"/>
        <line x1="430" y1="20" x2="430" y2="320" stroke={c.accent} strokeWidth="0.5" strokeDasharray="4"/>
        {parsed.slice(0,-1).map((p,i)=>{const pos=positions[i]||{x:50,y:50};const px=80+pos.x/100*700;const py=20+pos.y/100*300;
          return <g key={i}><circle cx={px} cy={py} r="6" fill={c.sub} opacity="0.5"/><text x={px+12} y={py-4} fill={c.body} fontSize="9" fontWeight="600">{p.name}</text><text x={px+12} y={py+8} fill={c.sub} fontSize="7">{p.desc}</text></g>;})}
        {parsed.length>0 && (()=>{const last=parsed[parsed.length-1];const px=80+rhetoricPos.x/100*700;const py=20+rhetoricPos.y/100*300;
          return <g><circle cx={px} cy={py} r="10" fill={c.primary} opacity="0.9"/><circle cx={px} cy={py} r="16" fill="none" stroke={c.primary} strokeWidth="1.5" opacity="0.4"/><text x={px} y={py-18} textAnchor="middle" fill={c.head} fontSize="11" fontWeight="700">{last.name}</text><text x={px+18} y={py+4} fill={c.cat} fontSize="8">{last.desc}</text></g>;})()}
      </svg>
    </div>
  </div>;
}

// ── FLYWHEEL ──
function Flywheel({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,6);const n=items.length;
  if(n<3) return <Bullets slide={s} colors={c}/>;
  // Position nodes around a circle
  const cx=410,cy=155,r=100;
  const angles=n===3?[-90,30,150]:n===4?[-90,0,90,180]:n===5?[-90,-18,54,126,198]:[-90,-30,30,90,150,210];
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"4.5% 6%"}}>
    <Header s={s} c={c}/>
    <div style={{flex:1,marginTop:"1.5%"}}>
      <svg viewBox="0 0 820 290" width="100%" height="100%" fontFamily="Arial">
        {angles.map((a,i)=>{const next=(i+1)%n;const a1=a*Math.PI/180;const a2=angles[next]*Math.PI/180;
          const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);const x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
          const mx=cx+r*0.6*Math.cos((a1+a2)/2),my=cy+r*0.6*Math.sin((a1+a2)/2);
          return <path key={`a${i}`} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke={c.accent} strokeWidth="2.5"/>;
        })}
        {angles.map((a,i)=>{const a1=a*Math.PI/180;const nx=cx+r*Math.cos(a1);const ny=cy+r*Math.sin(a1);
          const tx=cx+(r+60)*Math.cos(a1);const ty=cy+(r+60)*Math.sin(a1);
          const parsed=items[i];const ci2=parsed.indexOf(":");const title=ci2>0?parsed.substring(0,ci2).trim():parsed.substring(0,25);const desc=ci2>0?parsed.substring(ci2+1).trim():"";
          const anchor=a>-45&&a<45?"start":a>135||a<-135?"end":"middle";
          return <g key={`n${i}`}>
            <circle cx={nx} cy={ny} r={14} fill={c.primary}/>
            <text x={nx} y={ny+4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">{i+1}</text>
            <text x={tx} y={ty-4} textAnchor={anchor} fill={c.head} fontSize="10" fontWeight="600">{title}</text>
            {desc && <text x={tx} y={ty+9} textAnchor={anchor} fill={c.sub} fontSize="8">{desc.substring(0,50)}</text>}
          </g>;})}
      </svg>
    </div>
  </div>;
}

// ── ICON COLUMNS ──
function IconColumns({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,3);const dp=s.dataPoints||[];
  const icons=[
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>,
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>,
  ];
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <Header s={s} c={c}/>
    {items.length>=2 && <div style={{display:"flex",gap:"2.5%",marginTop:"3%",flex:1}}>
      {items.map((t,i)=><div key={i} style={{flex:1,border:`1px solid ${c.border}`,borderRadius:4,padding:"4%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:"2em",height:"2em",borderRadius:"50%",border:`2px solid ${c.primary}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"5%"}}>{icons[i%3]}</div>
        {dp[i] && <div style={{fontSize:"0.55em",fontWeight:700,color:c.head,marginBottom:"3%"}}>{dp[i]}</div>}
        <div style={{fontSize:"0.38em",color:c.body,textAlign:"center",lineHeight:1.4}}>{t}</div>
      </div>)}
    </div>}
  </div>;
}

// ── TEAM ──
function Team({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,4);
  const icons=[
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>,
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>,
  ];
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <Header s={s} c={c}/>
    {items.length>=1 && <div style={{display:"flex",gap:"2.5%",marginTop:"3%",flex:1}}>
      {items.map((t,i)=>{const ci2=t.indexOf(":");const title=ci2>0?t.substring(0,ci2):"";const desc=ci2>0?t.substring(ci2+1).trim():t;
        return <div key={i} style={{flex:1,border:`1px solid ${c.border}`,borderRadius:4,padding:"4%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:"2em",height:"2em",borderRadius:"50%",border:`2px solid ${c.primary}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"5%"}}>{icons[i%4]}</div>
          {title && <div style={{fontSize:"0.48em",fontWeight:700,color:c.head,textAlign:"center",marginBottom:"3%"}}>{title}</div>}
          <div style={{fontSize:"0.38em",color:c.body,textAlign:"center",lineHeight:1.4}}>{desc}</div>
        </div>;})}
    </div>}
  </div>;
}

// ── STAIRCASE ──
function Staircase({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,4);const dp=s.dataPoints||[];const n=items.length;
  const heights=[30,50,70,90];
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"4.5% 6%"}}>
    <Header s={s} c={c}/>
    <div style={{flex:1,marginTop:"1.5%"}}>
      <svg viewBox="0 0 800 340" width="100%" height="100%" fontFamily="Arial" preserveAspectRatio="xMidYMax meet">
        {items.map((t,i)=>{const h=heights[i]/100*300;const y=340-h;const w=(780-15*(n-1))/n;const x=15+i*(w+15);
          const isLast=i===n-1;
          const bullets=t.split(/[,;]/).map(b=>b.trim()).filter(Boolean).slice(0,3);
          return <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="3" fill={isLast?`${c.primary}12`:"none"} stroke={isLast?c.primary:c.border} strokeWidth={isLast?1.5:1}/>
            <text x={x+w/2} y={y+20} textAnchor="middle" fill={isLast?c.primary:c.head} fontSize="15" fontWeight="700">{dp[i]||""}</text>
            {bullets.map((b,bi)=><g key={bi}><text x={x+12} y={y+38+bi*13} fill={c.primary} fontSize="7">•</text><text x={x+20} y={y+38+bi*13} fill={c.sub} fontSize="8">{b}</text></g>)}
          </g>;})}
        <polyline points={items.map((_, i) => {const w=(780-15*(n-1))/n;const x=15+i*(w+15)+w/2;const h=heights[i]/100*300;const y=340-h;return `${x},${y-8} ${x},${y-16}`;}).join(" ")}
          fill="none" stroke={c.primary} strokeWidth="2" strokeDasharray="5,4"/>
        {(()=>{const w2=(780-15*(n-1))/n;const lx=15+(n-1)*(w2+15)+w2/2+30;const ly=340-heights[n-1]/100*300-20;
          return <polygon points={`${lx},${ly} ${lx-8},${ly+4} ${lx-6},${ly-6}`} fill={c.primary}/>;})()}
      </svg>
    </div>
  </div>;
}

const RS:Record<LayoutType,React.FC<{slide:SlideCanvasData;colors:C}>> = {
  "bullets":Bullets,"statement":Statement,"data-cards":DataCards,"concentric":Concentric,
  "matrix":Matrix,"flywheel":Flywheel,"icon-columns":IconColumns,"team":Team,"staircase":Staircase,
};

export function SlideCanvas({slide,theme,className}:Props) {
  const c=gc(theme);const layout=resolveLayout(slide.layoutRecommendation,slide.selectedLayout,slide.categoryLabel,slide.dataPoints);
  const R=RS[layout]||Bullets;
  return <div className={className} style={{aspectRatio:"16/9",backgroundColor:c.bg,borderRadius:4,overflow:"hidden",fontSize:"clamp(8px,1.8vw,16px)",fontFamily:"Arial,sans-serif",position:"relative"}}><R slide={slide} colors={c}/></div>;
}

// Layout picker
interface LP {current:LayoutType;onChange:(l:LayoutType)=>void;}
export function LayoutPicker({current,onChange}:LP) {
  const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const label=LAYOUT_DEFINITIONS.find(d=>d.type===current)?.label||"Layout";
  return <div className="relative" ref={ref}>
    <button onClick={e=>{e.stopPropagation();setOpen(!open)}} className="text-[10px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 font-medium flex items-center gap-1 transition-colors">{label} <span className="text-[8px]">▼</span></button>
    {open && <div className="absolute left-0 top-full mt-1 w-44 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-1">
      {LAYOUT_DEFINITIONS.map(d=><button key={d.type} onClick={e=>{e.stopPropagation();onChange(d.type);setOpen(false)}} className={`w-full text-left text-xs px-3 py-1.5 hover:bg-accent transition-colors ${current===d.type?"text-electric font-medium":"text-foreground"}`}>{d.label}</button>)}
    </div>}
  </div>;
}