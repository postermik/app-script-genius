import { useState, useEffect, useRef } from "react";
import { resolveLayout, truncate, CHAR_LIMITS, type LayoutType, LAYOUT_DEFINITIONS } from "@/lib/slideLayouts";
import type { DeckTheme } from "@/components/SlidePreview";

export interface SlideCanvasData {
  headline: string; subheadline?: string; bodyContent?: string[]; categoryLabel?: string;
  closingStatement?: string; layoutRecommendation?: string; selectedLayout?: string; dataPoints?: string[];
  tiers?: { label: string; amount: string; description: string; }[];
  flywheelSteps?: { label: string; description: string; leadsTo: string; }[];
  milestones?: { amount: string; bullets: string[]; }[];
  competitors?: { name: string; description: string; x: number; y: number; }[];
  cards?: { category: string; stats: { label: string; value: string; }[]; }[];
  axisLabels?: { x: string; y: string; };
}
interface Props { slide: SlideCanvasData; theme: DeckTheme; className?: string; }

function gc(theme: DeckTheme) {
  if (theme.scheme === "light") return { bg:"#ffffff", fg:"#334155", primary:"#3b82f6", cat:"#3b82f6", head:"#1e293b", body:"#475569", sub:"#64748b", close:"#3b82f6", accent:"#e2e8f0", border:"#e2e8f0" };
  if (theme.scheme === "custom") {
    const s = theme.secondary || "#0b0f14"; const [r,g,b] = [s.slice(1,3),s.slice(3,5),s.slice(5,7)].map(h => parseInt(h,16));
    const il = (r*299+g*587+b*114)/1000 > 128;
    const txt = theme.text;
    return {
      bg:s, fg: txt || (il?"#334155":"#cbd5e1"), primary:theme.primary||"#3b82f6", cat:theme.primary||"#60a5fa",
      head: txt || (il?"#1e293b":"#e2e8f0"), body: txt ? txt+"cc" : (il?"#475569":"#cbd5e1"),
      sub: txt ? txt+"99" : (il?"#64748b":"#94a3b8"), close:theme.primary||"#60a5fa",
      accent:theme.accent||"#1e3a5f", border:il?"#e2e8f0":"#1e3a5f"
    };
  }
  return { bg:"#0b0f14", fg:"#cbd5e1", primary:"#3b82f6", cat:"#60a5fa", head:"#e2e8f0", body:"#cbd5e1", sub:"#94a3b8", close:"#60a5fa", accent:"#1e3a5f", border:"#1e3a5f" };
}
type C = ReturnType<typeof gc>;

function hSz(t: string) { return t.length <= 40 ? "1.4em" : t.length <= 60 ? "1.2em" : t.length <= 80 ? "1.05em" : "0.9em"; }

function Header({ s, c }: { s: SlideCanvasData; c: C }) {
  return <>
    {s.categoryLabel && <div style={{ fontSize:"0.5em", fontWeight:700, color:c.cat, letterSpacing:"0.15em", textTransform:"uppercase" }}>{s.categoryLabel}</div>}
    <div style={{ fontSize:hSz(s.headline), fontWeight:700, color:c.head, lineHeight:1.25, marginTop:"1%" }}>{s.headline}</div>
  </>;
}

// ── BULLETS (default, adapts spacing based on content) ──
function Bullets({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const bullets = s.bodyContent || [];
  const isCompact = bullets.length > 4;
  const isSpacious = bullets.length <= 2;
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    {s.subheadline && <div style={{ fontSize:"0.55em", color:c.sub, marginTop:"2%", lineHeight:1.4 }}>{s.subheadline}</div>}
    {bullets.length > 0 && <div style={{ marginTop:"3%", flex:1, display:"flex", flexDirection:"column", justifyContent: isSpacious ? "center" : "flex-start", gap: isCompact ? "0.3em" : "0.5em" }}>
      {bullets.slice(0, 6).map((t, i) => <div key={i} style={{ fontSize: isCompact ? "0.5em" : "0.55em", color:c.body, lineHeight: isCompact ? 1.5 : 1.7, display:"flex", gap:"0.5em" }}>
        <span style={{ color:c.primary }}>•</span><span>{t}</span>
      </div>)}
    </div>}
    {s.closingStatement && <div style={{ fontSize:"0.5em", fontWeight:600, color:c.close, marginTop:"2%" }}>{s.closingStatement}</div>}
  </div>;
}

// ── BULLETS-TWO-COLUMN ──
function BulletsTwoColumn({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const bullets = s.bodyContent || [];
  const mid = Math.ceil(bullets.length / 2);
  const left = bullets.slice(0, mid);
  const right = bullets.slice(mid);
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    {s.subheadline && <div style={{ fontSize:"0.55em", color:c.sub, marginTop:"2%", lineHeight:1.4 }}>{s.subheadline}</div>}
    {bullets.length > 0 && <div style={{ marginTop:"3%", flex:1, display:"flex", gap:"5%" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.45em" }}>
        {left.map((t, i) => <div key={i} style={{ fontSize:"0.5em", color:c.body, lineHeight:1.6, display:"flex", gap:"0.5em" }}>
          <span style={{ color:c.primary }}>•</span><span>{t}</span>
        </div>)}
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.45em" }}>
        {right.map((t, i) => <div key={i} style={{ fontSize:"0.5em", color:c.body, lineHeight:1.6, display:"flex", gap:"0.5em" }}>
          <span style={{ color:c.primary }}>•</span><span>{t}</span>
        </div>)}
      </div>
    </div>}
    {s.closingStatement && <div style={{ fontSize:"0.5em", fontWeight:600, color:c.close, marginTop:"2%" }}>{s.closingStatement}</div>}
  </div>;
}

// ── BULLETS-ACCENT (left accent bar, editorial feel) ──
function BulletsAccent({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const bullets = s.bodyContent || [];
  const isCompact = bullets.length > 4;
  return <div style={{ display:"flex", height:"100%" }}>
    <div style={{ width:"0.6%", background:c.primary, flexShrink:0 }} />
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"5% 7% 5% 5%" }}>
      <Header s={s} c={c} />
      {s.subheadline && <div style={{ fontSize:"0.55em", color:c.sub, marginTop:"2%", lineHeight:1.4 }}>{s.subheadline}</div>}
      {bullets.length > 0 && <div style={{ marginTop:"3%", flex:1, display:"flex", flexDirection:"column", gap: isCompact ? "0.3em" : "0.5em", borderLeft:`2px solid ${c.accent}`, paddingLeft:"4%" }}>
        {bullets.slice(0, 6).map((t, i) => <div key={i} style={{ fontSize: isCompact ? "0.5em" : "0.55em", color:c.body, lineHeight: isCompact ? 1.5 : 1.7 }}>{t}</div>)}
      </div>}
      {s.closingStatement && <div style={{ fontSize:"0.5em", fontWeight:600, color:c.close, marginTop:"2%", borderTop:`1px solid ${c.border}`, paddingTop:"2%" }}>{s.closingStatement}</div>}
    </div>
  </div>;
}

// ── BULLETS-NUMBERED (numbered items with prominent indices) ──
function BulletsNumbered({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const bullets = s.bodyContent || [];
  const isCompact = bullets.length > 4;
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    {s.subheadline && <div style={{ fontSize:"0.55em", color:c.sub, marginTop:"2%", lineHeight:1.4 }}>{s.subheadline}</div>}
    {bullets.length > 0 && <div style={{ marginTop:"3%", flex:1, display:"flex", flexDirection:"column", gap: isCompact ? "0.35em" : "0.55em" }}>
      {bullets.slice(0, 6).map((t, i) => <div key={i} style={{ display:"flex", gap:"0.6em", alignItems:"baseline" }}>
        <span style={{ fontSize: isCompact ? "0.6em" : "0.7em", fontWeight:700, color:c.primary, minWidth:"1.3em", textAlign:"right", lineHeight:1 }}>{String(i + 1).padStart(2, "0")}</span>
        <span style={{ fontSize: isCompact ? "0.5em" : "0.55em", color:c.body, lineHeight: isCompact ? 1.5 : 1.7 }}>{t}</span>
      </div>)}
    </div>}
    {s.closingStatement && <div style={{ fontSize:"0.5em", fontWeight:600, color:c.close, marginTop:"2%" }}>{s.closingStatement}</div>}
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
  // Use structured cards field if available, else fall back to dataPoints/bodyContent
  const structuredCards = s.cards;
  if (structuredCards && structuredCards.length > 0) {
    return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
      <Header s={s} c={c} />
      <div style={{ display:"flex", gap:"2.5%", marginTop:"3%", flex:1 }}>
        {structuredCards.map((card, i) => <div key={i} style={{ flex:1, border:`1px solid ${c.border}`, borderTop:`3px solid ${c.primary}`, borderRadius:4, padding:"3% 4%", display:"flex", flexDirection:"column" }}>
          <div style={{ fontSize:"0.48em", fontWeight:700, color:c.primary, marginBottom:"4%", borderBottom:`1px solid ${c.border}`, paddingBottom:"3%" }}>{card.category}</div>
          {card.stats.map((stat, j) => <div key={j} style={{ marginBottom:"3%" }}>
            <div style={{ fontSize:"0.4em", color:c.sub }}>{stat.label}</div>
            <div style={{ fontSize:"0.65em", fontWeight:700, color:c.head }}>{stat.value}</div>
          </div>)}
        </div>)}
      </div>
    </div>;
  }
  // Fallback to old format
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

// ── CONCENTRIC (header on top, circles + legend below) ──
function Concentric({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const tiers = s.tiers || [];
  const items = tiers.length > 0 ? tiers.map(t => t.description) : (s.bodyContent || []).slice(0, 3);
  const dp = tiers.length > 0 ? tiers.map(t => t.amount) : (s.dataPoints || []);
  const labels = tiers.length > 0 ? tiers.map(t => t.label) : ["TAM","SAM","SOM"];
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"4% 5%" }}>
    <Header s={s} c={c} />
    <div style={{ display:"flex", flex:1, marginTop:"2%" }}>
      <div style={{ flex:"0 0 55%", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
        <svg viewBox="0 0 360 340" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
          <ellipse cx="180" cy="175" rx="165" ry="165" fill={`${c.primary}0a`} stroke={`${c.primary}33`} strokeWidth="1.5" />
          <ellipse cx="180" cy="225" rx="112" ry="112" fill={`${c.primary}15`} stroke={`${c.primary}55`} strokeWidth="1.5" />
          <ellipse cx="180" cy="278" rx="58" ry="58" fill={`${c.primary}22`} stroke={`${c.primary}77`} strokeWidth="1.5" />
          <text x="180" y="55" textAnchor="middle" fill={c.head} fontSize="20" fontWeight="700" fontFamily="Arial">{dp[0] || ""}</text>
          <text x="180" y="73" textAnchor="middle" fill={c.cat} fontSize="10" fontFamily="Arial">{labels[0]}</text>
          <text x="180" y="168" textAnchor="middle" fill={c.head} fontSize="17" fontWeight="700" fontFamily="Arial">{dp[1] || ""}</text>
          <text x="180" y="185" textAnchor="middle" fill={c.cat} fontSize="10" fontFamily="Arial">{labels[1]}</text>
          <text x="180" y="275" textAnchor="middle" fill={c.head} fontSize="14" fontWeight="700" fontFamily="Arial">{dp[2] || ""}</text>
          <text x="180" y="291" textAnchor="middle" fill={c.cat} fontSize="10" fontFamily="Arial">{labels[2]}</text>
        </svg>
      </div>
      <div style={{ flex:"0 0 40%", display:"flex", flexDirection:"column", justifyContent:"center", gap:"8%", paddingLeft:"3%" }}>
        {items.map((t, i) => <div key={i}>
          <div style={{ fontSize:"0.5em", fontWeight:700, color:c.cat, marginBottom:"2%" }}>{labels[i]}</div>
          <div style={{ fontSize:"0.42em", color:c.body, lineHeight:1.4 }}>{t}</div>
        </div>)}
      </div>
    </div>
  </div>;
}

// ── MATRIX (X/Y scatter, uses competitors field if available) ──
function Matrix({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  const structuredComps = s.competitors;
  const axes = s.axisLabels || { x: "Speed + Affordability", y: "Narrative Quality" };
  // Use structured competitors if available
  const comps = structuredComps || (() => {
    const items = (s.bodyContent || []).slice(0, 6);
    const defaultPositions = [{ x: 0.18, y: 0.85 }, { x: 0.68, y: 0.35 }, { x: 0.42, y: 0.45 }, { x: 0.28, y: 0.28 }, { x: 0.55, y: 0.6 }];
    return items.map((t, i) => {
      const ci2 = t.indexOf(":"); const isLast = i === items.length - 1;
      return { name: ci2 > 0 ? t.substring(0, ci2).trim() : t.substring(0, 25), description: ci2 > 0 ? t.substring(ci2 + 1).trim() : "", x: isLast ? 0.8 : (defaultPositions[i]?.x || 0.5), y: isLast ? 0.9 : (defaultPositions[i]?.y || 0.5) };
    });
  })();
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"5% 7%" }}>
    <Header s={s} c={c} />
    <div style={{ flex:1, marginTop:"2.5%" }}>
      <svg viewBox="0 0 800 340" width="100%" height="100%" fontFamily="Arial">
        <line x1="80" y1="20" x2="80" y2="320" stroke={c.border} strokeWidth="1" />
        <text x="35" y="170" textAnchor="middle" fill={c.sub} fontSize="11" transform="rotate(-90,35,170)">{axes.y}</text>
        <line x1="80" y1="320" x2="780" y2="320" stroke={c.border} strokeWidth="1" />
        <text x="430" y="338" textAnchor="middle" fill={c.sub} fontSize="11">{axes.x}</text>
        <line x1="80" y1="170" x2="780" y2="170" stroke={c.accent} strokeWidth="0.5" strokeDasharray="4" />
        <line x1="430" y1="20" x2="430" y2="320" stroke={c.accent} strokeWidth="0.5" strokeDasharray="4" />
        {comps.slice(0, -1).map((comp, i) => {
          const px = 80 + comp.x * 700; const py = 320 - comp.y * 300;
          return <g key={i}>
            <circle cx={px} cy={py} r="7" fill={c.sub} opacity="0.5" />
            <text x={px + 14} y={py - 3} fill={c.body} fontSize="10" fontWeight="600">{comp.name}</text>
            {comp.description && <text x={px + 14} y={py + 10} fill={c.sub} fontSize="8">{comp.description.substring(0, 45)}</text>}
          </g>;
        })}
        {comps.length > 0 && (() => {
          const last = comps[comps.length - 1];
          const px = 80 + last.x * 700; const py = 320 - last.y * 300;
          return <g>
            <circle cx={px} cy={py} r="11" fill={c.primary} opacity="0.9" />
            <circle cx={px} cy={py} r="17" fill="none" stroke={c.primary} strokeWidth="1.5" opacity="0.4" />
            <text x={px} y={py - 18} textAnchor="middle" fill={c.head} fontSize="12" fontWeight="700">{last.name}</text>
            {last.description && <text x={px + 18} y={py + 4} fill={c.cat} fontSize="9">{last.description.substring(0, 40)}</text>}
          </g>;
        })()}
      </svg>
    </div>
  </div>;
}

// ── FLYWHEEL (uses flywheelSteps field if available) ──
function Flywheel({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  // Use structured flywheelSteps if available, else parse bodyContent
  const steps = s.flywheelSteps || (s.bodyContent || []).slice(0, 6).map(t => {
    const ci2 = t.indexOf(":"); return { label: ci2 > 0 ? t.substring(0, ci2).trim() : t.substring(0, 30), description: ci2 > 0 ? t.substring(ci2 + 1).trim() : "", leadsTo: "" };
  });
  const n = steps.length;
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
          const step = steps[i];
          const tx = fcx + (fr + 70) * Math.cos(nd.a * Math.PI / 180);
          const ty = fcy + (fr + 50) * Math.sin(nd.a * Math.PI / 180);
          const isTop = nd.a === -90;
          const anchor = nd.a > -45 && nd.a < 45 ? "start" : nd.a > 135 || nd.a < -135 ? "end" : "middle";
          return <g key={`n${i}`}>
            <circle cx={nd.x} cy={nd.y} r={14} fill={c.primary} />
            <text x={nd.x} y={nd.y + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">{i + 1}</text>
            <text x={tx} y={isTop ? ty - 6 : ty} textAnchor={anchor} fill={c.head} fontSize="11" fontWeight="600">{step.label}</text>
            {step.description && <text x={tx} y={isTop ? ty + 7 : ty + 13} textAnchor={anchor} fill={c.sub} fontSize="9">{step.description.substring(0, 45)}</text>}
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

// ── STAIRCASE (uses milestones field if available) ──
function Staircase({ slide: s, colors: c }: { slide: SlideCanvasData; colors: C }) {
  // Use structured milestones if available
  const ms = s.milestones || (s.bodyContent || []).slice(0, 4).map((t, i) => ({
    amount: (s.dataPoints || [])[i] || "",
    bullets: t.split(/[,;]/).map(b => b.trim()).filter(Boolean).slice(0, 3),
  }));
  const n = ms.length;
  const pcts = [30, 50, 70, 90];
  return <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"4.5% 6%" }}>
    <Header s={s} c={c} />
    <div style={{ flex:1, marginTop:"1.5%" }}>
      <svg viewBox="0 0 800 340" width="100%" height="100%" fontFamily="Arial" preserveAspectRatio="xMidYMax meet">
        <defs>{ms.map((m, i) => {
          const h = (pcts[i] || 90) / 100 * 310; const y = 340 - h;
          const w = (780 - 12 * (n - 1)) / n; const x = 10 + i * (w + 12);
          return <clipPath key={`cp${i}`} id={`stair-clip-${i}`}><rect x={x} y={y} width={w} height={h} /></clipPath>;
        })}</defs>
        {ms.map((m, i) => {
          const h = (pcts[i] || 90) / 100 * 310; const y = 340 - h;
          const w = (780 - 12 * (n - 1)) / n; const x = 10 + i * (w + 12);
          const isLast = i === n - 1;
          const maxChars = Math.floor((w - 30) / 5);
          const maxBullets = Math.min(m.bullets.length, Math.floor((h - (m.amount ? 50 : 25)) / 14));
          return <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="3" fill={isLast ? `${c.primary}12` : "none"} stroke={isLast ? c.primary : c.border} strokeWidth={isLast ? 1.5 : 1} />
            <g clipPath={`url(#stair-clip-${i})`}>
              {m.amount && <text x={x + w / 2} y={y + 22} textAnchor="middle" fill={isLast ? c.primary : c.head} fontSize="16" fontWeight="700">{m.amount}</text>}
              {m.bullets.slice(0, maxBullets).map((b, bi) => <g key={bi}>
                <text x={x + 10} y={y + (m.amount ? 40 : 18) + bi * 14} fill={c.primary} fontSize="7">•</text>
                <text x={x + 18} y={y + (m.amount ? 40 : 18) + bi * 14} fill={c.sub} fontSize="8">{b.length > maxChars ? b.substring(0, maxChars) + "..." : b}</text>
              </g>)}
            </g>
          </g>;
        })}
      </svg>
    </div>
  </div>;
}

const RS: Record<LayoutType, React.FC<{ slide: SlideCanvasData; colors: C }>> = {
  "bullets": Bullets, "bullets-two-column": BulletsTwoColumn, "bullets-accent": BulletsAccent, "bullets-numbered": BulletsNumbered,
  "statement": Statement, "data-cards": DataCards, "concentric": Concentric,
  "matrix": Matrix, "flywheel": Flywheel, "icon-columns": IconColumns, "team": Team, "staircase": Staircase,
};

export function SlideCanvas({ slide, theme, className }: Props) {
  const c = gc(theme); const layout = resolveLayout(slide.layoutRecommendation, slide.selectedLayout, slide.categoryLabel, slide.dataPoints);
  const R = RS[layout] || Bullets;
  return <div className={className} style={{ aspectRatio:"16/9", backgroundColor:c.bg, borderRadius:4, overflow:"hidden", fontSize:"clamp(10px,2.2vw,20px)", fontFamily:"Arial,sans-serif", position:"relative" }}><R slide={slide} colors={c} /></div>;
}

// Layout picker (shows only top-level types, hides sub-variants)
interface LP { current: LayoutType; onChange: (l: LayoutType) => void; }
export function LayoutPicker({ current, onChange }: LP) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const topLevel = LAYOUT_DEFINITIONS.filter(d => !d.parent);
  // Show the parent label if current is a sub-variant
  const currentDef = LAYOUT_DEFINITIONS.find(d => d.type === current);
  const displayLabel = currentDef?.parent
    ? `${LAYOUT_DEFINITIONS.find(d => d.type === currentDef.parent)?.label || "Layout"} / ${currentDef.label}`
    : currentDef?.label || "Layout";
  return <div className="relative" ref={ref}>
    <button onClick={e => { e.stopPropagation(); setOpen(!open) }} className="text-[10px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 font-medium flex items-center gap-1 transition-colors">{displayLabel} <span className="text-[8px]">▼</span></button>
    {open && <div className="absolute left-0 top-full mt-1 w-44 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-1">
      {topLevel.map(d => <button key={d.type} onClick={e => { e.stopPropagation(); onChange(d.type); setOpen(false) }} className={`w-full text-left text-xs px-3 py-1.5 hover:bg-accent transition-colors ${current === d.type || currentDef?.parent === d.type ? "text-electric font-medium" : "text-foreground"}`}>{d.label}</button>)}
    </div>}
  </div>;
}