import { useState } from "react";
import { ThumbsUp, ThumbsDown, GripVertical, RotateCcw, ChevronDown } from "lucide-react";

export interface SlideData {
  headline: string;
  content: string;
  slideType?: string;
  visualDirection?: string;
}

export interface DeckTheme {
  scheme: "dark" | "light" | "custom";
  primary: string;
  secondary: string;
  accent: string;
}

interface Props {
  slides: SlideData[];
  excludedSlides: Set<number>;
  onToggleSlide: (idx: number) => void;
  slideOrder: number[];
  onReorder: (order: number[]) => void;
  theme: DeckTheme;
  onThemeChange: (theme: DeckTheme) => void;
}

const REFINE_OPTIONS = [
  { value: "refine", label: "Refine" },
  { value: "sharper", label: "Sharper" },
  { value: "visionary", label: "Visionary" },
  { value: "analytical", label: "Analytical" },
  { value: "condense", label: "Condense" },
  { value: "expand", label: "Expand" },
];

function getLayoutLabel(type?: string) {
  const labels: Record<string, string> = {
    headline: "Headline", chart: "Chart", quote: "Quote", framework: "Framework",
    roadmap: "Roadmap", financial: "Financial", split: "Split Layout",
  };
  return type ? labels[type] || type : "Content";
}

function getSlideReason(headline: string, idx: number, total: number): string {
  const h = headline.toLowerCase();
  if (idx === 0) return "Opening slide sets context and hooks attention before diving into details.";
  if (idx === total - 1) return "Closing with this slide leaves a clear call-to-action or takeaway.";
  if (h.includes("problem") || h.includes("pain")) return "Leading with the problem creates urgency before presenting the solution.";
  if (h.includes("solution") || h.includes("model")) return "Positioned after the problem to present your answer with maximum impact.";
  if (h.includes("market") || h.includes("opportunity")) return "Market validation builds credibility for the solution just presented.";
  if (h.includes("thesis") || h.includes("investment")) return "The thesis anchors the narrative and frames everything that follows.";
  if (h.includes("why") || h.includes("differentiat") || h.includes("moat")) return "Differentiation defends your position after establishing market context.";
  if (h.includes("traction") || h.includes("metric")) return "Metrics provide proof points that validate your narrative claims.";
  if (h.includes("team")) return "Team slide builds trust and shows execution capability.";
  if (h.includes("risk")) return "Addressing risks proactively signals maturity and transparency.";
  if (h.includes("ask") || h.includes("funding")) return "The ask comes after you've built the case, maximizing likelihood of a yes.";
  if (h.includes("vision") || h.includes("future")) return "Vision slide paints the big picture and inspires action.";
  if (h.includes("roadmap") || h.includes("milestone")) return "Roadmap shows a clear plan and gives confidence in execution.";
  if (h.includes("summary") || h.includes("executive")) return "Executive summary gives decision-makers the key takeaway upfront.";
  if (h.includes("competitive") || h.includes("landscape")) return "Competitive landscape shows you understand the field and where you fit.";
  return "Supporting slide that reinforces the core narrative through additional context.";
}

function getThemePreviewColors(theme: DeckTheme) {
  if (theme.scheme === "light") return { bg: "#ffffff", fg: "#1a1a2e", accent: "#3b82f6", muted: "#6b7280" };
  if (theme.scheme === "custom") {
    const sec = theme.secondary || "#0b0f14";
    const bgLightness = getLightness(sec);
    return { bg: sec, fg: bgLightness > 50 ? "#1a1a2e" : "#f0f0f5", accent: theme.primary || "#3b82f6", muted: bgLightness > 50 ? "#6b7280" : "#9ca3af" };
  }
  return { bg: "#0b0f14", fg: "#dce0e8", accent: "#3b82f6", muted: "#9ca3af" };
}

function getLightness(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return ((max + min) / 2) * 100;
}

export function SlidePreview({ slides, excludedSlides, onToggleSlide, slideOrder, onReorder, theme, onThemeChange }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [refineOpen, setRefineOpen] = useState<number | null>(null);

  if (slides.length === 0) return null;

  const orderedSlides = slideOrder.map(i => ({ ...slides[i], originalIdx: i }));
  const activeCount = slideOrder.filter(i => !excludedSlides.has(i)).length;

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) return;
    const newOrder = [...slideOrder];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    onReorder(newOrder);
    setDragIdx(targetIdx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const themeColors = getThemePreviewColors(theme);

  return (
    <div className="mb-10">
      {/* Deck Theme Panel */}
      <div className="mb-6 p-5 rounded-sm border border-border card-gradient">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Deck Theme</h4>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(["dark", "light", "custom"] as const).map(s => (
            <button key={s} onClick={() => onThemeChange({ ...theme, scheme: s })}
              className={`text-xs px-4 py-2 rounded-sm border transition-colors capitalize font-medium ${
                theme.scheme === s ? "border-electric/40 text-foreground bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
              }`}>
              {s}
            </button>
          ))}
          {theme.scheme === "custom" && (
            <div className="flex items-center gap-3 ml-2">
              <label className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Primary</span>
                <input type="color" value={theme.primary || "#3b82f6"} onChange={e => onThemeChange({ ...theme, primary: e.target.value })}
                  className="w-7 h-7 rounded-sm border border-border cursor-pointer bg-transparent" />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Background</span>
                <input type="color" value={theme.secondary || "#0b0f14"} onChange={e => onThemeChange({ ...theme, secondary: e.target.value })}
                  className="w-7 h-7 rounded-sm border border-border cursor-pointer bg-transparent" />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Accent</span>
                <input type="color" value={theme.accent || "#1e3a5f"} onChange={e => onThemeChange({ ...theme, accent: e.target.value })}
                  className="w-7 h-7 rounded-sm border border-border cursor-pointer bg-transparent" />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-electric">Slide Framework</h3>
        <span className="text-[13px] text-secondary-foreground">{activeCount} of {slides.length} slides in export</span>
      </div>

      <p className="text-[13px] text-secondary-foreground mb-5">Drag to reorder · Thumbs down to exclude from export</p>

      {/* Slide cards */}
      <div className="space-y-3">
        {orderedSlides.map((slide, i) => {
          const isExcluded = excludedSlides.has(slide.originalIdx);
          const contentPreview = slide.content ? slide.content.slice(0, 80) : "";
          return (
            <div
              key={slide.originalIdx}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-stretch gap-4 p-5 rounded-sm border transition-all min-h-[120px] ${
                isExcluded ? "opacity-50 border-border bg-muted/30" : "border-border hover:border-muted-foreground/20 card-gradient accent-left-border"
              } ${dragIdx === i ? "ring-2 ring-electric/30 scale-[0.99]" : ""}`}
            >
              {/* Drag handle */}
              <div className="cursor-grab text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Slide number */}
              <span className="text-base font-bold text-secondary-foreground w-7 text-center shrink-0 flex items-center justify-center">{i + 1}</span>

              {/* Slide preview thumbnail — shows actual content */}
              <div
                className="w-[120px] h-[80px] rounded-sm border border-border shrink-0 flex flex-col justify-between overflow-hidden p-2"
                style={{ backgroundColor: isExcluded ? undefined : themeColors.bg }}
              >
                <p className="font-semibold leading-tight line-clamp-2" style={{ fontSize: "7px", color: themeColors.fg }}>
                  {slide.headline}
                </p>
                {contentPreview && (
                  <p className="leading-tight line-clamp-2 mt-auto" style={{ fontSize: "5.5px", color: themeColors.muted }}>
                    {contentPreview}
                  </p>
                )}
                <span
                  className="text-[6px] font-semibold px-1 py-0.5 rounded-sm self-start mt-0.5"
                  style={{ backgroundColor: `${themeColors.accent}30`, color: themeColors.accent }}
                >
                  {getLayoutLabel(slide.slideType)}
                </span>
              </div>

              {/* Headline + reason */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h5 className={`text-sm font-semibold leading-tight ${isExcluded ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {slide.headline}
                </h5>
                <p className="text-xs text-secondary-foreground leading-relaxed mt-1.5 line-clamp-2">
                  {getSlideReason(slide.headline, i, orderedSlides.length)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Refine dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRefineOpen(refineOpen === i ? null : i); }}
                    className="text-xs px-3 py-1.5 rounded-sm border border-electric/30 text-electric hover:bg-electric/10 transition-colors font-medium flex items-center gap-1"
                  >
                    Refine <ChevronDown className="h-3 w-3" />
                  </button>
                  {refineOpen === i && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in">
                      {REFINE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={(e) => { e.stopPropagation(); setRefineOpen(null); }}
                          className="w-full text-left text-xs px-3 py-2.5 text-foreground hover:bg-accent hover:text-foreground transition-colors font-medium"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); if (isExcluded) onToggleSlide(slide.originalIdx); }}
                  className={`p-2 rounded-sm transition-colors ${!isExcluded ? "text-emerald bg-emerald/10" : "text-muted-foreground hover:text-emerald hover:bg-emerald/5"}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (!isExcluded) onToggleSlide(slide.originalIdx); }}
                  className={`p-2 rounded-sm transition-colors ${isExcluded ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"}`}
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
                {isExcluded && (
                  <button onClick={() => onToggleSlide(slide.originalIdx)}
                    className="text-xs text-secondary-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 border border-border rounded-sm">
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
