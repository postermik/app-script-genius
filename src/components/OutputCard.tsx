import { useState } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import type { RefinementTone } from "@/types/narrative";
import { Loader2, Lock, Pencil, ChevronDown } from "lucide-react";

const REFINEMENTS: { label: string; tone: RefinementTone }[] = [
  { label: "Refine", tone: "refine" },
  { label: "Sharper", tone: "sharper" },
  { label: "Visionary", tone: "visionary" },
  { label: "Analytical", tone: "analytical" },
  { label: "Condense", tone: "condense" },
  { label: "Expand", tone: "expand" },
];

interface Props {
  label: string;
  content: string;
  path: string;
  sectionKey: string;
  locked?: boolean;
}

export function OutputCard({ label, content, path, sectionKey, locked }: Props) {
  const { refineSection, refiningSection } = useDecksmith();
  const isRefining = refiningSection === sectionKey;
  const [showRefine, setShowRefine] = useState(false);

  return (
    <div className="group rounded-sm accent-left-border card-gradient border border-border p-7 mb-6 transition-all hover:border-muted-foreground/15 hover:shadow-lg hover:shadow-electric/[0.03]">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">
          {label}
        </h3>
        {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />}
      </div>

      <div className="relative">
        <div className={`text-[15px] text-foreground/85 leading-[1.85] whitespace-pre-wrap transition-all ${
          isRefining ? "opacity-30" : ""
        } ${locked ? "blur-sm select-none" : ""}`}>
          {content}
        </div>

        {isRefining && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-electric" />
          </div>
        )}
      </div>

      {/* Always-visible refine trigger */}
      {!locked && (
        <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
          {!showRefine ? (
            <button
              onClick={() => setShowRefine(true)}
              className="text-[11px] text-electric/60 hover:text-electric flex items-center gap-1 transition-colors px-2 py-1 rounded-sm hover:bg-electric/5"
            >
              <Pencil className="h-3 w-3" />
              Refine
              <ChevronDown className="h-3 w-3" />
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 animate-fade-in">
              {REFINEMENTS.map((r) => (
                <button
                  key={r.tone}
                  onClick={() => { refineSection(sectionKey, path, r.tone); setShowRefine(false); }}
                  disabled={isRefining}
                  className="text-[10px] text-muted-foreground px-2.5 py-1 rounded-sm border border-border hover:text-electric hover:bg-electric/5 hover:border-electric/20 transition-colors disabled:opacity-30"
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => setShowRefine(false)}
                className="text-[10px] text-muted-foreground/40 hover:text-foreground px-1.5 py-1 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
