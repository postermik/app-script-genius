import { useState } from "react";
import { ChevronLeft, ChevronRight, Grid3X3, Layers } from "lucide-react";
import type { DeckSlide } from "@/types/narrative";

interface SlideData {
  headline: string;
  content: string;
  slideType?: string;
  visualDirection?: string;
}

interface Props {
  slides: SlideData[];
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
    quote: "bg-indigo/20 text-indigo",
    framework: "bg-yellow-400/20 text-yellow-400",
    roadmap: "bg-purple-400/20 text-purple-400",
    financial: "bg-orange-400/20 text-orange-400",
    split: "bg-cyan-400/20 text-cyan-400",
  };
  return type ? colors[type] || "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground";
}

export function SlidePreview({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");

  if (slides.length === 0) return null;

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(slides.length - 1, c + 1));

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
          Slide Preview
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("carousel")}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === "carousel" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === "grid" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {viewMode === "carousel" ? (
        <div>
          <div className="slide-card aspect-video flex flex-col justify-between p-8 relative">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-electric rounded-t-sm" />
            
            {/* Slide type badge */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getLayoutColor(slides[current].slideType)}`}>
                {getLayoutLabel(slides[current].slideType)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {current + 1} / {slides.length}
              </span>
            </div>

            {/* Slide content */}
            <div className="flex-1 flex flex-col justify-center py-4">
              <h4 className="text-lg font-bold text-foreground leading-tight mb-3">
                {slides[current].headline}
              </h4>
              {slides[current].content && (
                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-4">
                  {slides[current].content}
                </p>
              )}
            </div>

            {/* Visual direction hint */}
            {slides[current].visualDirection && (
              <p className="text-[10px] text-muted-foreground/50">
                Visual: {slides[current].visualDirection}
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={prev} disabled={current === 0}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-electric" : "bg-muted-foreground/30"}`} />
              ))}
            </div>
            <button onClick={next} disabled={current === slides.length - 1}
              className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setViewMode("carousel"); }}
              className="slide-card aspect-video flex flex-col justify-between p-4 text-left"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${getLayoutColor(slide.slideType)}`}>
                  {getLayoutLabel(slide.slideType)}
                </span>
                <span className="text-[9px] text-muted-foreground">{i + 1}</span>
              </div>
              <div className="flex-1 flex flex-col justify-center py-2">
                <h5 className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
                  {slide.headline}
                </h5>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
