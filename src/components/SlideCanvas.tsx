import { useState, useEffect, useRef } from "react";
import { resolveLayout, truncate, CHAR_LIMITS, type LayoutType, LAYOUT_DEFINITIONS } from "@/lib/slideLayouts";
import type { DeckTheme } from "@/components/SlidePreview";

export interface SlideCanvasData {
  headline: string; subheadline?: string; bodyContent?: string[]; categoryLabel?: string;
  closingStatement?: string; layoutRecommendation?: string; selectedLayout?: string; dataPoints?: string[];
}
interface Props { slide: SlideCanvasData; theme: DeckTheme; className?: string; }

function gc(theme: DeckTheme) {
  if (theme.scheme === "light") return { bg:"#ffffff", fg:"#334155", primary:"#3b82f6", cat:"#3b82f6", head:"#1e293b", body:"#475569", sub:"#64748b", close:"#3b82f6", accent:"#e2e8f0", border:"#e2e8f0" };
  if (theme.scheme === "custom") {
    const s = theme.secondary || "#0b0f14"; const [r,g,b] = [s.slice(1,3),s.slice(3,5),s.slice(5,7)].map(h => parseInt(h,16));
    const il = (r*299+g*587+b*114)/1000 > 128;
    return { bg:s, fg:il?"#334155":"#cbd5e1", primary:theme.primary||"#3b82f6", cat:theme.primary||"#60a5fa", head:il?"#1e293b":"#e2e8f0", body:il?"#475569":"#cbd5e1", sub:il?"#64748b":"#94a3b8", close:theme.primary||"#60a5fa", accent:theme.accent||"#1e3a5f", border:il?"#e2e8f0":"#1e3a5f" };
  }
  return { bg:"#0b0f14", fg:"#cbd5e1", primary:"#3b82f6", cat:"#60a5fa", head:"#e2e8f0", body:"#cbd5e1", sub:"#94a3b8", close:"#60a5fa", accent:"#1e3a5f", border:"#1e3a5f" };
}
type C = ReturnType<typeof gc>;

function hSz(t: string) { return t.length <= 40 ? "1.15em" : t.length <= 60 ? "1em" : t.length <= 80 ? "0.88em" : "0.78em"; }

function Header({ s, c }: { s: SlideCanvasData; c: C }) {
  return <>
    {s.categoryLabel && <div style={{ fontSize:"0.42em", fontWeight:700, color:c.cat, letterSpacing:"0.15em", textTransform:"uppercase" }}>{s.categoryLabel}</div>}
    <div style={{ fontSize:hSz(s.headline), fontWeight:700, color:c.head, lineHeight:1.25, marginTop:"1%" }}>{s.headline}</div>
  </>;
}

// ── BULLETS (default) ──
function Bullets({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    {s.subheadline && <div style={{ fontSize:"0.52em", color:c.sub, marginTop:"2%", lineHeight:1.4 }}>{s.subheadline}</div>}
    {s.bodyContent && s.bodyContent.length > 0 && <div style={{ marginTop:"3%", flex:1 }}>
      {s.bodyContent.slice(0, 6).map((t, i) => <div key={i} style={{ fontSize:"0.48em", color:c.body, lineHeight:1.7, display:"flex", gap:"0.5em" }}>
        <span style={{ color:c.primary }}>•</span><span>{t}</span>
      </div>)}
    </div>}
    {s.closingStatement && <div style={{ fontSize:"0.46em", fontWeight:600, color:c.close, marginTop:"2%" }}>{s.closingStatement}</div>}
  </div>;
}

// ── STATEMENT ──
function Statement({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  return <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
    <div style={{ height:"0.8%", background:c.primary }} />
    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"7%" }}>
      <Header s={s} c={c} />
      {s.subheadline && <div style={{ fontSize:"0.55em", color:c.sub, marginTop:"3%", maxWidth:"75%", lineHeight:1.4 }}>{s.subheadline}</div>}
    </div>
    {s.closingStatement && <div style={{ background:c.accent, padding:"2.5% 7%", borderTop:`2px solid ${c.primary}` }}>
      <div style={{ fontSize:"0.48em", fontWeight:600, color:c.head }}>{s.closingStatement}</div>
    </div>}
  </div>;
}

// ── DATA-CARDS ──
function DataCards({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const dp = s.dataPoints || []; const items = (s.bodyContent || []).slice(0, 3);
  const n = Math.max(dp.length, Math.min(items.length, 3));
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    {n > 0 && <div style={{ display:"flex", gap:"2.5%", marginTop:"3%", flex:1 }}>
      {Array.from({ length: n }).map((_, i) => <div key={i} style={{ flex:1, border:`1px solid ${c.border}`, borderTop:`3px solid ${c.primary}`, borderRadius:4, padding:"3.5% 4%", display:"flex", flexDirection:"column" }}>
        {dp[i] && <div style={{ fontSize:"0.85em", fontWeight:700, color:c.head, marginBottom:"4%" }}>{dp[i]}</div>}
        {items[i] && <div style={{ fontSize:"0.42em", color:c.body, lineHeight:1.5 }}>{items[i]}</div>}
      </div>)}
    </div>}
  </div>;
}

// ── CONCENTRIC (simplified: circles left, bullets right) ──
function Concentric({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const items = (s.bodyContent || []).slice(0, 3); const dp = s.dataPoints || [];
  return <div style={{ display:"flex", height:"100%", padding:"4% 4%" }}>
    <div style={{ flex:"0 0 22%", paddingTop:"1%" }}><Header s={s} c={c} /></div>
    <div style={{ flex:"0 0 42%", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <svg viewBox="0 0 360 380" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
        {/* Bottom-aligned: all circles share bottom at y=380 */}
        <ellipse cx="180" cy="195" rx="175" ry="175" fill={`${c.primary}0a`} stroke={`${c.primary}33`} strokeWidth="1.5" />
        <ellipse cx="180" cy="255" rx="120" ry="120" fill={`${c.primary}15`} stroke={`${c.primary}55`} strokeWidth="1.5" />
        <ellipse cx="180" cy="315" rx="62" ry="62" fill={`${c.primary}22`} stroke={`${c.primary}77`} strokeWidth="1.5" />
        {/* Labels centered between ring tops */}
        {/* TAM: between outer top (20) and middle top (135) = 77 */}
        <text x="180" y="72" textAnchor="middle" fill={c.head} fontSize="20" fontWeight="700" fontFamily="Arial">{dp[0] || ""}</text>
        <text x="180" y="90" textAnchor="middle" fill={c.cat} fontSize="10" fontFamily="Arial">TAM</text>
        {/* SAM: between middle top (135) and inner top (253) = 194 */}
        <text x="180" y="189" textAnchor="middle" fill={c.head} fontSize="17" fontWeight="700" fontFamily="Arial">{dp[1] || ""}</text>
        <text x="180" y="206" textAnchor="middle" fill={c.cat} fontSize="10" fontFamily="Arial">SAM</text>
        {/* SOM: center of inner (253 to 377) = 315 */}
        <text x="180" y="310" textAnchor="middle" fill={c.head} fontSize="14" fontWeight="700" fontFamily="Arial">{dp[2] || ""}</text>
        <text x="180" y="326" textAnchor="middle" fill={c.cat} fontSize="10" fontFamily="Arial">SOM</text>
      </svg>
    </div>
    <div style={{ flex:"0 0 32%", display:"flex", flexDirection:"column", justifyContent:"center", gap:"8%", paddingLeft:"3%" }}>
      {items.map((t, i) => <div key={i}>
        <div style={{ fontSize:"0.42em", fontWeight:700, color:c.cat, marginBottom:"2%" }}>{["TAM","SAM","SOM"][i]}: {dp[i] || ""}</div>
        <div style={{ fontSize:"0.38em", color:c.body, lineHeight:1.4 }}>{t}</div>
      </div>)}
    </div>
  </div>;
}

// ── MATRIX (X/Y scatter) ──
function Matrix({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const items = (s.bodyContent || []).slice(0, 6);
  const positions = [{ x: 18, y: 15 }, { x: 68, y: 65 }, { x: 42, y: 55 }, { x: 28, y: 72 }, { x: 55, y: 40 }];
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    <div style={{ flex:1, marginTop:"2.5%" }}>
      <svg viewBox="0 0 800 340" width="100%" height="100%" fontFamily="Arial">
        <line x1="80" y1="20" x2="80" y2="320" stroke={c.border} strokeWidth="1" />
        <text x="35" y="170" textAnchor="middle" fill={c.sub} fontSize="11" transform="rotate(-90,35,170)">Narrative Quality</text>
        <line x1="80" y1="320" x2="780" y2="320" stroke={c.border} strokeWidth="1" />
        <text x="430" y="338" textAnchor="middle" fill={c.sub} fontSize="11">Speed + Affordability</text>
        <line x1="80" y1="170" x2="780" y2="170" stroke={c.accent} strokeWidth="0.5" strokeDasharray="4" />
        <line x1="430" y1="20" x2="430" y2="320" stroke={c.accent} strokeWidth="0.5" strokeDasharray="4" />
        {items.slice(0, -1).map((t, i) => {
          const pos = positions[i] || { x: 50, y: 50 };
          const px = 80 + pos.x / 100 * 700; const py = 20 + pos.y / 100 * 300;
          const ci2 = t.indexOf(":"); const name = ci2 > 0 ? t.substring(0, ci2).trim() : t.substring(0, 25);
          const desc = ci2 > 0 ? t.substring(ci2 + 1).trim() : "";
          return <g key={i}>
            <circle cx={px} cy={py} r="7" fill={c.sub} opacity="0.5" />
            <text x={px + 14} y={py - 3} fill={c.body} fontSize="10" fontWeight="600">{name}</text>
            {desc && <text x={px + 14} y={py + 10} fill={c.sub} fontSize="8">{desc.substring(0, 45)}</text>}
          </g>;
        })}
        {items.length > 0 && (() => {
          const last = items[items.length - 1]; const ci3 = last.indexOf(":");
          const name2 = ci3 > 0 ? last.substring(0, ci3).trim() : last.substring(0, 25);
          const desc2 = ci3 > 0 ? last.substring(ci3 + 1).trim() : "";
          return <g>
            <circle cx="660" cy="55" r="11" fill={c.primary} opacity="0.9" />
            <circle cx="660" cy="55" r="17" fill="none" stroke={c.primary} strokeWidth="1.5" opacity="0.4" />
            <text x="660" y="35" textAnchor="middle" fill={c.head} fontSize="12" fontWeight="700">{name2}</text>
            {desc2 && <text x="682" y="58" fill={c.cat} fontSize="9">{desc2.substring(0, 40)}</text>}
          </g>;
        })()}
      </svg>
    </div>
  </div>;
}

// ── FLYWHEEL ──
function Flywheel({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const items = (s.bodyContent || []).slice(0, 6); const n = items.length;
  if (n < 3) return <Bullets slide={s} colors={c} />;
  const fcx = 410, fcy = 148, fr = 90;
  const angles = n === 3 ? [-90, 30, 150] : n === 4 ? [-90, 0, 90, 180] : n === 5 ? [-90, -18, 54, 126, 198] : [-90, -30, 30, 90, 150, 210];
  const nodes = angles.map(a => { const rad = a * Math.PI / 180; return { x: fcx + fr * Math.cos(rad), y: fcy + fr * Math.sin(rad), a }; });
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"4.5% 6%" }}>
    <Header s={s} c={c} />
    <div style={{ flex:1, marginTop:"1%" }}>
      <svg viewBox="0 0 820 280" width="100%" height="100%" fontFamily="Arial">
        {nodes.map((nd, i) => {
          const next = nodes[(i + 1) % n];
          const dx = next.x - nd.x; const dy = next.y - nd.y; const dist = Math.sqrt(dx * dx + dy * dy);
          const sx = nd.x + dx / dist * 18; const sy = nd.y + dy / dist * 18;
          const ex = next.x - dx / dist * 18; const ey = next.y - dy / dist * 18;
          return <g key={`a${i}`}>
            <path d={`M${sx},${sy} A${fr},${fr} 0 0,1 ${ex},${ey}`} fill="none" stroke={c.accent} strokeWidth="2.5" />
            <polygon points={`${ex},${ey} ${ex - 8 * dy / dist - 4 * dx / dist},${ey + 8 * dx / dist - 4 * dy / dist} ${ex + 8 * dy / dist - 4 * dx / dist},${ey - 8 * dx / dist - 4 * dy / dist}`} fill={c.primary} />
          </g>;
        })}
        {nodes.map((nd, i) => {
          const item = items[i]; const ci2 = item.indexOf(":");
          const title = ci2 > 0 ? item.substring(0, ci2).trim() : item.substring(0, 30);
          const desc = ci2 > 0 ? item.substring(ci2 + 1).trim() : "";
          const tx = fcx + (fr + 70) * Math.cos(nd.a * Math.PI / 180);
          const ty = fcy + (fr + 50) * Math.sin(nd.a * Math.PI / 180);
          const isTop = nd.a === -90; const isBottom = nd.a === 90 || nd.a === 180;
          const anchor = nd.a > -45 && nd.a < 45 ? "start" : nd.a > 135 || nd.a < -135 ? "end" : "middle";
          return <g key={`n${i}`}>
            <circle cx={nd.x} cy={nd.y} r={14} fill={c.primary} />
            <text x={nd.x} y={nd.y + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">{i + 1}</text>
            <text x={tx} y={isTop ? ty - 6 : ty} textAnchor={anchor} fill={c.head} fontSize="11" fontWeight="600">{title}</text>
            {desc && <text x={tx} y={isTop ? ty + 7 : ty + 13} textAnchor={anchor} fill={c.sub} fontSize="9">{desc.substring(0, 45)}</text>}
          </g>;
        })}
      </svg>
    </div>
  </div>;
}

// ── ICON COLUMNS ──
function IconColumns({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const items = (s.bodyContent || []).slice(0, 3); const dp = s.dataPoints || [];
  const icons = [
    <svg key="ic1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /></svg>,
    <svg key="ic2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
    <svg key="ic3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></svg>,
  ];
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    {items.length >= 2 && <div style={{ display:"flex", gap:"2.5%", marginTop:"3%", flex:1 }}>
      {items.map((t, i) => <div key={i} style={{ flex:1, border:`1px solid ${c.border}`, borderRadius:4, padding:"4%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:"2.2em", height:"2.2em", borderRadius:"50%", border:`2px solid ${c.primary}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"5%" }}>{icons[i % 3]}</div>
        {dp[i] && <div style={{ fontSize:"0.6em", fontWeight:700, color:c.head, marginBottom:"3%" }}>{dp[i]}</div>}
        <div style={{ fontSize:"0.42em", color:c.body, textAlign:"center", lineHeight:1.4 }}>{t}</div>
      </div>)}
    </div>}
  </div>;
}

// ── TEAM ──
function Team({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const items = (s.bodyContent || []).slice(0, 4);
  const icons = [
    <svg key="t1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0112 0v1" /></svg>,
    <svg key="t2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
    <svg key="t3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    <svg key="t4" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>,
  ];
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    {items.length >= 1 && <div style={{ display:"flex", gap:"2.5%", marginTop:"3%", flex:1 }}>
      {items.map((t, i) => { const ci2 = t.indexOf(":"); const title = ci2 > 0 ? t.substring(0, ci2) : ""; const desc = ci2 > 0 ? t.substring(ci2 + 1).trim() : t;
        return <div key={i} style={{ flex:1, border:`1px solid ${c.border}`, borderRadius:4, padding:"4%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:"2.2em", height:"2.2em", borderRadius:"50%", border:`2px solid ${c.primary}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"5%" }}>{icons[i % 4]}</div>
          {title && <div style={{ fontSize:"0.52em", fontWeight:700, color:c.head, textAlign:"center", marginBottom:"3%" }}>{title}</div>}
          <div style={{ fontSize:"0.42em", color:c.body, textAlign:"center", lineHeight:1.4 }}>{desc}</div>
        </div>;
      })}
    </div>}
  </div>;
}

// ── STAIRCASE ──
function Staircase({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const items = (s.bodyContent || []).slice(0, 4); const dp = s.dataPoints || []; const n = items.length;
  const pcts = [30, 50, 70, 90];
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"4.5% 6%" }}>
    <Header s={s} c={c} />
    <div style={{ flex:1, marginTop:"1.5%" }}>
      <svg viewBox="0 0 800 340" width="100%" height="100%" fontFamily="Arial" preserveAspectRatio="xMidYMax meet">
        {items.map((t, i) => {
          const h = pcts[i] / 100 * 310; const y = 340 - h;
          const w = (780 - 12 * (n - 1)) / n; const x = 10 + i * (w + 12);
          const isLast = i === n - 1;
          const bullets = t.split(/[,;]/).map(b => b.trim()).filter(Boolean).slice(0, 3);
          return <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="3" fill={isLast ? `${c.primary}12` : "none"} stroke={isLast ? c.primary : c.border} strokeWidth={isLast ? 1.5 : 1} />
            {dp[i] && <text x={x + w / 2} y={y + 22} textAnchor="middle" fill={isLast ? c.primary : c.head} fontSize="16" fontWeight="700">{dp[i]}</text>}
            {bullets.map((b, bi) => <g key={bi}>
              <text x={x + 14} y={y + (dp[i] ? 42 : 22) + bi * 15} fill={c.primary} fontSize="8">•</text>
              <text x={x + 22} y={y + (dp[i] ? 42 : 22) + bi * 15} fill={c.sub} fontSize="9">{b}</text>
            </g>)}
          </g>;
        })}
        {/* Growth arrow above bars */}
        <polyline points={items.map((_, i) => { const w = (780 - 12 * (n - 1)) / n; const x = 10 + i * (w + 12) + w / 2; const y = 340 - pcts[i] / 100 * 310 - 10; return `${x},${y}`; }).join(" ")}
          fill="none" stroke={c.primary} strokeWidth="2" strokeDasharray="5,4" />
        {(() => { const w = (780 - 12 * (n - 1)) / n; const lx = 10 + (n - 1) * (w + 12) + w / 2 + 15; const ly = 340 - pcts[n - 1] / 100 * 310 - 18;
          return <polygon points={`${lx},${ly} ${lx - 10},${ly + 3} ${lx - 7},${ly - 7}`} fill={c.primary} />;
        })()}
      </svg>
    </div>
  </div>;
}

const RS: Record<LayoutType, React.FC<{ slide: SlideCanvasData; colors: C }>> = {
  "bullets": Bullets, "statement": Statement, "data-cards": DataCards, "concentric": Concentric,
  "matrix": Matrix, "flywheel": Flywheel, "icon-columns": IconColumns, "team": Team, "staircase": Staircase,
};

export function SlideCanvas({ slide, theme, className }: Props) {
  const c = gc(theme); const layout = resolveLayout(slide.layoutRecommendation, slide.selectedLayout, slide.categoryLabel, slide.dataPoints);
  const R = RS[layout] || Bullets;
  return <div className={className} style={{ aspectRatio:"16/9", backgroundColor:c.bg, borderRadius:4, overflow:"hidden", fontSize:"clamp(8px,1.8vw,16px)", fontFamily:"Arial,sans-serif", position:"relative" }}><R slide={slide} colors={c} /></div>;
}

// Layout picker
interface LP { current: LayoutType; onChange: (l: LayoutType) => void; }
export function LayoutPicker({ current, onChange }: LP) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const label = LAYOUT_DEFINITIONS.find(d => d.type === current)?.label || "Layout";
  return <div className="relative" ref={ref}>
    <button onClick={e => { e.stopPropagation(); setOpen(!open) }} className="text-[10px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 font-medium flex items-center gap-1 transition-colors">{label} <span className="text-[8px]">▼</span></button>
    {open && <div className="absolute left-0 top-full mt-1 w-44 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-1">
      {LAYOUT_DEFINITIONS.map(d => <button key={d.type} onClick={e => { e.stopPropagation(); onChange(d.type); setOpen(false) }} className={`w-full text-left text-xs px-3 py-1.5 hover:bg-accent transition-colors ${current === d.type ? "text-electric font-medium" : "text-foreground"}`}>{d.label}</button>)}
    </div>}
  </div>;
}