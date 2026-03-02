import type { NarrativeScore } from "@/types/narrative";
import { Lock } from "lucide-react";

interface Props {
  score: NarrativeScore;
  isPro: boolean;
}

const SCORE_LABELS: Record<string, string> = {
  clarity: "Clarity",
  marketFraming: "Market Framing",
  differentiation: "Differentiation",
  riskTransparency: "Risk Transparency",
  persuasiveStructure: "Persuasion",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-orange-400";
}

export function NarrativeScoreCard({ score, isPro }: Props) {
  return (
    <div className="flex items-start gap-8">
      <div className="flex items-center gap-3">
        <span className={`text-3xl font-bold tabular-nums ${getScoreColor(score.overall)}`}>
          {score.overall}
        </span>
        <div>
          <p className="text-xs font-medium text-foreground">Narrative Score</p>
          <p className="text-[11px] text-muted-foreground">/100</p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto">
        {Object.entries(score.components).map(([key, value]) => (
          <div key={key} className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{SCORE_LABELS[key] || key}</p>
            <p className={`text-sm font-semibold tabular-nums ${getScoreColor(value)}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="hidden lg:flex gap-6">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Strengths</p>
          <ul className="space-y-1">
            {score.strengths.slice(0, 2).map((s, i) => (
              <li key={i} className="text-[11px] text-foreground/80">{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Gaps</p>
          <ul className="space-y-1">
            {score.gaps.slice(0, 2).map((g, i) => (
              <li key={i} className="text-[11px] text-foreground/80">{g}</li>
            ))}
          </ul>
        </div>
        {!isPro && (
          <div className="flex items-center">
            <button className="text-[11px] text-muted-foreground border border-border px-2.5 py-1 rounded-sm flex items-center gap-1 hover:text-foreground transition-colors">
              <Lock className="h-3 w-3" />
              Advanced Optimization
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
