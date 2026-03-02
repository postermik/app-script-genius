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
    <div className="group rounded-sm border border-border bg-card/40 p-6 mb-4 transition-colors hover:border-muted-foreground/15">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric/70">
          {label}
        </h3>
        {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />}
      </div>

      <div className="relative">
        <div className={`text-[15px] text-foreground/85 leading-[1.75] whitespace-pre-wrap transition-all ${
          isRefining ? "opacity-30" : ""
        } ${locked ? "blur-sm select-none" : ""}`}>
          {content}
        </div>

        {isRefining && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Always-visible refine trigger */}
      {!locked && (
        <div className="mt-3 flex justify-end">
          {!showRefine ? (
            <button
              onClick={() => setShowRefine(true)}
              className="text-[11px] text-muted-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded-sm hover:bg-accent"
            >
              <Pencil className="h-3 w-3" />
              Refine
              <ChevronDown className="h-3 w-3" />
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-1 animate-fade-in">
              {REFINEMENTS.map((r) => (
                <button
                  key={r.tone}
                  onClick={() => { refineSection(sectionKey, path, r.tone); setShowRefine(false); }}
                  disabled={isRefining}
                  className="text-[10px] text-muted-foreground px-2.5 py-1 rounded-sm border border-border hover:text-foreground hover:bg-accent hover:border-muted-foreground/20 transition-colors disabled:opacity-30"
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
