import { useState, useEffect } from "react";
import { Check, AlertTriangle, X } from "lucide-react";
import type { RhetoricScore } from "@/types/rhetoric";

const READINESS_TITLES: Record<string, string> = {
  fundraising: "CAPITAL READINESS",
  board_update: "UPDATE READINESS",
  strategy: "STRATEGY READINESS",
  product_vision: "VISION READINESS",
  investor_update: "UPDATE READINESS",
};

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

function getScoreColor(value: number) {
  if (value >= 80) return "bg-emerald";
  if (value >= 60) return "bg-electric";
  if (value >= 40) return "bg-yellow-400";
  return "bg-destructive";
}

function getLabel(key: string) {
  return SCORE_LABELS[key] || key;
}

function CircularGauge({ value, label }: { value: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const strokeColor = value >= 80 ? "hsl(155 60% 45%)" : value >= 60 ? "hsl(217 91% 60%)" : value >= 40 ? "hsl(48 96% 53%)" : "hsl(0 65% 48%)";
  const levelColor = value >= 80 ? "text-emerald" : value >= 60 ? "text-electric" : "text-muted-foreground";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="90" height="90" viewBox="0 0 90 90" className="drop-shadow-lg">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="hsl(222 16% 16%)" strokeWidth="6" />
        <circle cx="45" cy="45" r={radius} fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 45 45)" className="animate-gauge" />
        <text x="45" y="42" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "22px" }}>{value}</text>
        <text x="45" y="58" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "11px" }}>/100</text>
      </svg>
      <p className={`text-[11px] font-semibold ${levelColor}`}>{label}</p>
    </div>
  );
}

interface Props {
  score: RhetoricScore;
  mode: string;
}

export function ScoreTab({ score, mode }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const overall = score.overall;
  const components = score.components;
  const readinessTitle = READINESS_TITLES[mode] || "NARRATIVE READINESS";
  const levelLabel = overall >= 85 ? (mode === "board_update" ? "Board-Ready" : mode === "strategy" ? "Conference-Ready" : "Investor-Ready") : overall >= 70 ? "Solid" : "Developing";

  return (
    <div className="space-y-4">
      {/* Top row: gauge + badges */}
      <div className="card-gradient rounded-sm border border-border p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <CircularGauge value={overall} label={levelLabel} />
          <div className="flex-1 min-w-0 space-y-2.5">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric">{readinessTitle}</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(components).map(([key, value]) => {
                const label = getLabel(key);
                if (value >= 80) return <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald/15 text-emerald"><Check className="h-2.5 w-2.5" />{label}</span>;
                if (value >= 65) return <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-400/15 text-yellow-400"><AlertTriangle className="h-2.5 w-2.5" />{label} ({value})</span>;
                return <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/15 text-destructive"><X className="h-2.5 w-2.5" />{label} ({value})</span>;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="card-gradient rounded-sm border border-border p-5">
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">Score Breakdown</h3>
        <div className="space-y-2.5">
          {Object.entries(components).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-foreground/80 w-36 shrink-0 font-medium">{getLabel(key)}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getScoreColor(value)} ${animated ? "animate-score-fill" : ""}`} style={{ width: `${value}%` }} />
              </div>
              <span className={`text-xs font-semibold tabular-nums w-7 text-right ${value >= 80 ? "text-emerald" : value >= 60 ? "text-electric" : "text-foreground/70"}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-2 gap-4">
        {score.strengths.length > 0 && (
          <div className="card-gradient rounded-sm border border-border p-5">
            <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-emerald mb-3">Strengths</h3>
            <ul className="space-y-2">
              {score.strengths.map((s, i) => (
                <li key={i} className="text-xs text-secondary-foreground leading-relaxed flex items-start gap-1.5">
                  <Check className="h-3 w-3 text-emerald shrink-0 mt-0.5" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {score.gaps.length > 0 && (
          <div className="card-gradient rounded-sm border border-border p-5">
            <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-yellow-400 mb-3">Gaps</h3>
            <ul className="space-y-2">
              {score.gaps.map((g, i) => (
                <li key={i} className="text-xs text-secondary-foreground leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0 mt-0.5" />{g}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Re-score placeholder */}
      <div className="flex justify-end">
        <button className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-sm px-3 py-1.5 transition-colors">
          Re-score with changes
        </button>
      </div>
    </div>
  );
}
