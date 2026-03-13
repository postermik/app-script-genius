import { useState } from "react";
import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";
import type { SlideData, DeckTheme } from "@/components/SlidePreview";
import { SlidePreview } from "@/components/SlidePreview";
import { SectionEditor } from "./SectionEditor";
import { useSuggestionApply } from "@/hooks/useSuggestionApply";

interface Props {
  deliverable: Deliverable;
  onUpdateDeliverable?: (d: Deliverable) => void;
}

export function DocumentView({ deliverable, onUpdateDeliverable }: Props) {
  const [excludedSlides, setExcludedSlides] = useState<Set<number>>(new Set());
  const [slideOrder, setSlideOrder] = useState<number[]>(() =>
    (deliverable.boardDeckOutline || []).map((_, i) => i)
  );
  const [deckTheme, setDeckTheme] = useState<DeckTheme>({ scheme: "dark", primary: "#3b82f6", secondary: "#0b0f14", accent: "#1e3a5f" });
  const [dismissedSuggestions, setDismissedSuggestions] = useState<number[]>([]);
  const { applyingIndex, applySuggestion } = useSuggestionApply(deliverable, onUpdateDeliverable);

  const handleDismiss = (i: number) => setDismissedSuggestions(prev => [...prev, i]);

  const handleSaveEdit = (index: number, newContent: string) => {
    if (!onUpdateDeliverable || !deliverable.sections) return;
    const updated = [...deliverable.sections];
    updated[index] = { ...updated[index], content: newContent };
    onUpdateDeliverable({ ...deliverable, sections: updated });
  };

  const handleCopy = () => {
    const parts: string[] = [];
    deliverable.sections?.forEach(s => { parts.push(s.heading); parts.push(s.content); parts.push(""); });
    navigator.clipboard.writeText(parts.join("\n"));
    toast.success("Document copied to clipboard.");
  };

  const boardSlides: SlideData[] = (deliverable.boardDeckOutline || []).map((slide: any, idx: number) => ({
    headline: typeof slide === "string" ? slide : (slide.headline || `Slide ${idx + 1}`),
    content: typeof slide === "object" ? (slide.body || slide.content || "") : "",
    slideType: slide?.metadata?.slideType,
    visualDirection: slide?.metadata?.visualDirection,
    categoryLabel: slide?.categoryLabel,
    closingStatement: slide?.closingStatement,
    layoutRecommendation: slide?.layoutRecommendation,
  }));

  const toggleSlide = (idx: number) => {
    setExcludedSlides(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {deliverable.sections?.map((section, i) => (
        <SectionEditor
          key={i}
          section={section}
          index={i}
          dismissed={dismissedSuggestions.includes(i)}
          applyingIndex={applyingIndex}
          onApplySuggestion={applySuggestion}
          onDismissSuggestion={handleDismiss}
          onRemixSection={(sectionIndex, newContent) => {
            if (!deliverable.sections || !onUpdateDeliverable) return;
            const updated = [...deliverable.sections];
            updated[sectionIndex] = { ...updated[sectionIndex], content: newContent };
            onUpdateDeliverable({ ...deliverable, sections: updated });
          }}
          onSaveEdit={handleSaveEdit}
        />
      ))}

      <button
        onClick={handleCopy}
        className="mt-4 mb-8 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm px-3 py-1.5 transition-colors"
      >
        Copy document to clipboard
      </button>

      {boardSlides.length > 0 && (
        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric mb-6">Board Deck Outline</h3>
          <SlidePreview
            slides={boardSlides}
            excludedSlides={excludedSlides}
            onToggleSlide={toggleSlide}
            slideOrder={slideOrder}
            onReorder={setSlideOrder}
            theme={deckTheme}
            onThemeChange={setDeckTheme}
          />
        </div>
      )}
    </div>
  );
}
