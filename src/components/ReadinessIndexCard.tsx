import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDecksmith } from "@/context/DecksmithContext";
import type { ReadinessIndex, NarrativeOutputData, NarrativeScore } from "@/types/narrative";
import { Check, AlertTriangle, X, ChevronDown, ChevronUp, Target, TrendingUp, Shield, Lightbulb, ArrowRight, MessageCircleQuestion, Link2, Info, Sparkles } from "lucide-react";

interface Props { output: NarrativeOutputData; isPro: boolean; }

const READINESS_TITLES: Record<string, string> = {
  fundraising: "CAPITAL READINESS",
  board_update: "UPDATE READINESS",
  strategy: "STRATEGY READINESS",
  product_vision: "VISION READINESS",
  investor_update: "UPDATE READINESS",
};

function getReadinessLabel(mode: string): string {
  return READINESS_TITLES[mode] || "NARRATIVE READINESS";
}

const SCORE_COMPONENT_LABELS: Record<string, string> = {
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

function getScoreLabel(key: string, _mode: string): string {
  return SCORE_COMPONENT_LABELS[key] || key;
}

function computeReadiness(output: NarrativeOutputData): ReadinessIndex {
  const score = output.score;
  const d = (output.data || output.supporting || {}) as any;
  const del = (output as any).deliverable || {};
  const mode = output.mode;
  const checklist: ReadinessIndex["checklist"] = [];
  const missing: string[] = [];
  const strengths: string[] = [];

  if (mode === "fundraising") {
    checklist.push({ label: "Thesis", status: d.thesis?.content ? "done" : "missing" });
    checklist.push({ label: "Differentiation", status: d.narrativeStructure?.whyThisWins ? "done" : "missing" });
    checklist.push({ label: "Risks", status: d.risks && d.risks.length > 20 ? "done" : "warning" });
    checklist.push({ label: "Deck", status: (d.deckFramework || del.deckFramework)?.length >= 6 ? "done" : "warning" });
    checklist.push({ label: "Pitch Script", status: d.pitchScript ? "done" : "missing" });
    checklist.push({ label: "Market Logic", status: d.marketLogic?.length >= 2 ? "done" : "missing" });
    if (!d.thesis?.content) missing.push("Investment thesis needs development");
    if (!d.risks || d.risks.length < 20) missing.push("Risk articulation needs depth");
  } else if (mode === "board_update") {
    checklist.push({ label: "Summary", status: d.executiveSummary ? "done" : "missing" });
    checklist.push({ label: "KPIs", status: d.metricsNarrative ? "done" : "warning" });
    checklist.push({ label: "Risks", status: d.risksFocus ? "done" : "warning" });
    checklist.push({ label: "Decisions", status: d.boardDeckOutline?.length >= 4 ? "done" : "missing" });
    if (!d.risksFocus) missing.push("Forward-looking risks needed");
  } else if (mode === "strategy") {
    checklist.push({ label: "Thesis", status: d.thesis ? "done" : "missing" });
    checklist.push({ label: "Positioning", status: d.positioning ? "done" : "missing" });
    checklist.push({ label: "Competitive", status: d.competitiveFramework ? "done" : "warning" });
    checklist.push({ label: "Market", status: d.marketAnalysis ? "done" : "missing" });
  } else if (mode === "product_vision") {
    checklist.push({ label: "Vision", status: d.vision ? "done" : "missing" });
    checklist.push({ label: "Problem", status: d.userProblem ? "done" : "missing" });
    checklist.push({ label: "Solution", status: d.solutionFramework ? "done" : "warning" });
    checklist.push({ label: "Roadmap", status: d.roadmapNarrative ? "done" : "missing" });
  } else if (mode === "investor_update") {
    checklist.push({ label: "Headline", status: d.headline ? "done" : "missing" });
    checklist.push({ label: "Progress", status: d.progress ? "done" : "missing" });
    checklist.push({ label: "Metrics", status: d.metrics ? "done" : "warning" });
    checklist.push({ label: "Challenges", status: d.challenges ? "done" : "warning" });
    checklist.push({ label: "Milestones", status: d.nextMilestones ? "done" : "missing" });
    checklist.push({ label: "The Ask", status: d.askUpdate ? "done" : "missing" });
  }

  const doneCount = checklist.filter(c => c.status === "done").length;
  const total = checklist.length;
  const ratio = total > 0 ? doneCount / total : 0;
  const overall = score?.overall || 50;
  let level: ReadinessIndex["level"] = "Developing";
  if (overall >= 85 && ratio >= 0.9) {
    level = mode === "board_update" ? "Board-Ready" : mode === "strategy" ? "Conference-Ready" : "Investor-Ready";
  } else if (overall >= 70 && ratio >= 0.7) { level = "Solid"; }

  if (score?.strengths) strengths.push(...score.strengths.slice(0, 3));
  if (score?.gaps) missing.push(...score.gaps.slice(0, 3));

  let nextAction = "Continue refining sections to improve readiness.";
  if (mode === "fundraising") {
    if (ratio >= 0.9) nextAction = "find_investors";
    else if (missing.length > 0) nextAction = `Focus on: ${missing[0]}`;
  } else if (mode === "board_update") {
    if (ratio >= 0.9) nextAction = "Generate decision slide and highlight risk scenarios.";
    else nextAction = `Address: ${missing[0] || "remaining gaps"}`;
  }
  return { level, checklist, missing: [...new Set(missing)].slice(0, 4), strengths: [...new Set(strengths)].slice(0, 3), nextAction };
}

function getLevelColor(level: ReadinessIndex["level"]): string {
  switch (level) {
    case "Investor-Ready": case "Board-Ready": case "Conference-Ready": return "text-emerald";
    case "Solid": return "text-electric";
    default: return "text-muted-foreground";
  }
}

function getScoreColor(value: number) {
  if (value >= 80) return "bg-emerald";
  if (value >= 60) return "bg-electric";
  if (value >= 40) return "bg-yellow-400";
  return "bg-destructive";
}

function CircularGauge({ value, label, levelColor }: { value: number; label: string; levelColor: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const strokeColor = value >= 80 ? "hsl(155 60% 45%)" : value >= 60 ? "hsl(217 91% 60%)" : value >= 40 ? "hsl(48 96% 53%)" : "hsl(0 65% 48%)";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="90" height="90" viewBox="0 0 90 90" className="drop-shadow-lg">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="hsl(222 16% 16%)" strokeWidth="6" />
        <circle cx="45" cy="45" r={radius} fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 45 45)" className="animate-gauge" style={{ strokeDashoffset: offset }} />
        <text x="45" y="42" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "22px" }}>{value}</text>
        <text x="45" y="58" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "11px" }}>/100</text>
      </svg>
      <p className={`text-[11px] font-semibold ${levelColor}`}>{label}</p>
    </div>
  );
}

// ── Coaching item generator ────────────────────────────

interface CoachingItem {
  type: "weakness" | "objection" | "opportunity";
  title: string;
  detail: string;
  fix: string;
  linkSection?: string;
  linkTab?: string;
  linkPitchPrep?: boolean;
}

function generateCoachingItems(output: NarrativeOutputData): CoachingItem[] {
  const items: CoachingItem[] = [];
  const score = output.score;
  const components = score?.components;
  const improvements = score?.improvements || [];
  const missing = computeReadiness(output).missing;
  const mode = output.mode;
  const isFundraising = mode === "fundraising";

  if (components) {
    const entries = Object.entries(components) as [string, number][];
    const weak = entries.filter(([, v]) => v < 80).sort((a, b) => a[1] - b[1]);

    for (const [key, value] of weak) {
      const label = getScoreLabel(key, mode);
      items.push({
        type: "weakness",
        title: `${label} scores ${value}/100`,
        detail: score?.gaps?.find(g => g.toLowerCase().includes(key.toLowerCase())) || `This area needs improvement to strengthen your overall narrative.`,
        fix: score?.improvements?.find(i => i.toLowerCase().includes(key.toLowerCase())) || `Review and strengthen the ${label} section of your output.`,
        linkSection: isFundraising ? label : undefined,
        linkTab: isFundraising ? (key === "riskTransparency" ? "thesis" : key === "differentiation" || key === "persuasiveStructure" ? "narrative" : "thesis") : undefined,
        linkPitchPrep: isFundraising && (key === "riskTransparency" || key === "differentiation"),
      });
    }
  }

  const threats = missing.filter(m => m.length > 0);
  if (threats.length > 0) {
    for (const threat of threats.slice(0, 3)) {
      items.push({
        type: "objection",
        title: threat,
        detail: "This gap may be probed by your audience. Being prepared turns a weakness into a signal of maturity.",
        fix: "Acknowledge the concern directly, then pivot to your mitigation plan with specific evidence.",
        linkPitchPrep: isFundraising,
      });
    }
  }

  for (const imp of improvements.slice(0, 2)) {
    items.push({ type: "opportunity", title: imp, detail: "This improvement could meaningfully increase your narrative score.", fix: `Apply this recommendation and refine the relevant section.` });
  }

  return items;
}

// ── Main Component ─────────────────────────────────────

export function ReadinessIndexCard({ output, isPro }: Props) {
  const navigate = useNavigate();
  const { isEvaluation, reset, setRawInput } = useDecksmith();
  const readiness = computeReadiness(output);
  const score = output.score;
  const overall = score?.overall || 50;
  const components = score?.components;
  const mode = output.mode;
  const [animatedScores, setAnimatedScores] = useState(false);
  const coachingItems = generateCoachingItems(output);
  const showInvestorCTA = mode === "fundraising" && readiness.nextAction === "find_investors";

  useEffect(() => {
    const t = setTimeout(() => setAnimatedScores(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleRebuild = () => {
    // Extract thesis and key points from the evaluation
    const d = (output.data || output.supporting || {}) as any;
    const thesis = d.thesis?.content || d.thesis || d.executiveSummary || d.vision || d.headline || "";
    const coreInsight = d.thesis?.coreInsight || "";
    const whyNow = d.whyNow || "";
    const keyPoints = [thesis, coreInsight, whyNow].filter(Boolean).join("\n\n");
    
    reset();
    // Pre-fill the prompt with extracted content
    setTimeout(() => {
      setRawInput(`Rebuild and strengthen this narrative:\n\n${keyPoints}`);
      navigate("/dashboard");
    }, 50);
  };

  return (
    <div className="space-y-4">
      {/* Evaluation banner */}
      {isEvaluation && (
        <div className="rounded-sm border border-electric/30 bg-electric/5 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-electric mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">This is an evaluation of your uploaded deck.</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">Rhetoric can rebuild it with a stronger narrative. Click below to generate a new version.</p>
            <button
              onClick={handleRebuild}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-electric text-primary-foreground rounded-sm font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Rebuild This Deck
            </button>
          </div>
        </div>
      )}

      {/* Top row: gauge + badges + CTA */}
      <div className="card-gradient rounded-sm border border-border p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <CircularGauge value={overall} label={readiness.level} levelColor={getLevelColor(readiness.level)} />
          <div className="flex-1 min-w-0 space-y-2.5">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric">{getReadinessLabel(mode)}</p>
            <div className="flex flex-wrap gap-1.5">
              {components && Object.entries(components).map(([key, value]) => {
                const label = getScoreLabel(key, mode);
                if (value >= 80) return <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald/15 text-emerald"><Check className="h-2.5 w-2.5" />{label}</span>;
                if (value >= 65) return <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-400/15 text-yellow-400"><AlertTriangle className="h-2.5 w-2.5" />{label} ({value})</span>;
                return <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/15 text-destructive"><X className="h-2.5 w-2.5" />{label} ({value})</span>;
              })}
            </div>
            {!showInvestorCTA && readiness.nextAction && readiness.nextAction !== "find_investors" && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-electric font-medium">Next:</span> {readiness.nextAction}
              </p>
            )}
          </div>
          {showInvestorCTA && (
            <button onClick={() => navigate("/raise/investors")}
              className="flex items-center gap-1.5 px-4 py-2 bg-electric text-primary-foreground rounded-sm font-semibold text-xs hover:opacity-90 transition-opacity shrink-0">
              Find Investors <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      {components && (
        <div className="card-gradient rounded-sm border border-border p-5">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">Score Breakdown</h3>
          <div className="space-y-2.5">
            {Object.entries(components).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-foreground/80 w-36 shrink-0 font-medium">{getScoreLabel(key, mode)}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getScoreColor(value)} ${animatedScores ? "animate-score-fill" : ""}`} style={{ width: `${value}%` }} />
                </div>
                <span className={`text-xs font-semibold tabular-nums w-7 text-right ${value >= 80 ? "text-emerald" : value >= 60 ? "text-electric" : "text-foreground/70"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaching */}
      {coachingItems.length > 0 && (
        <div className="card-gradient rounded-sm border border-border p-5">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">Coaching ({coachingItems.length})</h3>
          <div className="space-y-4">
            {/* Weaknesses */}
            {coachingItems.filter(i => i.type === "weakness").length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-3 w-3 text-yellow-400" /> Areas to Strengthen
                </p>
                <div className="space-y-2">
                  {coachingItems.filter(i => i.type === "weakness").map((item, idx) => (
                    <CoachingCard key={`w-${idx}`} item={item} navigate={navigate} />
                  ))}
                </div>
              </div>
            )}

            {/* Objections */}
            {coachingItems.filter(i => i.type === "objection").length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
                  <MessageCircleQuestion className="h-3 w-3 text-destructive" /> Potential Objections
                </p>
                <div className="space-y-2">
                  {coachingItems.filter(i => i.type === "objection").map((item, idx) => (
                    <div key={`o-${idx}`} className="p-3 rounded-sm bg-destructive/5 border border-destructive/15">
                      <p className="text-xs font-semibold text-foreground mb-1">"{item.title}"</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{item.detail}</p>
                      <div className="p-2.5 rounded-sm bg-background/50 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Suggested Response</p>
                        <p className="text-xs text-foreground/80 leading-relaxed italic">{item.fix}</p>
                      </div>
                      {item.linkPitchPrep && output.mode === "fundraising" && (
                        <p className="text-[11px] text-electric mt-1.5 flex items-center gap-1">
                          <Link2 className="h-2.5 w-2.5" /> See Common Investor Questions in Pitch Prep
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {coachingItems.filter(i => i.type === "opportunity").length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
                  <TrendingUp className="h-3 w-3 text-electric" /> Opportunities
                </p>
                <div className="space-y-2">
                  {coachingItems.filter(i => i.type === "opportunity").map((item, idx) => (
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
      )}

      {coachingItems.length === 0 && (
        <div className="card-gradient rounded-sm border border-border p-5 text-center">
          <Check className="h-6 w-6 text-emerald mx-auto mb-2" />
          <p className="text-xs text-foreground font-medium">Looking great!</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">No major coaching items identified.</p>
        </div>
      )}

      {/* Find Matching Investors CTA (standalone, only if not in top row) */}
      {showInvestorCTA && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">We've identified investors that match your profile based on this narrative.</span>
        </div>
      )}
    </div>
  );
}

function CoachingCard({ item, navigate }: { item: CoachingItem; navigate: (path: string) => void }) {
  return (
    <div className="p-3 rounded-sm bg-muted/50 border border-border accent-left-border">
      <p className="text-xs font-semibold text-foreground mb-0.5">{item.title}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{item.detail}</p>
      <div className="p-2.5 rounded-sm bg-background/50 border border-border mb-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">How to Fix</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{item.fix}</p>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        {item.linkSection && item.linkTab && (
          <span className="text-[11px] text-electric flex items-center gap-1">
            <Link2 className="h-2.5 w-2.5" /> Fix in {item.linkSection}
          </span>
        )}
        {item.linkPitchPrep && (
          <span className="text-[11px] text-electric flex items-center gap-1">
            <MessageCircleQuestion className="h-2.5 w-2.5" /> Pitch Prep → Questions
          </span>
        )}
      </div>
    </div>
  );
}
