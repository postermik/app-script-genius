import { useState, useEffect, useRef } from "react";
import { resolveLayout, truncate, CHAR_LIMITS, type LayoutType, LAYOUT_DEFINITIONS } from "@/lib/slideLayouts";
import type { DeckTheme } from "@/components/SlidePreview";

interface SlideCanvasData {
  headline: string;
  subheadline?: string;
  bodyContent?: string[];
  categoryLabel?: string;
  closingStatement?: string;
  layoutRecommendation?: string;
  selectedLayout?: string;
  dataPoints?: string[];
  visualDirection?: string;
}

interface Props {
  slide: SlideCanvasData;
  theme: DeckTheme;
  className?: string;
}

function getColors(theme: DeckTheme) {
  if (theme.scheme === "light") {
    return { bg: "#ffffff", fg: "#1a1a2e", primary: "#3b82f6", muted: "#6b7280", mutedText: "#9ca3af", accent: "#3b82f6" };
  }
  if (theme.scheme === "custom") {
    const sec = theme.secondary || "#0b0f14";
    const r = parseInt(sec.replace("#", "").substring(0, 2), 16);
    const g = parseInt(sec.replace("#", "").substring(2, 4), 16);
    const b = parseInt(sec.replace("#", "").substring(4, 6), 16);
    const bright = (r * 299 + g * 587 + b * 114) / 1000;
    return {
      bg: sec,
      fg: bright > 128 ? "#1a1a2e" : "#dce0e8",
      primary: theme.primary || "#3b82f6",
      muted: "#6b7280",
      mutedText: "#9ca3af",
      accent: theme.accent || "#1e3a5f",
    };
  }
  return { bg: "#0b0f14", fg: "#dce0e8", primary: "#3b82f6", muted: "#6b7280", mutedText: "#9ca3af", accent: "#3b82f6" };
}

function onAccent(colors: ReturnType<typeof getColors>): string {
  return colors.bg === "#ffffff" ? "#ffffff" : colors.bg;
}

function headlineFontSize(text: string): string {
  if (text.length <= 50) return "1.15em";
  if (text.length <= 70) return "1em";
  if (text.length <= 90) return "0.9em";
  return "0.8em";
}

// ── Layout renderers ──

function BulletsLayout({ slide, colors }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {slide.categoryLabel && (
        <div style={{ fontSize: "0.42em", fontWeight: 700, color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {slide.categoryLabel}
        </div>
      )}
      <div style={{ fontSize: headlineFontSize(slide.headline), fontWeight: 700, color: colors.primary, lineHeight: 1.2, marginTop: "2%" }}>
        {truncate(slide.headline, CHAR_LIMITS.HEADLINE_MAX)}
      </div>
      {slide.subheadline && (
        <div style={{ fontSize: "0.6em", color: colors.mutedText, marginTop: "3%", lineHeight: 1.3 }}>
          {truncate(slide.subheadline, CHAR_LIMITS.SUBHEADLINE_MAX)}
        </div>
      )}
      {slide.bodyContent && slide.bodyContent.length > 0 && (
        <div style={{ marginTop: "4%", flex: 1 }}>
          {slide.bodyContent.slice(0, 6).map((item, i) => (
            <div key={i} style={{ fontSize: "0.52em", color: colors.fg, lineHeight: 1.5, display: "flex", gap: "0.5em", marginBottom: "0.3em" }}>
              <span style={{ color: colors.accent }}>•</span>
              <span>{truncate(item, CHAR_LIMITS.BULLET_MAX)}</span>
            </div>
          ))}
        </div>
      )}
      {slide.closingStatement && (
        <div style={{ fontSize: "0.48em", fontWeight: 700, color: colors.accent, marginTop: "auto" }}>
          {truncate(slide.closingStatement, CHAR_LIMITS.CLOSING_MAX)}
        </div>
      )}
    </div>
  );
}

function StatementLayout({ slide, colors }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1%", backgroundColor: colors.accent }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "8% 8% 0" }}>
        {slide.categoryLabel && (
          <div style={{ fontSize: "0.48em", fontWeight: 700, color: colors.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4%" }}>
            {slide.categoryLabel}
          </div>
        )}
        <div style={{ fontSize: slide.headline.length > 60 ? "1.15em" : "1.3em", fontWeight: 700, color: colors.primary, lineHeight: 1.2 }}>
          {truncate(slide.headline, CHAR_LIMITS.HEADLINE_MAX)}
        </div>
        {slide.subheadline && (
          <div style={{ fontSize: "0.6em", color: colors.mutedText, marginTop: "4%", maxWidth: "75%", lineHeight: 1.3 }}>
            {truncate(slide.subheadline, CHAR_LIMITS.SUBHEADLINE_MAX)}
          </div>
        )}
      </div>
      {slide.closingStatement && (
        <div style={{ backgroundColor: colors.accent, padding: "3% 8%", marginTop: "auto" }}>
          <div style={{ fontSize: "0.55em", fontWeight: 700, color: onAccent(colors), lineHeight: 1.3 }}>
            {truncate(slide.closingStatement, CHAR_LIMITS.CLOSING_MAX)}
          </div>
        </div>
      )}
    </div>
  );
}

function DataCalloutLayout({ slide, colors }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  const dp = slide.dataPoints || [];
  const labels = (slide.bodyContent || []).slice(0, 3);
  const cardCount = Math.max(dp.length, Math.min(labels.length, 3));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {slide.categoryLabel && (
        <div style={{ fontSize: "0.42em", fontWeight: 700, color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {slide.categoryLabel}
        </div>
      )}
      <div style={{ fontSize: headlineFontSize(slide.headline), fontWeight: 700, color: colors.primary, lineHeight: 1.2, marginTop: "2%" }}>
        {truncate(slide.headline, CHAR_LIMITS.HEADLINE_MAX)}
      </div>
      {cardCount > 0 && (
        <div style={{ display: "flex", gap: "3%", marginTop: "5%", flex: 1 }}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 4, padding: "4% 5%", display: "flex", flexDirection: "column" }}>
              {dp[i] && (
                <div style={{ fontSize: "1.4em", fontWeight: 700, color: onAccent(colors), lineHeight: 1.1 }}>
                  {dp[i]}
                </div>
              )}
              {labels[i] && (
                <div style={{ fontSize: "0.42em", color: onAccent(colors), marginTop: dp[i] ? "8%" : "0", lineHeight: 1.3, opacity: 0.9 }}>
                  {truncate(labels[i], 80)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatrixLayout({ slide, colors }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  const items = (slide.bodyContent || []).slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {slide.categoryLabel && (
        <div style={{ fontSize: "0.42em", fontWeight: 700, color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {slide.categoryLabel}
        </div>
      )}
      <div style={{ fontSize: headlineFontSize(slide.headline), fontWeight: 700, color: colors.primary, lineHeight: 1.2, marginTop: "2%" }}>
        {truncate(slide.headline, CHAR_LIMITS.HEADLINE_MAX)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5%", marginTop: "4%", flex: 1 }}>
        {items.map((item, i) => (
          <div key={i} style={{ backgroundColor: colors.accent, borderRadius: 4, padding: "5% 6%", borderLeft: `3px solid ${colors.primary}`, display: "flex", alignItems: "flex-start" }}>
            <div style={{ fontSize: "0.48em", color: onAccent(colors), lineHeight: 1.4 }}>
              {truncate(item, 120)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineLayout({ slide, colors }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  const items = (slide.bodyContent || []).slice(0, 5);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {slide.categoryLabel && (
        <div style={{ fontSize: "0.42em", fontWeight: 700, color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {slide.categoryLabel}
        </div>
      )}
      <div style={{ fontSize: headlineFontSize(slide.headline), fontWeight: 700, color: colors.primary, lineHeight: 1.2, marginTop: "2%" }}>
        {truncate(slide.headline, CHAR_LIMITS.HEADLINE_MAX)}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", marginTop: "6%", position: "relative" }}>
        {/* Connecting line */}
        <div style={{ position: "absolute", top: "0.8em", left: `${100 / items.length / 2}%`, right: `${100 / items.length / 2}%`, height: 2, backgroundColor: colors.accent }} />
        {items.map((item, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div style={{ width: "1.6em", height: "1.6em", borderRadius: "50%", backgroundColor: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48em", fontWeight: 700, color: onAccent(colors), zIndex: 1 }}>
              {i + 1}
            </div>
            <div style={{ fontSize: "0.42em", color: colors.fg, textAlign: "center", marginTop: "8%", padding: "0 4%", lineHeight: 1.3 }}>
              {truncate(item, 80)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardsLayout({ slide, colors }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  const items = (slide.bodyContent || []).slice(0, 3);
  const dp = slide.dataPoints || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "6% 8%" }}>
      {slide.categoryLabel && (
        <div style={{ fontSize: "0.42em", fontWeight: 700, color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {slide.categoryLabel}
        </div>
      )}
      <div style={{ fontSize: headlineFontSize(slide.headline), fontWeight: 700, color: colors.primary, lineHeight: 1.2, marginTop: "2%" }}>
        {truncate(slide.headline, CHAR_LIMITS.HEADLINE_MAX)}
      </div>
      <div style={{ display: "flex", gap: "3%", marginTop: "5%", flex: 1 }}>
        {items.map((item, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 4, borderTop: `3px solid ${colors.primary}`, padding: "4% 5%", display: "flex", flexDirection: "column" }}>
            {dp[i] && (
              <div style={{ fontSize: "1.1em", fontWeight: 700, color: onAccent(colors), lineHeight: 1.1, marginBottom: "6%" }}>
                {dp[i]}
              </div>
            )}
            <div style={{ fontSize: "0.45em", color: onAccent(colors), lineHeight: 1.4, opacity: 0.9 }}>
              {truncate(item, 100)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TwoColumnLayout({ slide, colors }: { slide: SlideCanvasData; colors: ReturnType<typeof getColors> }) {
  return (
    <div style={{ display: "flex", height: "100%", padding: "6% 8%", gap: "5%" }}>
      <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column" }}>
        {slide.categoryLabel && (
          <div style={{ fontSize: "0.42em", fontWeight: 700, color: colors.accent, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {slide.categoryLabel}
          </div>
        )}
        <div style={{ fontSize: headlineFontSize(slide.headline), fontWeight: 700, color: colors.primary, lineHeight: 1.2, marginTop: "2%" }}>
          {truncate(slide.headline, CHAR_LIMITS.HEADLINE_MAX)}
        </div>
        {slide.subheadline && (
          <div style={{ fontSize: "0.52em", color: colors.mutedText, marginTop: "4%", lineHeight: 1.3 }}>
            {truncate(slide.subheadline, CHAR_LIMITS.SUBHEADLINE_MAX)}
          </div>
        )}
        {slide.bodyContent && slide.bodyContent.length > 0 && (
          <div style={{ marginTop: "5%" }}>
            {slide.bodyContent.slice(0, 5).map((item, i) => (
              <div key={i} style={{ fontSize: "0.48em", color: colors.fg, lineHeight: 1.5, display: "flex", gap: "0.5em", marginBottom: "0.3em" }}>
                <span style={{ color: colors.accent }}>•</span>
                <span>{truncate(item, CHAR_LIMITS.BULLET_MAX)}</span>
              </div>
            ))}
          </div>
        )}
        {slide.closingStatement && (
          <div style={{ fontSize: "0.42em", fontWeight: 700, color: colors.accent, marginTop: "auto" }}>
            {truncate(slide.closingStatement, CHAR_LIMITS.CLOSING_MAX)}
          </div>
        )}
      </div>
      <div style={{ flex: "0 0 38%", backgroundColor: colors.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {slide.visualDirection && (
          <div style={{ fontSize: "0.45em", color: onAccent(colors), textAlign: "center", padding: "10%", fontStyle: "italic", opacity: 0.8 }}>
            {slide.visualDirection}
          </div>
        )}
      </div>
    </div>
  );
}

const LAYOUT_RENDERERS: Record<LayoutType, React.FC<{ slide: SlideCanvasData; colors: ReturnType<typeof getColors> }>> = {
  "bullets": BulletsLayout,
  "statement": StatementLayout,
  "data-callout": DataCalloutLayout,
  "two-column": TwoColumnLayout,
  "matrix": MatrixLayout,
  "timeline": TimelineLayout,
  "cards": CardsLayout,
};

export function SlideCanvas({ slide, theme, className }: Props) {
  const colors = getColors(theme);
  const layout = resolveLayout(slide.layoutRecommendation, slide.selectedLayout);
  const Renderer = LAYOUT_RENDERERS[layout] || BulletsLayout;

  return (
    <div
      className={className}
      style={{
        aspectRatio: "16 / 9",
        backgroundColor: colors.bg,
        borderRadius: 4,
        overflow: "hidden",
        fontSize: "clamp(8px, 1.8vw, 16px)",
        fontFamily: "Arial, sans-serif",
        position: "relative",
      }}
    >
      <Renderer slide={slide} colors={colors} />
    </div>
  );
}

// ── Layout picker for SlidePreview ──
interface LayoutPickerProps {
  current: LayoutType;
  onChange: (layout: LayoutType) => void;
}

export function LayoutPicker({ current, onChange }: LayoutPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentDef = LAYOUT_DEFINITIONS.find(d => d.type === current);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-xs px-3 py-1.5 w-[76px] justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 font-medium flex items-center gap-1 transition-colors"
      >
        Layout
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-1">
          {LAYOUT_DEFINITIONS.map(def => (
            <button
              key={def.type}
              onClick={(e) => { e.stopPropagation(); onChange(def.type); setOpen(false); }}
              className={`w-full text-left text-xs px-3 py-2 hover:bg-accent transition-colors ${current === def.type ? "text-electric font-medium" : "text-foreground"}`}
            >
              <span>{def.label}</span>
              <span className="block text-[10px] text-muted-foreground mt-0.5">{def.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}