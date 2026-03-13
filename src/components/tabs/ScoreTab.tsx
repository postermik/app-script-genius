import { useState, useEffect } from "react";
import { Check, AlertTriangle, X, ChevronDown, ChevronUp, Lightbulb, TrendingUp, RefreshCw, Loader2, Lock, Trophy } from "lucide-react";
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

// Normalize gap — handle both plain string and {text, tier} object shapes
function normalizeGap(gap: any): string {
  if (typeof gap === "string") return gap;
  if (gap && typeof gap === "object") return gap.text || JSON.stringify(gap);
  return String(gap ?? "");
}

// Get tier from gap object, default to "secondary"
function getGapTier(gap: any): "primary" | "secondary" | "minor" {
  if (gap && typeof gap === "object" && gap.tier) return gap.tier;
  return "secondary";
}

function getApplyButtonLabel(gap: string, howToFix: string): string {
  const deckKeywords = /\b(slide|deck|body content|bodyContent|headline|speaker note|layout|slide framework)\b/i;
  const combined = `${gap} ${howToFix}`;
  if (deckKeywords.test(combined)) return "Edit slide framework";
  return "Apply to narrative";
}

function gapSeverityStyles(tier: string) {
  if (tier === "primary") return {
    border: "border-destructive/30",
    bg: "bg-destructive/5",
    icon: "text-destructive",
    label: "Critical",
    labelClass: "text-destructive bg-destructive/10",
  };
  if (tier === "minor") return {
    border: "border-border",
    bg: "bg-muted/20",
    icon: "text-muted-foreground",
    label: "Minor",
    labelClass: "text-muted-foreground bg-muted/30",
  };
  // secondary (default)
  return {
    border: "border-yellow-400/20",
    bg: "bg-yellow-400/5",
    icon: "text-yellow-400",
    label: "Moderate",
    labelClass: "text-yellow-400 bg-yellow-400/10",
  };
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
        <circle
          cx="45" cy="45" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 45 45)" className="animate-gauge"
        />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
          const x1 = 45 + 30 * Math.cos(angle);
          const y1 = 45 + 30 * Math.sin(angle);
          const x2 = 45 + 34 * Math.cos(angle);
          const y2 = 45 + 34 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(222 16% 22%)" strokeWidth="1.5" />;
        })}
        <text x="45" y="45" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold" style={{ fontSize: "22px" }}>{value}</text>
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
  hasPendingImprovements?: boolean;
}

export function ScoreTab({ score, mode, showRescore, onRescore, isRescoring, hasPendingImprovements }: Props) {
  const [animated, setAnimated] = useState(false);
  const [expandedImprovement, setExpandedImprovement] = useState<number | null>(null);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { appliedSuggestions, markSuggestionApplied, refineSection, output, refiningSection, isFree } = useDecksmith();

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleApply = async (index: number, gapText: string, howToFix: string) => {
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
  const isInvestorReady = overall >= 85;
  const levelLabel = isInvestorReady
    ? (mode === "board_update" ? "Board-Ready" : mode === "strategy" ? "Conference-Ready" : "Investor-Ready")
    : overall >= 70 ? "Solid"
    : "Developing";

  const gaps = score.gaps || [];
  const improvements = score.improvements || [];
  const appliedCount = appliedSuggestions.size;

  // Sort gaps by severity: primary first, then secondary, then minor
  const tierOrder = { primary: 0, secondary: 1, minor: 2 };
  const sortedGapIndices = gaps
    .map((gap, i) => ({ i, tier: getGapTier(gap) }))
    .sort((a, b) => (tierOrder[a.tier] ?? 1) - (tierOrder[b.tier] ?? 1));

  const lowestEntry = Object.entries(components).reduce<[string, number] | null>((min, [key, value]) => {
    if (!min || value < min[1]) return [key, value];
    return min;
  }, null);

  const primaryGaps = gaps.filter(g => getGapTier(g) === "primary");
  const hasGaps = gaps.length > 0 || improvements.length > 0;

  return (
    <div className="space-y-3">

      {/* HERO */}
      <div className="card-gradient rounded-sm border border-border p-5">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(222 16% 16%)" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke={overall >= 85 ? "hsl(155 60% 45%)" : overall >= 70 ? "hsl(217 91% 60%)" : "hsl(48 96% 53%)"}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={String(2 * Math.PI * 34)}
                strokeDashoffset={String(2 * Math.PI * 34 * (1 - overall / 100))}
                transform="rotate(-90 40 40)"
              />
              <text x="40" y="39" textAnchor="middle" dominantBaseline="central" className="fill-foreground font-bold" style={{fontSize:"20px"}}>{overall}</text>
              <text x="40" y="54" textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground" style={{fontSize:"9px",opacity:"0"}}>/100</text>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1">{readinessTitle}</p>
            <p className={"text-lg font-bold " + (isInvestorReady ? "text-emerald" : overall >= 70 ? "text-electric" : "text-yellow-400")}>
              {levelLabel}
            </p>
            <p className="text-xs text-foreground/75 mt-1.5 leading-relaxed">
              {isInvestorReady
                ? (gaps.length > 0
                  ? gaps.length + " refinement" + (gaps.length > 1 ? "s" : "") + " available"
                  : "No significant gaps. Strong across the board.")
                : (primaryGaps.length > 0
                  ? primaryGaps.length + " critical gap" + (primaryGaps.length > 1 ? "s" : "") + (lowestEntry ? " · Lowest: " + getLabel(lowestEntry[0]) + " (" + lowestEntry[1] + ")" : "")
                  : (lowestEntry ? "Biggest opportunity: " + getLabel(lowestEntry[0]) + " (" + lowestEntry[1] + ")" : ""))}
            </p>
          </div>
          {(showRescore || appliedCount > 0) && (
            <button
              onClick={onRescore}
              disabled={isRescoring || !hasPendingImprovements}
              disabled={isRescoring}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-electric bg-electric/20 border border-electric/30 rounded-sm hover:bg-electric/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={"h-3 w-3 " + (isRescoring ? "animate-spin" : "")} />
              {isRescoring ? "Scoring…" : appliedCount > 0 ? "Re-score (" + appliedCount + ")" : "Re-score"}
            </button>
          )}
        </div>
      </div>

      {/* GAPS */}
      {hasGaps && (
        <div className="relative card-gradient rounded-sm border border-border p-5 pb-6">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
            {isInvestorReady ? "Refinements" : "Gaps to address"}
          </h3>
          <div className={isFree ? "pointer-events-none select-none" : ""} style={isFree ? {filter:"blur(5px)",opacity:0.45} : {}}>
            <div className="space-y-2">
              {sortedGapIndices.map(({ i }) => {
                const gap = gaps[i];
                const howToFix = improvements[i];
                const gapText = normalizeGap(gap);
                const tier = getGapTier(gap);
                const styles = gapSeverityStyles(tier);
                const expanded = expandedImprovement === i;
                const isApplied = appliedSuggestions.has("score-" + i);
                const applyLabel = howToFix ? getApplyButtonLabel(gapText, howToFix) : "Apply to narrative";
                return isApplied ? (
                  <div key={i} className="rounded-sm border border-emerald/20 bg-emerald/5 px-4 py-3 flex items-start gap-2">
                    <Check className="h-3 w-3 text-emerald shrink-0" />
                    <span className="text-xs text-foreground/60 flex-1">{gapText}</span>
                    <Badge variant="secondary" className="bg-emerald/15 text-emerald border-0 text-[10px] px-1.5 py-0 h-4 shrink-0">Applied</Badge>
                    <div className="w-4" />
                  </div>
                ) : (
                  <div key={i} className={"rounded-sm border " + styles.border + " " + styles.bg + " overflow-hidden"}>
                    <button
                      onClick={() => setExpandedImprovement(expanded ? null : i)}
                      className="w-full flex items-start justify-between px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <AlertTriangle className={"h-3 w-3 " + styles.icon + " shrink-0 mt-0.5"} />
                        <span className="text-xs text-foreground/90 leading-relaxed">{gapText}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3 mt-0.5">
                        <span className={"text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full " + styles.labelClass}>
                          {styles.label}
                        </span>
                        <div className="w-4 flex justify-center">
                          {howToFix && (expanded
                            ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            : <ChevronDown className="h-3 w-3 text-muted-foreground" />)}
                        </div>
                      </div>
                    </button>
                    {expanded && howToFix && (
                      <div className="px-4 pb-3 border-t border-border/50 pt-3 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 text-electric shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] text-electric uppercase tracking-wider font-semibold mb-1">How to fix</p>
                            <p className="text-xs text-foreground/80 leading-relaxed">{howToFix}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleApply(i, gapText, howToFix)}
                            disabled={applyingIndex === i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-medium text-electric hover:text-foreground border border-electric/20 hover:border-electric/40 bg-electric/5 transition-colors disabled:opacity-50"
                          >
                            {applyingIndex === i ? <><Loader2 className="h-3 w-3 animate-spin" />Applying…</> : applyLabel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {improvements.slice(gaps.length).map((imp, i) => (
                <div key={"extra-" + i} className="flex items-start gap-2.5 p-3 rounded-sm bg-electric/5 border border-electric/10">
                  <TrendingUp className="h-3 w-3 text-electric shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/90 leading-relaxed">{imp}</p>
                </div>
              ))}
            </div>
          </div>
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

      {/* BREAKDOWN — collapsed by default */}
      <div className="rounded-sm border border-border/60 bg-muted/5 overflow-hidden">
        <button
          onClick={() => setShowDetails(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/10 transition-colors text-left"
        >
          <span className="text-sm font-medium text-foreground/80">
            {showDetails ? "Hide breakdown" : "Show breakdown"}
          </span>
          {showDetails
            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
        {showDetails && (
          <div className="border-t border-border p-5 space-y-5">
            <div className="space-y-3.5">
              {Object.entries(components).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-foreground/70 w-36 shrink-0">{getLabel(key)}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={"h-full rounded-full " + getScoreColor(value)} style={{width: value + "%"}} />
                  </div>
                  <span className={"text-xs font-semibold tabular-nums w-7 text-right " + (value >= 80 ? "text-emerald" : value >= 60 ? "text-electric" : "text-foreground/60")}>{value}</span>
                </div>
              ))}
            </div>
            {score.strengths.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-emerald mb-2">Strengths</p>
                <ul className="space-y-2.5">
                  {score.strengths.map((str, i) => (
                    <li key={i} className="text-xs text-secondary-foreground leading-relaxed flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-emerald shrink-0 mt-0.5" />{str}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          href="/raise/investors"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold border border-foreground/30 rounded-sm hover:bg-muted/10 hover:border-foreground/50 transition-colors text-foreground"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Go to Raise
        </a>
        <button
          onClick={() => document.querySelector('[data-export-trigger]')?.click()}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-electric text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
        >
          Export Materials
        </button>
      </div>

    </div>
  );
}
