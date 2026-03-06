import { useState } from "react";
import { ThumbsUp, ThumbsDown, GripVertical, RotateCcw, ChevronDown, Info, Lightbulb, Loader2 } from "lucide-react";

export interface SlideData {
  headline: string;
  content: string;
  slideType?: string;
  visualDirection?: string;
  categoryLabel?: string;
  closingStatement?: string;
  layoutRecommendation?: string;
  suggestion?: string | null;
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

function formatLayoutRecommendation(layout?: string): string {
  if (!layout) return "";
  const map: Record<string, string> = {
    "3-column-with-icons": "3-Column", "data-cards": "Data Cards", "split-layout": "Split",
    "concentric-circles": "TAM/SAM/SOM", "flywheel": "Flywheel", "competitive-matrix": "Matrix",
    "timeline": "Timeline", "staircase-chart": "Staircase", "table": "Table",
    "full-bleed-statement": "Statement", "team-grid": "Team Grid",
  };
  if (map[layout]) return map[layout];
  return layout.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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

function getSlideSubheader(headline: string, content: string): string {
  const h = headline.toLowerCase();
  if (h.includes("problem") || h.includes("pain")) return "The critical challenge your market faces today";
  if (h.includes("solution") || h.includes("model")) return "How your approach fundamentally changes the game";
  if (h.includes("market") || h.includes("opportunity")) return "The scale and trajectory of your target market";
  if (h.includes("thesis") || h.includes("investment")) return "The core argument for why this investment wins";
  if (h.includes("why") || h.includes("differentiat") || h.includes("moat")) return "What makes you defensible against competitors";
  if (h.includes("traction") || h.includes("metric")) return "Evidence that validates your approach is working";
  if (h.includes("team")) return "The people who make this vision executable";
  if (h.includes("risk")) return "Honest assessment and mitigation strategies";
  if (h.includes("ask") || h.includes("funding")) return "What we need and how we'll deploy it";
  if (h.includes("vision") || h.includes("future")) return "Where this is headed in the next 3-5 years";
  if (h.includes("roadmap") || h.includes("milestone")) return "Key milestones and the path to get there";
  if (h.includes("summary") || h.includes("executive")) return "The essential takeaway for decision-makers";
  if (h.includes("competitive") || h.includes("landscape")) return "How you stack up against alternatives";
  // Derive from content if no match
  if (content) {
    const firstSentence = content.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length < 80) return firstSentence;
  }
  return "Key supporting context for your narrative";
}

function getSlideBodyPoints(headline: string, content: string): string[] {
  const h = headline.toLowerCase();
  // Extract bullet points from content if available
  if (content) {
    // Try splitting by newlines or bullet markers
    const lines = content.split(/[\n•·–—]/).map(l => l.trim()).filter(l => l.length > 10 && l.length < 120);
    if (lines.length >= 2) return lines.slice(0, 4);
    // Try splitting by sentences
    const sentences = content.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15 && s.length < 120);
    if (sentences.length >= 2) return sentences.slice(0, 4);
  }
  // Fallback contextual bullets
  if (h.includes("problem") || h.includes("pain")) return ["Current solutions are costly and inefficient", "Market pain is growing with scale", "No incumbent addresses the root cause"];
  if (h.includes("solution") || h.includes("model")) return ["Novel approach that eliminates key friction", "10x improvement over existing alternatives", "Built for scale from day one"];
  if (h.includes("market") || h.includes("opportunity")) return ["Total addressable market size and growth", "Target segment and beachhead strategy", "Market timing and tailwinds"];
  if (h.includes("thesis") || h.includes("investment")) return ["Core value proposition", "Unfair advantage in execution", "Clear path to category leadership"];
  if (h.includes("traction") || h.includes("metric")) return ["Key growth metrics and trends", "Customer acquisition milestones", "Revenue or engagement trajectory"];
  if (h.includes("team")) return ["Founder domain expertise", "Key hires and advisory board", "Track record of execution"];
  if (h.includes("ask") || h.includes("funding")) return ["Funding amount and use of proceeds", "Key milestones this enables", "Expected runway and next raise"];
  return ["Key supporting data point", "Strategic context and framing", "Evidence that reinforces the narrative"];
}

function getThemePreviewColors(theme: DeckTheme) {
  if (theme.scheme === "light") return { bg: "#ffffff", fg: "#1a1a2e", primary: "#3b82f6", accent: "#3b82f6", muted: "#6b7280" };
  if (theme.scheme === "custom") {
    const sec = theme.secondary || "#0b0f14";
    const bgLightness = getLightness(sec);
    return {
      bg: sec,
      fg: bgLightness > 50 ? "#1a1a2e" : "#f0f0f5",
      primary: theme.primary || "#3b82f6",
      accent: theme.accent || "#1e3a5f",
      muted: bgLightness > 50 ? "#6b7280" : "#9ca3af",
    };
  }
  return { bg: "#0b0f14", fg: "#dce0e8", primary: "#3b82f6", accent: "#3b82f6", muted: "#9ca3af" };
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
  const [dismissedSlideSuggestions, setDismissedSlideSuggestions] = useState<number[]>([]);
  const [applyingSlideIndex, setApplyingSlideIndex] = useState<number | null>(null);

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
      <div className="space-y-4">
        {orderedSlides.map((slide, i) => {
          const isExcluded = excludedSlides.has(slide.originalIdx);
          const subheader = getSlideSubheader(slide.headline, slide.content);
          const bodyPoints = getSlideBodyPoints(slide.headline, slide.content);
          return (
            <div
              key={slide.originalIdx}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`relative flex gap-4 p-5 rounded-sm border transition-all min-h-[160px] ${
                isExcluded ? "opacity-50 border-border bg-muted/30" : "border-border hover:border-muted-foreground/20 card-gradient accent-left-border"
              } ${dragIdx === i ? "ring-2 ring-electric/30 scale-[0.99]" : ""}`}
            >
              {/* Layout recommendation badge, top-right */}
              {slide.layoutRecommendation && (
                <span className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full font-medium">
                  {formatLayoutRecommendation(slide.layoutRecommendation)}
                </span>
              )}

              {/* Drag handle + slide number */}
              <div className="flex flex-col items-center justify-center gap-2 shrink-0">
                <div className="cursor-grab text-muted-foreground hover:text-foreground transition-colors">
                  <GripVertical className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold" style={{ color: themeColors.accent }}>{i + 1}</span>
              </div>

              {/* Slide preview thumbnail */}
              <div
                className="w-[140px] h-[100px] rounded-sm border border-border shrink-0 flex flex-col justify-between overflow-hidden p-2.5 self-center"
                style={{ backgroundColor: isExcluded ? undefined : themeColors.bg }}
              >
                <div>
                  {slide.categoryLabel && (
                    <p className="font-semibold uppercase leading-tight" style={{ fontSize: "5px", color: themeColors.primary, letterSpacing: "0.5px" }}>
                      {slide.categoryLabel}
                    </p>
                  )}
                  <p className="font-bold leading-tight line-clamp-2" style={{ fontSize: "8px", color: themeColors.primary }}>
                    {slide.headline}
                  </p>
                  <p className="leading-tight line-clamp-2 mt-1" style={{ fontSize: "6px", color: themeColors.muted }}>
                    {subheader}
                  </p>
                </div>
                <div className="mt-auto" />
              </div>

              {/* Content section */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                {slide.categoryLabel && (
                  <span className="text-xs uppercase tracking-[0.1em] font-semibold" style={{ color: themeColors.primary }}>
                    {slide.categoryLabel}
                  </span>
                )}
                <h5 className={`text-base font-bold leading-tight ${isExcluded ? "text-muted-foreground line-through" : ""}`}
                  style={!isExcluded ? { color: themeColors.primary } : undefined}>
                  {slide.headline}
                </h5>
                <p className="text-sm text-secondary-foreground leading-snug">
                  {subheader}
                </p>
                {bodyPoints.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {bodyPoints.map((point, pi) => (
                      <li key={pi} className="text-[13px] text-muted-foreground leading-snug flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0" style={{ color: themeColors.accent }}>•</span>
                        <span className="line-clamp-1">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {slide.closingStatement && (
                  <p className="text-[13px] font-medium mt-2 leading-snug" style={{ color: themeColors.accent }}>
                    {slide.closingStatement}
                  </p>
                )}
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-1 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: themeColors.accent, opacity: 0.6 }} />
                  <span className="italic">{getSlideReason(slide.headline, i, orderedSlides.length)}</span>
                </p>

                {/* Slide-level suggestion */}
                {slide.suggestion && !dismissedSlideSuggestions.includes(slide.originalIdx) && (
                  <div className="mt-3 bg-electric/[0.06] border border-electric/20 rounded-sm p-3 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-electric mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/80 flex-1">{slide.suggestion}</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setDismissedSlideSuggestions(prev => [...prev, slide.originalIdx])}
                        className="text-xs px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end justify-center gap-2 shrink-0">
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

                <div className="flex items-center gap-1.5">
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
                </div>
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
