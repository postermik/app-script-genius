import { AlertTriangle, TrendingUp, Lightbulb, Check } from "lucide-react";
import type { RhetoricScore } from "@/types/rhetoric";

const SCORE_LABELS: Record<string, string> = {
  clarity: "Clarity", marketFraming: "Market Framing", differentiation: "Differentiation",
  riskTransparency: "Risk Transparency", persuasiveStructure: "Persuasive Structure",
  metricCompleteness: "Metric Completeness", strategicAlignment: "Strategic Alignment",
  actionability: "Actionability", marketInsight: "Market Insight",
  competitivePositioning: "Competitive Positioning", feasibility: "Feasibility",
  userInsight: "User Insight", solutionFit: "Solution Fit",
  narrativeCoherence: "Narrative Coherence", transparency: "Transparency",
  momentumSignal: "Momentum Signal", brevity: "Brevity",
};

interface CoachingItem {
  type: "weakness" | "objection" | "opportunity";
  title: string;
  detail: string;
  fix: string;
}

function generateCoachingItems(score: RhetoricScore): CoachingItem[] {
  const items: CoachingItem[] = [];
  const components = score.components;

  if (components) {
    const entries = Object.entries(components) as [string, number][];
    const weak = entries.filter(([, v]) => v < 80).sort((a, b) => a[1] - b[1]);
    for (const [key, value] of weak) {
      const label = SCORE_LABELS[key] || key;
      items.push({
        type: "weakness",
        title: `${label} scores ${value}/100`,
        detail: score.gaps?.find(g => g.toLowerCase().includes(key.toLowerCase())) || `This area needs improvement.`,
        fix: score.improvements?.find(i => i.toLowerCase().includes(key.toLowerCase())) || `Review and strengthen the ${label} section.`,
      });
    }
  }

  if (score.gaps) {
    for (const gap of score.gaps.slice(0, 3)) {
      if (!items.some(i => i.detail === gap)) {
        items.push({
          type: "objection",
          title: gap,
          detail: "This gap may be probed by your audience. Being prepared turns a weakness into a signal of maturity.",
          fix: "Acknowledge the concern directly, then pivot to your mitigation plan with specific evidence.",
        });
      }
    }
  }

  for (const imp of (score.improvements || []).slice(0, 2)) {
    items.push({ type: "opportunity", title: imp, detail: "This improvement could meaningfully increase your narrative score.", fix: "Apply this recommendation and refine the relevant section." });
  }

  return items;
}

interface Props {
  score: RhetoricScore;
}

export function CoachingTab({ score }: Props) {
  const items = generateCoachingItems(score);

  if (items.length === 0) {
    return (
      <div className="card-gradient rounded-sm border border-border p-5 text-center">
        <Check className="h-6 w-6 text-emerald mx-auto mb-2" />
        <p className="text-xs text-foreground font-medium">Looking great!</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">No major coaching items identified.</p>
      </div>
    );
  }

  const weaknesses = items.filter(i => i.type === "weakness");
  const objections = items.filter(i => i.type === "objection");
  const opportunities = items.filter(i => i.type === "opportunity");

  return (
    <div className="space-y-4">
      <div className="card-gradient rounded-sm border border-border p-5">
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">Coaching ({items.length})</h3>
        <div className="space-y-4">
          {weaknesses.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3 w-3 text-yellow-400" /> Areas to Strengthen
              </p>
              <div className="space-y-2">
                {weaknesses.map((item, idx) => (
                  <div key={`w-${idx}`} className="p-3 rounded-sm bg-muted/50 border border-border accent-left-border">
                    <p className="text-xs font-semibold text-foreground mb-0.5">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{item.detail}</p>
                    <div className="p-2.5 rounded-sm bg-background/50 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">How to Fix</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{item.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {objections.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3 w-3 text-destructive" /> Potential Objections
              </p>
              <div className="space-y-2">
                {objections.map((item, idx) => (
                  <div key={`o-${idx}`} className="p-3 rounded-sm bg-destructive/5 border border-destructive/15">
                    <p className="text-xs font-semibold text-foreground mb-1">"{item.title}"</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{item.detail}</p>
                    <div className="p-2.5 rounded-sm bg-background/50 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Suggested Response</p>
                      <p className="text-xs text-foreground/80 leading-relaxed italic">{item.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {opportunities.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
                <TrendingUp className="h-3 w-3 text-electric" /> Opportunities
              </p>
              <div className="space-y-2">
                {opportunities.map((item, idx) => (
                  <div key={`op-${idx}`} className="flex items-start gap-2.5 p-3 rounded-sm bg-electric/5 border border-electric/10">
                    <Lightbulb className="h-3.5 w-3.5 text-electric shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-0.5">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{item.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
