import { useState } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import type { RefinementTone } from "@/types/narrative";
import { Loader2, Lock, Wand2 } from "lucide-react";

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
  const [showTools, setShowTools] = useState(false);

  return (
    <div
      className="group rounded-sm border border-border bg-card/40 p-6 mb-4 transition-colors hover:border-muted-foreground/15"
      onMouseEnter={() => setShowTools(true)}
      onMouseLeave={() => setShowTools(false)}
    >
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

      {!locked && (
        <div className={`flex flex-wrap gap-1 mt-4 transition-all duration-200 ${
          showTools ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        }`}>
          <Wand2 className="h-3 w-3 text-muted-foreground/50 mr-1 mt-0.5" />
          {REFINEMENTS.map((r) => (
            <button
              key={r.tone}
              onClick={() => refineSection(sectionKey, path, r.tone)}
              disabled={isRefining}
              className="text-[10px] text-muted-foreground/60 px-2 py-0.5 rounded-sm hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
