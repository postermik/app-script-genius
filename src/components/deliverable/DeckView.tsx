import { useState } from "react";
import { SlidePreview, type SlideData, type DeckTheme } from "@/components/SlidePreview";
import type { Deliverable } from "@/types/rhetoric";

interface Props {
  deliverable: Deliverable;
  excludedSlides: Set<number>;
  onToggleSlide: (idx: number) => void;
  slideOrder: number[];
  onReorder: (order: number[]) => void;
  deckTheme: DeckTheme;
  onThemeChange: (theme: DeckTheme) => void;
}

export function DeckView({ deliverable, excludedSlides, onToggleSlide, slideOrder, onReorder, deckTheme, onThemeChange }: Props) {
  const framework = deliverable.deckFramework || [];
  if (framework.length === 0) return null;

  const slides: SlideData[] = framework.map((slide: any, idx: number) => ({
    headline: typeof slide === "string" ? slide : (slide.headline || `Slide ${idx + 1}`),
    content: typeof slide === "object" ? (slide.body || slide.content || "") : "",
    slideType: slide?.metadata?.slideType,
    visualDirection: slide?.metadata?.visualDirection,
    categoryLabel: slide?.categoryLabel,
    closingStatement: slide?.closingStatement,
    layoutRecommendation: slide?.layoutRecommendation,
  }));

  return (
    <SlidePreview
      slides={slides}
      excludedSlides={excludedSlides}
      onToggleSlide={onToggleSlide}
      slideOrder={slideOrder}
      onReorder={onReorder}
      theme={deckTheme}
      onThemeChange={onThemeChange}
    />
  );
}
