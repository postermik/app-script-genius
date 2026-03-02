import { useDecksmith } from "@/context/DecksmithContext";
import type { RefinementTone } from "@/types/narrative";
import { Loader2, Lock } from "lucide-react";

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

  return (
    <div className="py-8 border-b border-border last:border-0">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
          {label}
        </h3>
        {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />}
      </div>

      <div className="relative">
        <div className={`text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap transition-all ${
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
        <div className="flex flex-wrap gap-1.5 mt-4">
          {REFINEMENTS.map((r) => (
            <button
              key={r.tone}
              onClick={() => refineSection(sectionKey, path, r.tone)}
              disabled={isRefining}
              className="text-[11px] text-muted-foreground px-2.5 py-1 border border-border rounded-sm hover:text-foreground hover:border-muted-foreground/30 transition-colors disabled:opacity-30"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
