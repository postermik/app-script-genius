import { useState } from "react";
import { SlidePreview, type SlideData, type DeckTheme } from "@/components/SlidePreview";
import { Layout } from "lucide-react";
import type { Deliverable } from "@/types/rhetoric";

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
  const [dismissedDeckSuggestions, setDismissedDeckSuggestions] = useState<number[]>([]);

  if (framework.length === 0) return null;

  const slides: SlideData[] = framework.map((slide: any, idx: number) => ({
    headline: typeof slide === "string" ? slide : (slide.headline || `Slide ${idx + 1}`),
    content: typeof slide === "object" ? (slide.body || slide.content || "") : "",
    slideType: slide?.metadata?.slideType,
    visualDirection: slide?.metadata?.visualDirection,
    categoryLabel: slide?.categoryLabel,
    closingStatement: slide?.closingStatement,
    layoutRecommendation: slide?.layoutRecommendation,
    suggestion: slide?.suggestion,
  }));

  const deckSuggestions = deliverable.suggestions || [];

  return (
    <div>
      {/* Deck-level structural suggestions */}
      {deckSuggestions.length > 0 && (
        <div className="mb-6 space-y-2">
          {deckSuggestions.map((suggestion, i) =>
            dismissedDeckSuggestions.includes(i) ? null : (
              <div key={i} className="bg-accent/30 border border-accent/40 rounded-sm p-3 flex items-center gap-3">
                <Layout className="w-4 h-4 text-accent-foreground shrink-0" />
                <p className="text-sm text-foreground/80 flex-1">{suggestion}</p>
                <button
                  onClick={() => setDismissedDeckSuggestions(prev => [...prev, i])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
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
      />
    </div>
  );
}
