import { useState, useEffect } from "react";
import { Check, AlertTriangle, X, ChevronDown, ChevronUp, Lightbulb, TrendingUp, RefreshCw, Loader2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDecksmith } from "@/context/DecksmithContext";
import type { RhetoricScore } from "@/types/rhetoric";

const READINESS_TITLES: Record<string, string> = {
  fundraising: "CAPITAL READINESS",
  board_update: "UPDATE READINESS",
  strategy: "STRATEGY READINESS",
  product_vision: "VISION READINESS",
  investor_update: "UPDATE READINESS",
};

const SCORE_LABELS: Record<string, string> = {
  clarity: "Clarity",
  marketFraming: "Market Framing",
  differentiation: "Differentiation",
  riskTransparency: "Risk Transparency",
  persuasiveStructure: "Persuasive Structure",
  metricCompleteness: "Metric Completeness",
  strategicAlignment: "Strategic Alignment",
  actionability: "Actionability",
  marketInsight: "Market Insight",
  competitivePositioning: "Competitive Positioning",
  feasibility: "Feasibility",
  userInsight: "User Insight",
  solutionFit: "Solution Fit",
  narrativeCoherence: "Narrative Coherence",
  transparency: "Transparency",
  momentumSignal: "Momentum Signal",
  brevity: "Brevity",
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

// Detect whether a suggestion targets the slide deck vs the narrative
function getApplyButtonLabel(gap: string, howToFix: string): string {
  const deckKeywords = /\b(slide|deck|body content|bodyContent|headline|speaker note|layout|slide framework)\b/i;
  const combined = `${gap} ${howToFix}`;
  if (deckKeywords.test(combined)) return "Edit slide framework";
  return "Apply to narrative";
}

function CircularGauge({ value, label }: { value: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const strokeColor =
    value >= 80 ? "hsl(155 60% 45%)" :
    value >= 60 ? "hsl(217 91% 60%)" :
    value >= 40 ? "hsl(48 96% 53%)" :
    "hsl(0 65% 48%)";
  const levelColor =
    value >= 80 ? "text-emerald" :
    value >= 60 ? "text-electric" :
    "text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="90" height="90" viewBox="0 0 90 90" className="drop-shadow-lg">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="hsl(222 16% 16%)" strokeWidth="6" />
        <circle cx="45" cy="45" r={radius} fill="none" stroke={strokeColor} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 45 45)" className="animate-gauge" />
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
  showRescore?: boolean;
  onRescore?: () => void;
  isRescoring?: boolean;
}

export function ScoreTab({ score, mode, showRescore, onRescore, isRescoring }: Props) {
  const [animated, setAnimated] = useState(false);
  const [expandedImprovement, setExpandedImprovement] = useState<number | null>(null);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const { appliedSuggestions, markSuggestionApplied, refineSection, output, refiningSection, isFree } = useDecksmith();

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleApply = async (index: number, gap: string, howToFix: string) => {
    setApplyingIndex(index);
    try {
      await refineSection(`improvement-${index}`, "narrativeStructure", howToFix as any);
      markSuggestionApplied(`score-${index}`);
      setExpandedImprovement(null);
    } catch {
      // refineSection already shows toast on error
    } finally {
      setApplyingIndex(null);
    }
  };

  const overall = score.overall;
  const components = score.components;
  const readinessTitle = READINESS_TITLES[mode] || "NARRATIVE READINESS";
  const levelLabel =
    overall >= 85 ? (mode === "board_update" ? "Board-Ready" : mode === "strategy" ? "Conference-Ready" : "Investor-Ready") :
    overall >= 70 ? "Solid" :
    "Developing";

  const gaps = score.gaps || [];
  const improvements = score.improvements || [];
  const appliedCount = appliedSuggestions.size;

  const lowestEntry = Object.entries(components).reduce<[string, number] | null>((min, [key, value]) => {
    if (!min || value < min[1]) return [key, value];
    return min;
  }, null);

  return (
    <div className="space-y-4">
      {/* Biggest opportunity callout */}
      {lowestEntry && lowestEntry[1] < 80 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-sm border border-yellow-400/20 bg-yellow-400/5 animate-fade-in">
          <Lightbulb className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
          <p className="text-xs text-foreground/80 flex-1">
            <span className="font-medium">Biggest opportunity:</span>{" "}
            {getLabel(lowestEntry[0])} ({lowestEntry[1]}). Apply a suggestion below to improve it.
          </p>
        </div>
      )}

      {/* Applied suggestions re-score prompt */}
      {appliedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-sm border border-emerald/20 bg-emerald/5">
          <RefreshCw className={`h-3.5 w-3.5 text-emerald shrink-0 ${isRescoring ? "animate-spin" : ""}`} />
          <p className="text-xs text-foreground/80 flex-1">
            {appliedCount} suggestion{appliedCount > 1 ? "s" : ""} applied since last score.
          </p>
          <button
            onClick={onRescore}
            disabled={isRescoring}
            className="text-xs font-medium text-electric hover:underline whitespace-nowrap disabled:opacity-50"
          >
            {isRescoring ? "Re-scoring…" : "Re-score"}
          </button>
        </div>
      )}

      {/* Re-score prompt (legacy) */}
      {showRescore && appliedCount === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-sm border border-electric/20 bg-electric/5">
          <RefreshCw className={`h-3.5 w-3.5 text-electric shrink-0 ${isRescoring ? "animate-spin" : ""}`} />
          <p className="text-xs text-foreground/80 flex-1">Your outputs have changed.</p>
          <button
            onClick={onRescore}
            disabled={isRescoring}
            className="text-xs font-medium text-electric hover:underline whitespace-nowrap disabled:opacity-50"
          >
            {isRescoring ? "Re-scoring…" : "Re-score?"}
          </button>
        </div>
      )}

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
                <div
                  className={`h-full rounded-full ${getScoreColor(value)} ${animated ? "animate-score-fill" : ""}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className={`text-xs font-semibold tabular-nums w-7 text-right ${value >= 80 ? "text-emerald" : value >= 60 ? "text-electric" : "text-foreground/70"}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
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

      {/* Areas to Improve — gated for free users */}
      {(gaps.length > 0 || improvements.length > 0) && (
        <div className="relative card-gradient rounded-sm border border-border p-5">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-yellow-400 mb-4 flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" /> Areas to Improve
            {isFree && (
              <span className="ml-1 text-[10px] text-muted-foreground font-normal normal-case tracking-normal">
                ({gaps.length} {gaps.length === 1 ? "area" : "areas"})
              </span>
            )}
          </h3>

          {/* Content — blurred for free users */}
          <div
            className={isFree ? "pointer-events-none select-none" : ""}
            style={isFree ? { filter: "blur(5px)", opacity: 0.45 } : {}}
          >
            <div className="space-y-2">
              {gaps.map((gap, i) => {
                const howToFix = improvements[i];
                const expanded = expandedImprovement === i;
                const isApplied = appliedSuggestions.has(`score-${i}`);
                const applyLabel = howToFix ? getApplyButtonLabel(gap, howToFix) : "Apply to narrative";

                return isApplied ? (
                  <div key={i} className="rounded-sm border border-emerald/20 bg-emerald/5 px-4 py-3 flex items-center gap-2">
                    <Check className="h-3 w-3 text-emerald shrink-0" />
                    <span className="text-xs leading-relaxed text-foreground/60 flex-1 min-w-0">{gap}</span>
                    <Badge variant="secondary" className="bg-emerald/15 text-emerald border-0 text-[10px] px-1.5 py-0 h-4 shrink-0">
                      Applied
                    </Badge>
                  </div>
                ) : (
                  <div key={i} className="rounded-sm border border-border bg-muted/30 overflow-hidden">
                    <button
                      onClick={() => setExpandedImprovement(expanded ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground/90 leading-relaxed">{gap}</span>
                      </div>
                      {howToFix && (
                        expanded
                          ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0 ml-2" />
                          : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 ml-2" />
                      )}
                    </button>
                    {expanded && howToFix && (
                      <div className="px-4 pb-3 border-t border-border pt-3 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 text-electric shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] text-electric uppercase tracking-wider font-semibold mb-1">How to fix</p>
                            <p className="text-xs text-foreground/80 leading-relaxed">{howToFix}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleApply(i, gap, howToFix)}
                            disabled={applyingIndex === i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-medium text-electric hover:text-foreground border border-electric/20 hover:border-electric/40 bg-electric/5 transition-colors disabled:opacity-50"
                          >
                            {applyingIndex === i
                              ? <><Loader2 className="h-3 w-3 animate-spin" /> Applying…</>
                              : applyLabel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Remaining improvements without a matching gap */}
              {improvements.slice(gaps.length).map((imp, i) => (
                <div key={`extra-${i}`} className="flex items-start gap-2.5 p-3 rounded-sm bg-electric/5 border border-electric/10">
                  <TrendingUp className="h-3 w-3 text-electric shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/90 leading-relaxed">{imp}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade overlay — free users only */}
          {isFree && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm bg-background/70 backdrop-blur-[2px]">
              <Lock className="h-5 w-5 text-electric mb-2.5" />
              <p className="text-sm font-semibold text-foreground mb-1">Upgrade to see what's holding your score back</p>
              <p className="text-xs text-muted-foreground mb-4 text-center px-6">
                {gaps.length} specific {gaps.length === 1 ? "area" : "areas"} identified, each with a fix
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('rhetoric:upgrade-required'))}
                className="px-4 py-2 text-xs font-medium bg-electric text-primary-foreground rounded-sm hover:opacity-90 transition-opacity glow-blue"
              >
                Upgrade to Hobby
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
