import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import type { InvestorQAItem } from "@/types/rhetoric";

interface Props {
  items: InvestorQAItem[];
  onRefineItem?: (index: number) => void;
  refiningIndex?: number | null;
}

export function InvestorQAView({ items, onRefineItem, refiningIndex }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">
        Investor Questions & Suggested Answers
      </p>
      {items.map((item, i) => {
        const expanded = expandedIndex === i;
        return (
          <div key={i} className="card-gradient rounded-sm border border-border overflow-hidden">
            <button
              onClick={() => setExpandedIndex(expanded ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground pr-4 leading-snug">
                <span className="text-electric text-xs font-bold mr-2">Q{i + 1}</span>
                {item.question}
              </span>
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </button>
            {expanded && (
              <div className="px-5 pb-4 border-t border-border pt-3 animate-fade-in">
                <p className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap">
                  {item.answer}
                </p>
                {onRefineItem && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => onRefineItem(i)}
                      disabled={refiningIndex === i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-2.5 w-2.5 ${refiningIndex === i ? "animate-spin" : ""}`} />
                      Refine
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
