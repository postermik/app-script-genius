import { useState } from "react";
import { OutputCard } from "@/components/OutputCard";
import { ChevronDown, ChevronUp, TrendingUp, Clock, AlertTriangle } from "lucide-react";

interface Section {
  key: string;
  path: string;
  label: string;
  content: string;
}

interface Props {
  sections: Section[];
}

const SUPPORTING_META: Record<string, { icon: React.ReactNode; subtitle: string }> = {
  "market-logic": { icon: <TrendingUp className="h-3.5 w-3.5" />, subtitle: "Why the economics work" },
  "why-now": { icon: <Clock className="h-3.5 w-3.5" />, subtitle: "Why this moment matters" },
  "risks": { icon: <AlertTriangle className="h-3.5 w-3.5" />, subtitle: "What could go wrong (and why it won't)" },
};

export function ThesisTab({ sections }: Props) {
  const thesis = sections.find(s => s.key === "thesis-content");
  const coreInsight = sections.find(s => s.key === "thesis-insight");
  const supporting = sections.filter(s => ["market-logic", "why-now", "risks"].includes(s.key));
  const [openAccordion, setOpenAccordion] = useState<string | null>("market-logic");

  return (
    <div className="space-y-8">
      {/* Primary: Investment Thesis */}
      {thesis && (
        <OutputCard
          label={thesis.label}
          content={thesis.content}
          path={thesis.path}
          sectionKey={thesis.key}
        />
      )}

      {/* Core Insight as pull quote */}
      {coreInsight && coreInsight.content && (
        <div className="relative rounded-sm border border-electric/20 bg-electric/[0.04] p-8 my-2">
          <div className="absolute top-4 left-6 text-electric/30 text-4xl font-serif leading-none">"</div>
          <p className="text-lg text-foreground/90 leading-relaxed italic pl-6 pr-4">
            {coreInsight.content}
          </p>
          <p className="text-xs text-electric/60 uppercase tracking-[0.12em] font-semibold mt-4 pl-6">Core Insight</p>
        </div>
      )}

      {/* Supporting Arguments accordion */}
      {supporting.length > 0 && (
        <div className="rounded-sm border border-border card-gradient">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Supporting Arguments</h3>
          </div>
          <div className="divide-y divide-border">
            {supporting.map(section => {
              const meta = SUPPORTING_META[section.key];
              const isOpen = openAccordion === section.key;
              return (
                <div key={section.key}>
                  <button
                    onClick={() => setOpenAccordion(isOpen ? null : section.key)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-electric">{meta?.icon}</span>
                      <div>
                        <span className="text-sm font-semibold text-foreground">{section.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{meta?.subtitle}</span>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 animate-tab-enter">
                      <OutputCard
                        label={section.label}
                        content={section.content}
                        path={section.path}
                        sectionKey={section.key}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
