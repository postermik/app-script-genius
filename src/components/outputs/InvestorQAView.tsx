import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Pencil, Check } from "lucide-react";
import type { InvestorQAItem } from "@/types/rhetoric";

interface Props {
  items: InvestorQAItem[];
  onRefineItem?: (index: number) => void;
  refiningIndex?: number | null;
  onEditItem?: (index: number, field: string, value: string) => void;
}

export function InvestorQAView({ items, onRefineItem, refiningIndex, onEditItem }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

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
                <div className="flex items-center justify-between mb-2">
                  {savedIndex === i && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald font-medium animate-fade-in">
                      <Check className="h-3 w-3" /> Saved
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {onEditItem && (
                      <button
                        onClick={() => {
                          if (editingIndex === i) {
                            setSavedIndex(i);
                            setEditingIndex(null);
                            setTimeout(() => setSavedIndex(null), 1500);
                          } else {
                            setEditingIndex(i);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 w-[72px] justify-center rounded-sm text-[11px] font-medium border transition-colors ${
                          editingIndex === i
                            ? "border-electric text-electric bg-electric/10"
                            : "border-border text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        {editingIndex === i ? "Done" : "Edit"}
                      </button>
                    )}
                    {onRefineItem && (
                      <button
                        onClick={() => onRefineItem(i)}
                        disabled={refiningIndex === i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 w-[72px] justify-center rounded-sm text-[11px] font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`h-2.5 w-2.5 ${refiningIndex === i ? "animate-spin" : ""}`} />
                        Refine
                      </button>
                    )}
                  </div>
                </div>
                <p className={`text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap outline-none rounded-sm transition-all ${editingIndex === i ? "ring-1 ring-electric/30 px-3 py-2 -mx-3" : ""}`}
                  contentEditable={editingIndex === i}
                  suppressContentEditableWarning
                  onBlur={(e) => onEditItem?.(i, "answer", e.currentTarget.textContent || "")}
                >
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}