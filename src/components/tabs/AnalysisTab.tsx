import { useState } from "react";
import { ChevronDown, ChevronUp, Quote } from "lucide-react";
import type { AnalysisData, RhetoricScore } from "@/types/rhetoric";
import { ScoreTab } from "./ScoreTab";

interface Props {
  analysis: AnalysisData;
  score: RhetoricScore;
  mode: string;
}

export function AnalysisTab({ analysis, score, mode }: Props) {
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Summary */}
      {analysis.summary && (
        <div className="card-gradient rounded-sm border border-border p-5">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-3">Assessment Summary</h3>
          <p className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap">{analysis.summary}</p>
        </div>
      )}

      {/* Score section */}
      <ScoreTab score={score} mode={mode} />

      {/* Slide-by-slide */}
      {analysis.slideBySlide && analysis.slideBySlide.length > 0 && (
        <div className="card-gradient rounded-sm border border-border p-5">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">Slide-by-Slide Analysis</h3>
          <div className="space-y-2">
            {analysis.slideBySlide.map((slide, i) => (
              <div key={i} className="border border-border rounded-sm overflow-hidden">
                <button
                  onClick={() => setExpandedSlide(expandedSlide === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/30 transition-colors"
                >
                  <span className="text-xs font-medium text-foreground">{slide.originalSlide}</span>
                  {expandedSlide === i ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                {expandedSlide === i && (
                  <div className="px-4 pb-4 space-y-3 animate-fade-in">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Assessment</p>
                      <p className="text-xs text-secondary-foreground leading-relaxed">{slide.assessment}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-electric uppercase tracking-wide font-semibold mb-1">Suggestion</p>
                      <p className="text-xs text-secondary-foreground leading-relaxed">{slide.suggestion}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Questions */}
      {analysis.commonQuestions && analysis.commonQuestions.length > 0 && (
        <div className="card-gradient rounded-sm border border-border p-5">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">Common Questions</h3>
          <div className="space-y-3">
            {analysis.commonQuestions.map((q, i) => (
              <div key={i} className="rounded-sm border border-border bg-muted/30 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 bg-accent/20">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xs text-electric font-bold">Q{i + 1}</span>
                    {q.question}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{q.suggestedAnswer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Phrases */}
      {analysis.keyPhrases && analysis.keyPhrases.length > 0 && (
        <div className="card-gradient rounded-sm border border-electric/20 bg-electric/[0.04] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Quote className="h-4 w-4 text-electric" />
            <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric">Key Phrases</h3>
          </div>
          <div className="space-y-2">
            {analysis.keyPhrases.map((phrase, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-sm bg-background/60 border border-border">
                <p className="text-sm text-foreground/90 leading-relaxed italic">"{phrase}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
