import { useState, useEffect, useRef } from "react";
import { resolveLayout, truncate, CHAR_LIMITS, type LayoutType, LAYOUT_DEFINITIONS } from "@/lib/slideLayouts";
import type { DeckTheme } from "@/components/SlidePreview";

export interface SlideCanvasData {
  headline: string;
  subheadline?: string;
  bodyContent?: string[];
  categoryLabel?: string;
  closingStatement?: string;
  layoutRecommendation?: string;
  selectedLayout?: string;
  dataPoints?: string[];
}

interface Props {
  slide: SlideCanvasData;
  theme: DeckTheme;
  className?: string;
}

function getColors(theme: DeckTheme) {
  if (theme.scheme === "light") return { bg: "#ffffff", fg: "#1a1a2e", primary: "#3b82f6", muted: "#6b7280", mutedText: "#9ca3af", accent: "#3b82f6" };
  if (theme.scheme === "custom") {
    const sec = theme.secondary || "#0b0f14";
    const [r, g, b] = [sec.slice(1,3), sec.slice(3,5), sec.slice(5,7)].map(h => parseInt(h, 16));
    const bright = (r * 299 + g * 587 + b * 114) / 1000;
    return { bg: sec, fg: bright > 128 ? "#1a1a2e" : "#dce0e8", primary: theme.primary || "#3b82f6", muted: "#6b7280", mutedText: "#9ca3af", accent: theme.accent || "#1e3a5f" };
  }
  return { bg: "#0b0f14", fg: "#dce0e8", primary: "#3b82f6", muted: "#6b7280", mutedText: "#9ca3af", accent: "#3b82f6" };
}

function onAccent(c: ReturnType<typeof getColors>) { return c.bg === "#ffffff" ? "#ffffff" : c.bg; }
function hSize(t: string) { return t.length <= 50 ? "1.15em" : t.length <= 70 ? "1em" : t.length <= 90 ? "0.9em" : "0.8em"; }

// ── BULLETS ──
function Bullets({ slide: s, colors: c }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {s.categoryLabel && <div style={{ fontSize: "0.42em", fontWeight: 700, color: c.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{s.categoryLabel}</div>}
      <div style={{ fontSize: hSize(s.headline), fontWeight: 700, color: c.primary, lineHeight: 1.2, marginTop: "2%" }}>{truncate(s.headline, CHAR_LIMITS.HEADLINE_MAX)}</div>
      {s.subheadline && <div style={{ fontSize: "0.6em", color: c.mutedText, marginTop: "3%", lineHeight: 1.3 }}>{truncate(s.subheadline, CHAR_LIMITS.SUBHEADLINE_MAX)}</div>}
      {s.bodyContent && s.bodyContent.length > 0 && (
        <div style={{ marginTop: "4%", flex: 1 }}>
          {s.bodyContent.slice(0, 6).map((item, i) => (
            <div key={i} style={{ fontSize: "0.52em", color: c.fg, lineHeight: 1.5, display: "flex", gap: "0.5em", marginBottom: "0.3em" }}>
              <span style={{ color: c.accent }}>•</span><span>{truncate(item, CHAR_LIMITS.BULLET_MAX)}</span>
            </div>
          ))}
        </div>
      )}
      {s.closingStatement && <div style={{ fontSize: "0.48em", fontWeight: 700, color: c.accent, marginTop: "auto" }}>{truncate(s.closingStatement, CHAR_LIMITS.CLOSING_MAX)}</div>}
    </div>
  );
}

// ── STATEMENT ──
function Statement({ slide: s, colors: c }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1%", backgroundColor: c.accent }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "8%" }}>
        {s.categoryLabel && <div style={{ fontSize: "0.48em", fontWeight: 700, color: c.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4%" }}>{s.categoryLabel}</div>}
        <div style={{ fontSize: s.headline.length > 60 ? "1.15em" : "1.3em", fontWeight: 700, color: c.primary, lineHeight: 1.2 }}>{truncate(s.headline, CHAR_LIMITS.HEADLINE_MAX)}</div>
        {s.subheadline && <div style={{ fontSize: "0.6em", color: c.mutedText, marginTop: "4%", maxWidth: "75%", lineHeight: 1.3 }}>{truncate(s.subheadline, CHAR_LIMITS.SUBHEADLINE_MAX)}</div>}
      </div>
      {s.closingStatement && (
        <div style={{ backgroundColor: c.accent, padding: "3% 8%" }}>
          <div style={{ fontSize: "0.55em", fontWeight: 700, color: onAccent(c) }}>{truncate(s.closingStatement, CHAR_LIMITS.CLOSING_MAX)}</div>
        </div>
      )}
    </div>
  );
}

// ── CARDS (merged with data-callout) ──
function Cards({ slide: s, colors: c }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  const items = (s.bodyContent || []).slice(0, 3);
  const dp = s.dataPoints || [];
  const hasStats = dp.length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {s.categoryLabel && <div style={{ fontSize: "0.42em", fontWeight: 700, color: c.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{s.categoryLabel}</div>}
      <div style={{ fontSize: hSize(s.headline), fontWeight: 700, color: c.primary, lineHeight: 1.2, marginTop: "2%" }}>{truncate(s.headline, CHAR_LIMITS.HEADLINE_MAX)}</div>
      {items.length >= 2 && (
        <div style={{ display: "flex", gap: "3%", marginTop: "5%", flex: 1 }}>
          {items.map((item, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: c.accent, borderRadius: 4, borderTop: `3px solid ${c.primary}`, padding: "4% 5%", display: "flex", flexDirection: "column" }}>
              {dp[i] && <div style={{ fontSize: hasStats ? "1.4em" : "1.1em", fontWeight: 700, color: onAccent(c), lineHeight: 1.1, marginBottom: "6%" }}>{dp[i]}</div>}
              <div style={{ fontSize: "0.45em", color: onAccent(c), lineHeight: 1.4, opacity: 0.9 }}>{truncate(item, 100)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MATRIX ──
function Matrix({ slide: s, colors: c }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  const items = (s.bodyContent || []).slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {s.categoryLabel && <div style={{ fontSize: "0.42em", fontWeight: 700, color: c.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{s.categoryLabel}</div>}
      <div style={{ fontSize: hSize(s.headline), fontWeight: 700, color: c.primary, lineHeight: 1.2, marginTop: "2%" }}>{truncate(s.headline, CHAR_LIMITS.HEADLINE_MAX)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5%", marginTop: "4%", flex: 1 }}>
        {items.map((item, i) => (
          <div key={i} style={{ backgroundColor: c.accent, borderRadius: 4, padding: "5% 6%", borderLeft: `3px solid ${c.primary}` }}>
            <div style={{ fontSize: "0.48em", color: onAccent(c), lineHeight: 1.4 }}>{truncate(item, 120)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TIMELINE ──
function Timeline({ slide: s, colors: c }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  const items = (s.bodyContent || []).slice(0, 5);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {s.categoryLabel && <div style={{ fontSize: "0.42em", fontWeight: 700, color: c.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{s.categoryLabel}</div>}
      <div style={{ fontSize: hSize(s.headline), fontWeight: 700, color: c.primary, lineHeight: 1.2, marginTop: "2%" }}>{truncate(s.headline, CHAR_LIMITS.HEADLINE_MAX)}</div>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", marginTop: "6%", position: "relative" }}>
        <div style={{ position: "absolute", top: "0.8em", left: `${100 / items.length / 2}%`, right: `${100 / items.length / 2}%`, height: 2, backgroundColor: c.accent }} />
        {items.map((item, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div style={{ width: "1.6em", height: "1.6em", borderRadius: "50%", backgroundColor: c.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48em", fontWeight: 700, color: onAccent(c), zIndex: 1 }}>{i + 1}</div>
            <div style={{ fontSize: "0.42em", color: c.fg, textAlign: "center", marginTop: "8%", padding: "0 4%", lineHeight: 1.3 }}>{truncate(item, 80)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TWO COLUMN ──
function TwoColumn({ slide: s, colors: c }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  return (
    <div style={{ display: "flex", height: "100%", padding: "6% 8%", gap: "5%" }}>
      <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column" }}>
        {s.categoryLabel && <div style={{ fontSize: "0.42em", fontWeight: 700, color: c.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>{s.categoryLabel}</div>}
        <div style={{ fontSize: hSize(s.headline), fontWeight: 700, color: c.primary, lineHeight: 1.2, marginTop: "2%" }}>{truncate(s.headline, CHAR_LIMITS.HEADLINE_MAX)}</div>
        {s.subheadline && <div style={{ fontSize: "0.52em", color: c.mutedText, marginTop: "4%", lineHeight: 1.3 }}>{truncate(s.subheadline, CHAR_LIMITS.SUBHEADLINE_MAX)}</div>}
        {s.bodyContent && s.bodyContent.length > 0 && (
          <div style={{ marginTop: "5%" }}>
            {s.bodyContent.slice(0, 5).map((item, i) => (
              <div key={i} style={{ fontSize: "0.48em", color: c.fg, lineHeight: 1.5, display: "flex", gap: "0.5em", marginBottom: "0.3em" }}>
                <span style={{ color: c.accent }}>•</span><span>{truncate(item, CHAR_LIMITS.BULLET_MAX)}</span>
              </div>
            ))}
          </div>
        )}
        {s.closingStatement && <div style={{ fontSize: "0.42em", fontWeight: 700, color: c.accent, marginTop: "auto" }}>{truncate(s.closingStatement, CHAR_LIMITS.CLOSING_MAX)}</div>}
      </div>
      <div style={{ flex: "0 0 38%", backgroundColor: c.accent, borderRadius: 6 }} />
    </div>
  );
}

const RENDERERS: Record<LayoutType, React.FC<{ slide: SlideCanvasData; colors: ReturnType<typeof getColors> }>> = {
  "bullets": Bullets, "statement": Statement, "cards": Cards, "two-column": TwoColumn, "matrix": Matrix, "timeline": Timeline,
};

export function SlideCanvas({ slide, theme, className }: Props) {
  const colors = getColors(theme);
  const layout = resolveLayout(slide.layoutRecommendation, slide.selectedLayout);
  const R = RENDERERS[layout] || Bullets;
  return (
    <div className={className} style={{ aspectRatio: "16 / 9", backgroundColor: colors.bg, borderRadius: 4, overflow: "hidden", fontSize: "clamp(8px, 1.8vw, 16px)", fontFamily: "Arial, sans-serif", position: "relative" }}>
      <R slide={slide} colors={colors} />
    </div>
  );
}

// ── Layout picker (compact inline) ──
interface LayoutPickerProps { current: LayoutType; onChange: (layout: LayoutType) => void; }

export function LayoutPicker({ current, onChange }: LayoutPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const label = LAYOUT_DEFINITIONS.find(d => d.type === current)?.label || "Layout";
  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="text-[10px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 font-medium flex items-center gap-1 transition-colors">
        {label} <span className="text-[8px]">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-44 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-1">
          {LAYOUT_DEFINITIONS.map(def => (
            <button key={def.type} onClick={(e) => { e.stopPropagation(); onChange(def.type); setOpen(false); }}
              className={`w-full text-left text-xs px-3 py-1.5 hover:bg-accent transition-colors ${current === def.type ? "text-electric font-medium" : "text-foreground"}`}>
              {def.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}