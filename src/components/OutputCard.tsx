import { useState } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import type { RefinementTone } from "@/types/narrative";
import { Loader2, Lock, Pencil, ChevronDown, ChevronUp } from "lucide-react";

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
    <div className="group rounded-sm accent-left-border card-gradient border border-border p-8 mb-6 transition-all hover:border-muted-foreground/20 hover:shadow-lg hover:shadow-electric/[0.03]">
      <div className="flex items-start justify-between mb-5">
        <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">
          {label}
        </h3>
        {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
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

      {/* Refine trigger - always visible */}
      {!locked && (
        <div className="mt-5 pt-4 border-t border-border/50 flex justify-end">
          {!showRefine ? (
            <button
              onClick={() => setShowRefine(true)}
              className="text-xs text-electric/80 hover:text-electric flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-sm border border-electric/20 hover:bg-electric/5 hover:border-electric/30 font-medium"
            >
              <Pencil className="h-3 w-3" />
              Refine
              <ChevronDown className="h-3 w-3" />
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 animate-fade-in">
              {REFINEMENTS.map((r) => (
                <button
                  key={r.tone}
                  onClick={() => { refineSection(sectionKey, path, r.tone); setShowRefine(false); }}
                  disabled={isRefining}
                  className="text-xs text-foreground/75 px-3 py-1.5 rounded-sm border border-border hover:text-electric hover:bg-electric/5 hover:border-electric/20 transition-colors disabled:opacity-30 font-medium"
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => setShowRefine(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors"
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
