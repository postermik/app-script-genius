import { useState } from "react";
import { OutputCard } from "@/components/OutputCard";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Section {
  key: string;
  path: string;
  label: string;
  content: string;
}

interface Props {
  sections: Section[];
}

const ARC_META: Record<string, { step: number; purpose: string; emoji: string }> = {
  "world-today": { step: 1, purpose: "Set the stage: what's broken?", emoji: "🌍" },
  "breaking-point": { step: 2, purpose: "Create urgency: why now?", emoji: "⚡" },
  "new-model": { step: 3, purpose: "Present the answer: your solution", emoji: "💡" },
  "why-wins": { step: 4, purpose: "Prove it works: your edge", emoji: "🏆" },
  "the-future": { step: 5, purpose: "Paint the vision: where this goes", emoji: "🚀" },
};

const MAX_COLLAPSED_LENGTH = 400;

export function NarrativeArcTab({ sections }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-0">
      {/* Arc header */}
      <div className="flex items-center gap-2 mb-8">
        <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Narrative Arc</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-electric/30 to-transparent" />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[22px] top-4 bottom-4 w-px bg-gradient-to-b from-electric/40 via-electric/20 to-transparent" />

        <div className="space-y-1">
          {sections.map((section, i) => {
            const meta = ARC_META[section.key] || { step: i + 1, purpose: "Part of the narrative arc", emoji: "📄" };
            const isLong = section.content.length > MAX_COLLAPSED_LENGTH;
            const isExpanded = expandedSections.has(section.key);
            const displayContent = isLong && !isExpanded
              ? section.content.slice(0, MAX_COLLAPSED_LENGTH) + "..."
              : section.content;
            const isLast = i === sections.length - 1;

            return (
              <div key={section.key} className="relative flex gap-5 group">
                {/* Step marker */}
                <div className="relative z-10 flex flex-col items-center shrink-0 pt-6">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg border-2 transition-colors ${
                    i === 0 ? "border-electric bg-electric/15" : "border-border bg-card group-hover:border-electric/40"
                  }`}>
                    {meta.emoji}
                  </div>
                  {!isLast && (
                    <div className="w-5 h-5 flex items-center justify-center text-muted-foreground/40 mt-1">
                      ↓
                    </div>
                  )}
                </div>

                {/* Content card */}
                <div className="flex-1 pb-4">
                  <div className="rounded-sm border border-border card-gradient accent-left-border p-6 hover:border-muted-foreground/20 transition-all">
                    {/* Purpose label */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold tracking-[0.1em] uppercase text-electric">
                        Step {meta.step}: {section.label}
                      </span>
                      <span className="text-xs text-muted-foreground italic">{meta.purpose}</span>
                    </div>

                    {/* Content */}
                    <div className="text-[15px] text-foreground/85 leading-[1.85] whitespace-pre-wrap">
                      {displayContent}
                    </div>

                    {/* Read more / Collapse + Refine */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      {isLong && (
                        <button
                          onClick={() => toggleExpand(section.key)}
                          className="text-xs text-electric/80 hover:text-electric flex items-center gap-1 transition-colors font-medium"
                        >
                          {isExpanded ? (
                            <><ChevronUp className="h-3 w-3" /> Collapse</>
                          ) : (
                            <><ChevronDown className="h-3 w-3" /> Read more</>
                          )}
                        </button>
                      )}
                      <div className={isLong ? "" : "ml-auto"}>
                        <OutputCard
                          label=""
                          content=""
                          path={section.path}
                          sectionKey={section.key}
                          refineOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
