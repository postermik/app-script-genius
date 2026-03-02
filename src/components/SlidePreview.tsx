import { useState } from "react";
import { ThumbsUp, ThumbsDown, GripVertical, RotateCcw, Pencil } from "lucide-react";

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

function getLayoutLabel(type?: string) {
  const labels: Record<string, string> = {
    headline: "Headline", chart: "Chart", quote: "Quote", framework: "Framework",
    roadmap: "Roadmap", financial: "Financial", split: "Split Layout",
  };
  return type ? labels[type] || type : "Content";
}

function getLayoutColor(type?: string) {
  const colors: Record<string, string> = {
    headline: "bg-electric/20 text-electric",
    chart: "bg-emerald/20 text-emerald",
    quote: "bg-indigo-400/20 text-indigo-400",
    framework: "bg-yellow-400/20 text-yellow-400",
    roadmap: "bg-purple-400/20 text-purple-400",
    financial: "bg-orange-400/20 text-orange-400",
    split: "bg-cyan-400/20 text-cyan-400",
  };
  return type ? colors[type] || "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground";
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
  return "This slide supports the overall narrative flow and structure.";
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
          <button onClick={() => {}} className="text-xs text-muted-foreground px-3 py-1.5 border border-dashed border-border rounded-sm cursor-not-allowed ml-auto font-medium" title="Coming Soon">
            Upload Brand Guidelines
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-electric">Slide Framework</h3>
        <span className="text-sm text-muted-foreground">{activeCount} of {slides.length} slides in export</span>
      </div>

      <p className="text-sm text-muted-foreground mb-5">Drag to reorder · Thumbs down to exclude from export · Changes apply to exported deck</p>

      {/* Horizontal row layout */}
      <div className="space-y-2">
        {orderedSlides.map((slide, i) => {
          const isExcluded = excludedSlides.has(slide.originalIdx);
          return (
            <div
              key={slide.originalIdx}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-4 p-4 rounded-sm border transition-all ${
                isExcluded ? "opacity-50 border-border bg-muted/30" : "border-border hover:border-muted-foreground/20 card-gradient"
              } ${dragIdx === i ? "ring-2 ring-electric/30 scale-[0.99]" : ""}`}
            >
              {/* Drag handle */}
              <div className="cursor-grab text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Slide number */}
              <span className="text-sm font-bold text-muted-foreground w-7 text-center shrink-0">{i + 1}</span>

              {/* Mini preview thumbnail */}
              <div className="w-24 h-14 rounded-sm border border-border shrink-0 flex flex-col items-center justify-center overflow-hidden"
                style={{ backgroundColor: isExcluded ? undefined : themeColors.bg }}>
                <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${getLayoutColor(slide.slideType)}`}>
                  {getLayoutLabel(slide.slideType)}
                </span>
                {slide.visualDirection && (
                  <span className="text-[7px] mt-0.5 px-1 py-0.5 rounded-full bg-muted text-muted-foreground">{slide.visualDirection}</span>
                )}
              </div>

              {/* Headline + reason */}
              <div className="flex-1 min-w-0">
                <h5 className={`text-sm font-semibold leading-tight truncate ${isExcluded ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {slide.headline}
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-1">
                  {getSlideReason(slide.headline, i, orderedSlides.length)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); if (isExcluded) onToggleSlide(slide.originalIdx); }}
                  className={`p-1.5 rounded-sm transition-colors ${!isExcluded ? "text-emerald bg-emerald/10" : "text-muted-foreground hover:text-emerald hover:bg-emerald/5"}`}
                  title="Include in export">
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (!isExcluded) onToggleSlide(slide.originalIdx); }}
                  className={`p-1.5 rounded-sm transition-colors ${isExcluded ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"}`}
                  title="Exclude from export">
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
                {isExcluded && (
                  <button onClick={() => onToggleSlide(slide.originalIdx)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 border border-border rounded-sm">
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
