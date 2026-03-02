import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Grid3X3, Layers, ThumbsUp, ThumbsDown, GripVertical, Info, RotateCcw } from "lucide-react";

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
  if (theme.scheme === "custom") return { bg: theme.secondary || "#0b0f14", fg: "#ffffff", accent: theme.primary || "#3b82f6", muted: "#9ca3af" };
  return { bg: "#0b0f14", fg: "#dce0e8", accent: "#3b82f6", muted: "#6b7280" };
}

export function SlidePreview({ slides, excludedSlides, onToggleSlide, slideOrder, onReorder, theme, onThemeChange }: Props) {
  const [current, setCurrent] = useState(0);
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("grid");
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);
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
    <div className="mt-8">
      {/* Deck Theme Panel */}
      <div className="mb-6 p-4 rounded-sm border border-border bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">Deck Theme</h4>
          <div className="flex items-center gap-3">
            {/* Live preview swatch */}
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: themeColors.bg }} />
              <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: themeColors.accent }} />
              <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: themeColors.fg }} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["dark", "light", "custom"] as const).map(s => (
            <button key={s} onClick={() => onThemeChange({ ...theme, scheme: s })}
              className={`text-[11px] px-3 py-1.5 rounded-sm border transition-colors capitalize ${
                theme.scheme === s ? "border-electric/40 text-foreground bg-accent" : "border-border text-muted-foreground hover:text-foreground"
              }`}>
              {s}
            </button>
          ))}
          {theme.scheme === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Primary</span>
                <input type="color" value={theme.primary || "#3b82f6"} onChange={e => onThemeChange({ ...theme, primary: e.target.value })}
                  className="w-6 h-6 rounded-sm border border-border cursor-pointer bg-transparent" />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Background</span>
                <input type="color" value={theme.secondary || "#0b0f14"} onChange={e => onThemeChange({ ...theme, secondary: e.target.value })}
                  className="w-6 h-6 rounded-sm border border-border cursor-pointer bg-transparent" />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Accent</span>
                <input type="color" value={theme.accent || "#1e3a5f"} onChange={e => onThemeChange({ ...theme, accent: e.target.value })}
                  className="w-6 h-6 rounded-sm border border-border cursor-pointer bg-transparent" />
              </label>
            </div>
          )}
          <button onClick={() => {}} className="text-[10px] text-muted-foreground/40 px-2 py-1 border border-dashed border-border rounded-sm cursor-not-allowed ml-auto" title="Coming Soon">
            Upload Brand Guidelines
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">Slide Preview</h3>
          <span className="text-[10px] text-muted-foreground/50">{activeCount} of {slides.length} slides in export</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMode("carousel")}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === "carousel" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"}`}>
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === "grid" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"}`}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mb-3">Drag to reorder • Thumbs down to exclude from export • Changes apply to exported deck</p>

      {viewMode === "carousel" ? (
        <div>
          {(() => {
            const slide = orderedSlides[current];
            if (!slide) return null;
            const isExcluded = excludedSlides.has(slide.originalIdx);
            return (
              <div className={`relative transition-opacity ${isExcluded ? "opacity-40" : ""}`}>
                <div className="aspect-video flex flex-col justify-between p-8 relative rounded-sm border border-border"
                  style={{ backgroundColor: themeColors.bg }}>
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-sm" style={{ backgroundColor: themeColors.accent }} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getLayoutColor(slide.slideType)}`}>
                        {getLayoutLabel(slide.slideType)}
                      </span>
                      {slide.visualDirection && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{slide.visualDirection}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedInfo(expandedInfo === slide.originalIdx ? null : slide.originalIdx)}
                        className="text-muted-foreground/50 hover:text-foreground transition-colors" title="Why this slide?">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px]" style={{ color: themeColors.muted }}>{current + 1} / {orderedSlides.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center py-4">
                    <h4 className="text-lg font-bold leading-tight mb-3" style={{ color: themeColors.fg }}>{slide.headline}</h4>
                    {slide.content && <p className="text-xs leading-relaxed line-clamp-4" style={{ color: themeColors.fg + "b3" }}>{slide.content}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { if (isExcluded) onToggleSlide(slide.originalIdx); }}
                        className={`p-1 rounded-sm transition-colors ${!isExcluded ? "text-emerald bg-emerald/10" : "text-muted-foreground/30 hover:text-emerald"}`} title="Include in export">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { if (!isExcluded) onToggleSlide(slide.originalIdx); }}
                        className={`p-1 rounded-sm transition-colors ${isExcluded ? "text-destructive bg-destructive/10" : "text-muted-foreground/30 hover:text-destructive"}`} title="Exclude from export">
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isExcluded && (
                      <button onClick={() => onToggleSlide(slide.originalIdx)}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <RotateCcw className="h-3 w-3" /> Restore
                      </button>
                    )}
                  </div>
                </div>
                {expandedInfo === slide.originalIdx && (
                  <div className="mt-2 p-3 rounded-sm border border-border bg-card/80 text-xs text-muted-foreground leading-relaxed animate-fade-in">
                    <span className="text-electric font-medium">Why here:</span> {getSlideReason(slide.headline, current, orderedSlides.length)}
                  </div>
                )}
              </div>
            );
          })()}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              {orderedSlides.map((s, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-electric" : excludedSlides.has(s.originalIdx) ? "bg-destructive/30" : "bg-muted-foreground/30"}`} />
              ))}
            </div>
            <button onClick={() => setCurrent(c => Math.min(orderedSlides.length - 1, c + 1))} disabled={current === orderedSlides.length - 1}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {orderedSlides.map((slide, i) => {
            const isExcluded = excludedSlides.has(slide.originalIdx);
            return (
              <div
                key={slide.originalIdx}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-video flex flex-col justify-between p-4 text-left rounded-sm border transition-all ${
                  isExcluded ? "opacity-40 border-destructive/20 bg-muted/20" : "border-border hover:border-muted-foreground/20"
                } ${dragIdx === i ? "ring-2 ring-electric/30 scale-[0.98]" : ""}`}
                style={{ backgroundColor: isExcluded ? undefined : themeColors.bg }}
              >
                {/* Drag handle */}
                <div className="absolute top-1 left-1 cursor-grab text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                  <GripVertical className="h-3 w-3" />
                </div>

                <div className="flex items-center justify-between pl-3">
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getLayoutColor(slide.slideType)}`}>
                      {getLayoutLabel(slide.slideType)}
                    </span>
                    {slide.visualDirection && (
                      <span className="text-[8px] px-1 py-0.5 rounded-full bg-muted text-muted-foreground">{slide.visualDirection}</span>
                    )}
                  </div>
                  <span className="text-[9px]" style={{ color: isExcluded ? undefined : themeColors.muted }}>{i + 1}</span>
                </div>

                <div className="flex-1 flex flex-col justify-center py-2 pl-3">
                  <h5 className="text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: isExcluded ? undefined : themeColors.fg }}>
                    {slide.headline}
                  </h5>
                  {slide.content && (
                    <p className="text-[9px] mt-1 line-clamp-2 leading-relaxed" style={{ color: isExcluded ? undefined : themeColors.fg + "80" }}>
                      {slide.content}
                    </p>
                  )}
                </div>

                {/* Thumbs */}
                <div className="flex items-center justify-between pl-3">
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); if (isExcluded) onToggleSlide(slide.originalIdx); }}
                      className={`p-0.5 rounded-sm transition-colors ${!isExcluded ? "text-emerald" : "text-muted-foreground/20 hover:text-emerald"}`}>
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if (!isExcluded) onToggleSlide(slide.originalIdx); }}
                      className={`p-0.5 rounded-sm transition-colors ${isExcluded ? "text-destructive" : "text-muted-foreground/20 hover:text-destructive"}`}>
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedInfo(expandedInfo === slide.originalIdx ? null : slide.originalIdx); }}
                    className="text-muted-foreground/30 hover:text-foreground transition-colors" title="Why this slide?">
                    <Info className="h-3 w-3" />
                  </button>
                </div>

                {isExcluded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-sm">
                    <button onClick={() => onToggleSlide(slide.originalIdx)}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 border border-border rounded-sm bg-card">
                      <RotateCcw className="h-3 w-3" /> Restore
                    </button>
                  </div>
                )}

                {expandedInfo === slide.originalIdx && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-card/95 border-t border-border text-[9px] text-muted-foreground leading-relaxed rounded-b-sm animate-fade-in z-10">
                    <span className="text-electric font-medium">Why: </span>{getSlideReason(slide.headline, i, orderedSlides.length)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
