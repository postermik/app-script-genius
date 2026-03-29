import { useState } from "react";
import { GripVertical, RotateCcw, ChevronDown, Lightbulb, Loader2, Pencil, X, Check } from "lucide-react";
import { SlideCanvas, LayoutPicker } from "@/components/SlideCanvas";
import { resolveLayout } from "@/lib/slideLayouts";

export interface SlideData {
  headline: string;
  content: string;
  slideType?: string;
  visualDirection?: string;
  categoryLabel?: string;
  closingStatement?: string;
  layoutRecommendation?: string;
  suggestion?: string | null;
  bodyContent?: string[];
  subheadline?: string;
  selectedLayout?: string;
  dataPoints?: string[];
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
  onRefineSlide?: (slideIndex: number, tone: string) => void;
  refiningSlideIndex?: number | null;
  onEditSlide?: (slideIndex: number, field: string, value: string | string[]) => void;
}

const REFINE_OPTIONS = [
  { value: "refine", label: "Refine" },
  { value: "sharper", label: "Sharper" },
  { value: "visionary", label: "Visionary" },
  { value: "analytical", label: "Analytical" },
  { value: "condense", label: "Condense" },
  { value: "expand", label: "Expand" },
  { value: "revert", label: "Revert to Original" },
];

export function SlidePreview({
  slides, excludedSlides, onToggleSlide, slideOrder, onReorder,
  theme, onThemeChange, onRefineSlide, refiningSlideIndex, onEditSlide
}: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [refineOpen, setRefineOpen] = useState<number | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<number[]>([]);
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [savedSlide, setSavedSlide] = useState<number | null>(null);

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

  const themeLabel = theme.scheme.charAt(0).toUpperCase() + theme.scheme.slice(1);

  return (
    <div className="mb-10">
      {/* Deck Theme */}
      <div className="mb-3">
        <div className="flex items-center justify-between px-4 py-2.5 rounded-sm border border-border card-gradient cursor-pointer select-none"
          onClick={() => setThemeExpanded(!themeExpanded)}>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Deck Theme</h4>
            <span className="text-xs text-secondary-foreground">· {themeLabel}</span>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1"><Pencil className="h-3.5 w-3.5" /></button>
        </div>
        {themeExpanded && (
          <div className="px-4 py-3 border border-t-0 border-border rounded-b-sm card-gradient">
            <div className="flex flex-wrap items-center gap-3">
              {(["dark", "light", "custom"] as const).map(s => (
                <button key={s} onClick={() => onThemeChange({ ...theme, scheme: s })}
                  className={`text-xs px-4 py-2 rounded-sm border transition-colors capitalize font-medium ${theme.scheme === s ? "border-electric/40 text-foreground bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              ))}
              {theme.scheme === "custom" && (
                <div className="flex items-center gap-3 ml-2">
                  {[["Primary", "primary"], ["Background", "secondary"], ["Accent", "accent"]].map(([label, key]) => (
                    <label key={key} className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <input type="color" value={(theme as any)[key] || "#3b82f6"}
                        onChange={e => onThemeChange({ ...theme, [key]: e.target.value })}
                        className="w-7 h-7 rounded-sm border border-border cursor-pointer bg-transparent" />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-electric">Slide Framework</h3>
        <span className="text-[13px] text-secondary-foreground">{activeCount} of {slides.length} slides in export</span>
      </div>

      {/* Slide list */}
      <div className="space-y-4">
        {orderedSlides.map((slide, i) => {
          const isExcluded = excludedSlides.has(slide.originalIdx);
          const isEditing = editingSlide === slide.originalIdx;
          const layout = resolveLayout(slide.layoutRecommendation, slide.selectedLayout);

          return (
            <div key={slide.originalIdx}
              className={`rounded-sm border transition-all ${isExcluded ? "opacity-50 border-border" : "border-border hover:border-muted-foreground/20"} ${dragIdx === i ? "ring-2 ring-electric/30 scale-[0.99]" : ""}`}>

              {/* Action bar */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                <div className="cursor-grab text-muted-foreground hover:text-foreground transition-colors"
                  draggable onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)} onDragEnd={handleDragEnd}>
                  <GripVertical className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                {slide.categoryLabel && (
                  <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-electric">{slide.categoryLabel}</span>
                )}
                <LayoutPicker current={layout} onChange={(l) => onEditSlide?.(slide.originalIdx, "selectedLayout", l)} />

                {savedSlide === slide.originalIdx && (
                  <span className="text-[10px] text-emerald font-medium animate-fade-in flex items-center gap-1">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                )}

                <div className="ml-auto flex items-center gap-1.5">
                  {/* Edit toggle */}
                  {!isExcluded && onEditSlide && (
                    <button onClick={() => {
                      if (isEditing) { setSavedSlide(slide.originalIdx); setEditingSlide(null); setTimeout(() => setSavedSlide(null), 1500); }
                      else setEditingSlide(slide.originalIdx);
                    }}
                      className={`text-[11px] px-2.5 py-1 rounded-sm border font-medium flex items-center gap-1 transition-colors ${isEditing ? "border-electric text-electric bg-electric/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      <Pencil className="h-3 w-3" />{isEditing ? "Done" : "Edit"}
                    </button>
                  )}

                  {/* Refine */}
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setRefineOpen(refineOpen === i ? null : i); }}
                      disabled={refiningSlideIndex === slide.originalIdx}
                      className="text-[11px] px-2.5 py-1 rounded-sm border border-electric/30 text-electric hover:bg-electric/10 transition-colors font-medium flex items-center gap-1 disabled:opacity-50">
                      {refiningSlideIndex === slide.originalIdx ? <><Loader2 className="h-3 w-3 animate-spin" />...</> : <>Refine <ChevronDown className="h-2.5 w-2.5" /></>}
                    </button>
                    {refineOpen === i && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-0.5">
                        {REFINE_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={(e) => { e.stopPropagation(); setRefineOpen(null); onRefineSlide?.(slide.originalIdx, opt.value); }}
                            disabled={refiningSlideIndex === slide.originalIdx}
                            className={`w-full text-left text-[11px] px-3 py-1.5 hover:bg-accent transition-colors font-medium disabled:opacity-50 ${opt.value === "revert" ? "text-muted-foreground border-t border-border" : "text-foreground"}`}>
                            {opt.value === "revert" && <RotateCcw className="h-3 w-3 inline mr-1" />}{opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exclude / Restore */}
                  {!isExcluded ? (
                    <button onClick={() => onToggleSlide(slide.originalIdx)} className="p-1 rounded-sm text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors" title="Exclude">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => onToggleSlide(slide.originalIdx)} className="text-[11px] text-secondary-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 border border-border rounded-sm">
                      <RotateCcw className="h-3 w-3" /> Restore
                    </button>
                  )}
                </div>
              </div>

              {/* Slide canvas */}
              <div className={isExcluded ? "opacity-40 pointer-events-none" : ""}>
                <SlideCanvas
                  slide={{
                    headline: slide.headline,
                    subheadline: slide.subheadline,
                    bodyContent: slide.bodyContent,
                    categoryLabel: slide.categoryLabel,
                    closingStatement: slide.closingStatement,
                    layoutRecommendation: slide.layoutRecommendation,
                    selectedLayout: slide.selectedLayout,
                    dataPoints: slide.dataPoints,
                  }}
                  theme={theme}
                />
              </div>

              {/* Edit panel */}
              {isEditing && !isExcluded && (
                <div className="px-4 py-3 border-t border-border space-y-2 card-gradient">
                  <EditField label="Headline" value={slide.headline} onSave={(v) => onEditSlide?.(slide.originalIdx, "headline", v)} />
                  <EditField label="Subheadline" value={slide.subheadline || ""} onSave={(v) => onEditSlide?.(slide.originalIdx, "subheadline", v)} />
                  {(slide.bodyContent || []).map((bullet, bi) => (
                    <EditField key={bi} label={`Bullet ${bi + 1}`} value={bullet}
                      onSave={(v) => {
                        const updated = [...(slide.bodyContent || [])];
                        updated[bi] = v;
                        onEditSlide?.(slide.originalIdx, "bodyContent", updated);
                      }} />
                  ))}
                  <EditField label="Closing" value={slide.closingStatement || ""} onSave={(v) => onEditSlide?.(slide.originalIdx, "closingStatement", v)} />
                </div>
              )}

              {/* Suggestion */}
              {slide.suggestion && !dismissedSuggestions.includes(slide.originalIdx) && !isExcluded && (
                <div className="mx-3 mb-3 mt-1 bg-electric/[0.06] border border-electric/20 rounded-sm p-2.5 flex items-start gap-2.5">
                  <Lightbulb className="w-3.5 h-3.5 text-electric mt-0.5 shrink-0" />
                  <p className="text-[12px] text-foreground/80 flex-1">{slide.suggestion}</p>
                  <button onClick={() => setDismissedSuggestions(prev => [...prev, slide.originalIdx])} className="text-[11px] text-muted-foreground hover:text-foreground px-1">✕</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compact edit field ──
function EditField({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-muted-foreground w-16 shrink-0 pt-1.5 text-right">{label}</span>
      <input value={v} onChange={e => setV(e.target.value)} onBlur={() => { if (v !== value) onSave(v); }}
        className="flex-1 text-xs bg-transparent border-b border-border/50 focus:border-electric/50 outline-none px-1 py-1 text-foreground" />
    </div>
  );
}