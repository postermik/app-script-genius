import { useState, useEffect, useRef } from "react";
import { resolveLayout, truncate, CHAR_LIMITS, type LayoutType, LAYOUT_DEFINITIONS } from "@/lib/slideLayouts";
import type { DeckTheme } from "@/components/SlidePreview";

export interface SlideCanvasData {
  headline: string; subheadline?: string; bodyContent?: string[]; categoryLabel?: string;
  closingStatement?: string; layoutRecommendation?: string; selectedLayout?: string; dataPoints?: string[];
}
interface Props { slide: SlideCanvasData; theme: DeckTheme; className?: string; }

function gc(theme: DeckTheme) {
  if (theme.scheme==="light") return {bg:"#ffffff",fg:"#1a1a2e",primary:"#3b82f6",muted:"#9ca3af",accent:"#3b82f6"};
  if (theme.scheme==="custom") {
    const s=theme.secondary||"#0b0f14"; const [r,g,b]=[s.slice(1,3),s.slice(3,5),s.slice(5,7)].map(h=>parseInt(h,16));
    return {bg:s,fg:(r*299+g*587+b*114)/1000>128?"#1a1a2e":"#dce0e8",primary:theme.primary||"#3b82f6",muted:"#9ca3af",accent:theme.accent||"#1e3a5f"};
  }
  return {bg:"#0b0f14",fg:"#dce0e8",primary:"#3b82f6",muted:"#9ca3af",accent:"#3b82f6"};
}
type C=ReturnType<typeof gc>;
function hSz(t:string){return t.length<=40?"1.05em":t.length<=60?"0.9em":t.length<=80?"0.8em":"0.7em";}

function H({s,c}:{s:SlideCanvasData;c:C}) {
  return <>
    {s.categoryLabel && <div style={{fontSize:"0.38em",fontWeight:700,color:c.accent,letterSpacing:"0.15em",textTransform:"uppercase"}}>{s.categoryLabel}</div>}
    <div style={{fontSize:hSz(s.headline),fontWeight:700,color:c.primary,lineHeight:1.2,marginTop:"1%"}}>{s.headline}</div>
  </>;
}

function Bullets({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <H s={s} c={c}/>
    {s.subheadline && <div style={{fontSize:"0.5em",color:c.muted,marginTop:"2%",lineHeight:1.3}}>{s.subheadline}</div>}
    {s.bodyContent&&s.bodyContent.length>0 && <div style={{marginTop:"3%",flex:1}}>{s.bodyContent.slice(0,6).map((t,i)=><div key={i} style={{fontSize:"0.45em",color:c.fg,lineHeight:1.5,display:"flex",gap:"0.4em",marginBottom:"0.2em"}}><span style={{color:c.accent}}>•</span><span>{t}</span></div>)}</div>}
    {s.closingStatement && <div style={{fontSize:"0.4em",fontWeight:700,color:c.accent,marginTop:"auto"}}>{s.closingStatement}</div>}
  </div>;
}

function Statement({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  return <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:"1%",backgroundColor:c.accent}}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"7%"}}>
      <H s={s} c={c}/>
      {s.subheadline && <div style={{fontSize:"0.5em",color:c.muted,marginTop:"3%",maxWidth:"75%",lineHeight:1.3}}>{s.subheadline}</div>}
    </div>
    {s.closingStatement && <div style={{backgroundColor:c.accent,padding:"2.5% 7%"}}><div style={{fontSize:"0.45em",fontWeight:700,color:"#ffffff"}}>{s.closingStatement}</div></div>}
  </div>;
}

function DataCards({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const dp=s.dataPoints||[]; const items=(s.bodyContent||[]).slice(0,3); const n=Math.max(dp.length,Math.min(items.length,3));
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <H s={s} c={c}/>
    {n>0 && <div style={{display:"flex",gap:"2.5%",marginTop:"3%",flex:1}}>
      {Array.from({length:n}).map((_,i)=><div key={i} style={{flex:1,backgroundColor:c.accent,borderRadius:4,borderTop:`3px solid ${c.primary}`,padding:"3% 4%",display:"flex",flexDirection:"column"}}>
        {dp[i] && <div style={{fontSize:"0.7em",fontWeight:700,color:"#ffffff",lineHeight:1.1,marginBottom:"4%"}}>{dp[i]}</div>}
        {items[i] && <div style={{fontSize:"0.38em",color:"#ffffff",lineHeight:1.3,opacity:0.9}}>{items[i]}</div>}
      </div>)}
    </div>}
  </div>;
}

function Concentric({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,3); const dp=s.dataPoints||[];
  const tiers=["TAM","SAM","SOM"];
  return <div style={{display:"flex",height:"100%",padding:"5% 5%"}}>
    <div style={{flex:"0 0 30%",paddingTop:"2%"}}><H s={s} c={c}/></div>
    <div style={{flex:"0 0 35%",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      {[100,65,35].slice(0,items.length).map((pct,i)=><div key={i} style={{position:"absolute",width:`${pct}%`,aspectRatio:"1",borderRadius:"50%",border:`2px solid ${c.primary}`,backgroundColor:i===1?c.primary:c.accent}}>
        {dp[i] && <div style={{position:"absolute",top:i===0?"8%":i===1?"30%":"35%",width:"100%",textAlign:"center",fontSize:i===0?"0.5em":"0.4em",fontWeight:700,color:"#ffffff"}}>{dp[i]}</div>}
      </div>)}
    </div>
    <div style={{flex:"0 0 30%",display:"flex",flexDirection:"column",justifyContent:"center",gap:"5%",paddingLeft:"3%"}}>
      {items.map((t,i)=><div key={i}>
        <div style={{fontSize:"0.45em",fontWeight:700,color:c.primary}}>{tiers[i]}{dp[i]?": "+dp[i]:""}</div>
        <div style={{fontSize:"0.32em",color:c.fg,lineHeight:1.3,marginTop:"2%"}}>{t}</div>
      </div>)}
    </div>
  </div>;
}

function Matrix({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,4);
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <H s={s} c={c}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2%",marginTop:"3%",flex:1}}>
      {items.map((t,i)=><div key={i} style={{backgroundColor:c.accent,borderRadius:4,padding:"4% 5%",borderLeft:`3px solid ${c.primary}`}}>
        <div style={{fontSize:"0.4em",color:"#ffffff",lineHeight:1.4}}>{t}</div>
      </div>)}
    </div>
  </div>;
}

function Timeline({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,5);
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <H s={s} c={c}/>
    <div style={{flex:1,display:"flex",alignItems:"flex-start",marginTop:"4%",position:"relative",paddingTop:"2%"}}>
      <div style={{position:"absolute",top:"calc(2% + 0.65em)",left:`${100/items.length/2}%`,right:`${100/items.length/2}%`,height:2,backgroundColor:c.accent}}/>
      {items.map((t,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
        <div style={{width:"1.3em",height:"1.3em",borderRadius:"50%",backgroundColor:c.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.4em",fontWeight:700,color:"#ffffff",zIndex:1}}>{i+1}</div>
        <div style={{fontSize:"0.35em",color:c.fg,textAlign:"center",marginTop:"5%",padding:"0 3%",lineHeight:1.3}}>{t}</div>
      </div>)}
    </div>
  </div>;
}

function IconColumns({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,3); const dp=s.dataPoints||[];
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <H s={s} c={c}/>
    {items.length>=2 && <div style={{display:"flex",gap:"2.5%",marginTop:"3%",flex:1}}>
      {items.map((t,i)=><div key={i} style={{flex:1,backgroundColor:c.accent,borderRadius:4,padding:"3% 4%",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{width:"1.5em",height:"1.5em",borderRadius:"50%",backgroundColor:c.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.4em",fontWeight:700,color:"#ffffff",marginBottom:"4%"}}>{i+1}</div>
        {dp[i] && <div style={{fontSize:"0.55em",fontWeight:700,color:"#ffffff",marginBottom:"3%"}}>{dp[i]}</div>}
        <div style={{fontSize:"0.35em",color:"#ffffff",textAlign:"center",lineHeight:1.3,opacity:0.9}}>{t}</div>
      </div>)}
    </div>}
  </div>;
}

function Team({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,3);
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <H s={s} c={c}/>
    {items.length>=1 && <div style={{display:"flex",gap:"2.5%",marginTop:"3%",flex:1}}>
      {items.map((t,i)=>{const ci=t.indexOf(":"); const title=ci>0?t.substring(0,ci):""; const desc=ci>0?t.substring(ci+1).trim():t;
        return <div key={i} style={{flex:1,backgroundColor:c.accent,borderRadius:4,padding:"4% 5%",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{width:"1.6em",height:"1.6em",borderRadius:"50%",backgroundColor:c.primary,marginBottom:"4%"}}/>
          {title && <div style={{fontSize:"0.45em",fontWeight:700,color:"#ffffff",textAlign:"center",marginBottom:"3%"}}>{title}</div>}
          <div style={{fontSize:"0.35em",color:"#ffffff",textAlign:"center",lineHeight:1.3,opacity:0.9}}>{desc}</div>
        </div>;})}
    </div>}
  </div>;
}

function Staircase({slide:s,colors:c}:{slide:SlideCanvasData;colors:C}) {
  const items=(s.bodyContent||[]).slice(0,4); const dp=s.dataPoints||[]; const n=items.length;
  return <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"5% 7%"}}>
    <H s={s} c={c}/>
    <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:"1.5%",paddingBottom:"2%",marginTop:"2%"}}>
      {items.map((t,i)=>{const pct=30+65*((i+1)/n);
        return <div key={i} style={{flex:1,height:`${pct}%`,backgroundColor:i===n-1?c.primary:c.accent,borderRadius:4,padding:"2% 3%",display:"flex",flexDirection:"column"}}>
          {dp[i] && <div style={{fontSize:"0.5em",fontWeight:700,color:"#ffffff",marginTop:"3%",textAlign:"center"}}>{dp[i]}</div>}
          <div style={{fontSize:"0.3em",color:"#ffffff",marginTop:"2%",lineHeight:1.3,textAlign:"center"}}>{t}</div>
        </div>;})}
    </div>
  </div>;
}

const RS:Record<LayoutType,React.FC<{slide:SlideCanvasData;colors:C}>> = {
  "bullets":Bullets,"statement":Statement,"data-cards":DataCards,"concentric":Concentric,
  "matrix":Matrix,"timeline":Timeline,"icon-columns":IconColumns,"team":Team,"staircase":Staircase,
};

export function SlideCanvas({slide,theme,className}:Props) {
  const c=gc(theme); const layout=resolveLayout(slide.layoutRecommendation,slide.selectedLayout);
  const R=RS[layout]||Bullets;
  return <div className={className} style={{aspectRatio:"16/9",backgroundColor:c.bg,borderRadius:4,overflow:"hidden",fontSize:"clamp(8px,1.8vw,16px)",fontFamily:"Arial,sans-serif",position:"relative"}}><R slide={slide} colors={c}/></div>;
}

// Layout picker
interface LP {current:LayoutType;onChange:(l:LayoutType)=>void;}
export function LayoutPicker({current,onChange}:LP) {
  const [open,setOpen]=useState(false); const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const label=LAYOUT_DEFINITIONS.find(d=>d.type===current)?.label||"Layout";
  return <div className="relative" ref={ref}>
    <button onClick={e=>{e.stopPropagation();setOpen(!open)}} className="text-[10px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 font-medium flex items-center gap-1 transition-colors">{label} <span className="text-[8px]">▼</span></button>
    {open && <div className="absolute left-0 top-full mt-1 w-44 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-1">
      {LAYOUT_DEFINITIONS.map(d=><button key={d.type} onClick={e=>{e.stopPropagation();onChange(d.type);setOpen(false)}} className={`w-full text-left text-xs px-3 py-1.5 hover:bg-accent transition-colors ${current===d.type?"text-electric font-medium":"text-foreground"}`}>{d.label}</button>)}
    </div>}
  </div>;
}