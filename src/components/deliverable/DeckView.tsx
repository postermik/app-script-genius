import { useState } from "react";
import { SlidePreview, type SlideData, type DeckTheme } from "@/components/SlidePreview";
import { Layout, Loader2 } from "lucide-react";
import type { Deliverable } from "@/types/rhetoric";
import { useDecksmith } from "@/context/DecksmithContext";

interface Props {
  deliverable: Deliverable;
  excludedSlides: Set<number>;
  onToggleSlide: (idx: number) => void;
  slideOrder: number[];
  onReorder: (order: number[]) => void;
  deckTheme: DeckTheme;
  onThemeChange: (theme: DeckTheme) => void;
  onUpdateDeliverable?: (d: Deliverable) => void;
}

export function DeckView({ deliverable, excludedSlides, onToggleSlide, slideOrder, onReorder, deckTheme, onThemeChange, onUpdateDeliverable }: Props) {
  const framework = deliverable.deckFramework || [];
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [fadingOut, setFadingOut] = useState<number[]>([]);
  const [refiningSlideIndex, setRefiningSlideIndex] = useState<number | null>(null);
  const [applyingSuggestionSlideIndex, setApplyingSuggestionSlideIndex] = useState<number | null>(null);
  const { applyDeckSuggestion, dismissedSuggestions, dismissSuggestion, refineSection, appliedSuggestions, applySlideSuggestion } = useDecksmith();

  if (framework.length === 0) return null;

  // Filter out generic placeholder/scaffolding text that leaked from prompts
  const isPlaceholderText = (text: string): boolean => {
    if (!text) return false;
    const placeholders = [
      "key supporting context for your narrative",
      "key supporting data point",
      "strategic context and framing",
      "evidence that reinforces the narrative",
      "supporting slide that reinforces the core narrative",
      "supporting detail about the market",
    ];
    return placeholders.some(p => text.toLowerCase().includes(p));
  };

  const slides: SlideData[] = framework.map((slide: any, idx: number) => {
    const rawContent = typeof slide === "object" ? (slide.body || slide.content || "") : "";
    const rawClosing = slide?.closingStatement || "";
    const rawBodyContent = slide?.bodyContent;
    const filteredBodyContent = Array.isArray(rawBodyContent)
      ? rawBodyContent.filter((item: string) => !isPlaceholderText(item))
      : rawBodyContent;
    return {
      headline: typeof slide === "string" ? slide : (slide.headline || `Slide ${idx + 1}`),
      content: isPlaceholderText(rawContent) ? "" : rawContent,
      slideType: slide?.metadata?.slideType,
      visualDirection: slide?.metadata?.visualDirection,
      categoryLabel: slide?.categoryLabel,
      closingStatement: isPlaceholderText(rawClosing) ? "" : rawClosing,
      layoutRecommendation: slide?.layoutRecommendation,
      suggestion: slide?.suggestion,
      bodyContent: filteredBodyContent,
      subheadline: isPlaceholderText(slide?.subheadline || "") ? "" : slide?.subheadline,
      selectedLayout: slide?.selectedLayout,
      dataPoints: slide?.metadata?.dataPoints || [],
      tiers: slide?.tiers,
      flywheelSteps: slide?.flywheelSteps,
      milestones: slide?.milestones,
      competitors: slide?.competitors,
      cards: slide?.cards,
      axisLabels: slide?.axisLabels,
    };
  });

  const handleEditSlide = (slideIndex: number, field: string, value: string | string[]) => {
    if (!onUpdateDeliverable) return;
    const updatedFramework = [...framework];
    const slide = { ...updatedFramework[slideIndex] };
    if (field === "bodyContent") {
      slide.bodyContent = value;
    } else {
      (slide as any)[field] = value;
    }
    updatedFramework[slideIndex] = slide;
    onUpdateDeliverable({ ...deliverable, deckFramework: updatedFramework });
  };

  const deckSuggestions = deliverable.suggestions || [];

  const handleApplySuggestion = async (suggestion: string, index: number) => {
    setApplyingIndex(index);
    try {
      await applyDeckSuggestion(suggestion, index);
      setFadingOut(prev => [...prev, index]);
    } catch {
      // applyDeckSuggestion already shows toast
    } finally {
      setApplyingIndex(null);
    }
  };

  const handleRefineSlide = async (slideIndex: number, tone: string) => {
    setRefiningSlideIndex(slideIndex);
    try {
      await refineSection(`slide-${slideIndex}`, `deckFramework.${slideIndex}`, tone as any);
    } catch {
      // refineSection already shows toast
    } finally {
      setRefiningSlideIndex(null);
    }
  };

  const handleApplySlideSuggestion = async (slideIndex: number, suggestion: string) => {
    setApplyingSuggestionSlideIndex(slideIndex);
    try {
      await applySlideSuggestion(slideIndex, suggestion);
    } catch {
      // applySlideSuggestion already shows toast
    } finally {
      setApplyingSuggestionSlideIndex(null);
    }
  };

  return (
    <div>
      {/* Deck-level structural suggestions */}
      {deckSuggestions.length > 0 && (
        <div className="mb-3 space-y-2">
          {deckSuggestions.map((suggestion, i) =>
            dismissedSuggestions.has(i) || fadingOut.includes(i) || appliedSuggestions.has(`deck-${i}`) ? null : (
              <div
                key={i}
                className={`bg-accent/30 border border-accent/40 rounded-sm p-3 flex items-center gap-3 transition-all duration-400 ${
                  fadingOut.includes(i) ? "opacity-0 max-h-0 py-0 my-0 overflow-hidden" : "opacity-100 max-h-24"
                }`}
              >
                <Layout className="w-4 h-4 text-accent-foreground shrink-0" />
                <p className="text-sm text-foreground/80 flex-1">{suggestion}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApplySuggestion(suggestion, i)}
                    disabled={applyingIndex === i}
                    className="text-xs px-3 py-1.5 rounded-sm font-medium bg-electric text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {applyingIndex === i ? <><Loader2 className="w-3 h-3 animate-spin" /> Applying...</> : "Apply"}
                  </button>
                  <button
                    onClick={() => dismissSuggestion(i)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <SlidePreview
        slides={slides}
        excludedSlides={excludedSlides}
        onToggleSlide={onToggleSlide}
        slideOrder={slideOrder}
        onReorder={onReorder}
        theme={deckTheme}
        onThemeChange={onThemeChange}
        onRefineSlide={handleRefineSlide}
        refiningSlideIndex={refiningSlideIndex}
        onEditSlide={handleEditSlide}
        onApplySuggestion={handleApplySlideSuggestion}
        applyingSuggestionSlideIndex={applyingSuggestionSlideIndex}
      />
    </div>
  );
}