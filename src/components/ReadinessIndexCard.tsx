import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ReadinessIndex, NarrativeOutputData, NarrativeScore } from "@/types/narrative";
import { Check, AlertTriangle, X, ChevronDown, ChevronUp, Target, TrendingUp, Shield, Lightbulb, ArrowRight, MessageCircleQuestion, Link2 } from "lucide-react";

interface Props { output: NarrativeOutputData; isPro: boolean; }

function getReadinessLabel(mode: string): string {
  switch (mode) {
    case "fundraising": return "Fundraise Readiness";
    case "board_update": return "Board Readiness";
    case "strategy": return "Strategy Readiness";
    case "product_vision": return "Narrative Readiness";
    case "investor_update": return "Investor Readiness";
    default: return "Narrative Readiness";
  }
}

function getScoreLabel(key: string, mode: string): string {
  if (mode === "board_update") {
    const labels: Record<string, string> = { clarity: "Clarity", marketFraming: "Metrics Coverage", differentiation: "Action Items", riskTransparency: "Risk Transparency", persuasiveStructure: "Decision Framing" };
    return labels[key] || key;
  }
  if (mode === "strategy") {
    const labels: Record<string, string> = { clarity: "Clarity", marketFraming: "Market Framing", differentiation: "Differentiation", riskTransparency: "Risk Assessment", persuasiveStructure: "Strategic Logic" };
    return labels[key] || key;
  }
  const labels: Record<string, string> = { clarity: "Clarity", marketFraming: "Market Framing", differentiation: "Differentiation", riskTransparency: "Risk Transparency", persuasiveStructure: "Persuasive Structure" };
  return labels[key] || key;
}

function computeReadiness(output: NarrativeOutputData): ReadinessIndex {
  const score = output.score;
  const d = output.data as any;
  const mode = output.mode;
  const checklist: ReadinessIndex["checklist"] = [];
  const missing: string[] = [];
  const strengths: string[] = [];

  if (mode === "fundraising") {
    checklist.push({ label: "Thesis", status: d.thesis?.content ? "done" : "missing" });
    checklist.push({ label: "Differentiation", status: d.narrativeStructure?.whyThisWins ? "done" : "missing" });
    checklist.push({ label: "Risks", status: d.risks && d.risks.length > 20 ? "done" : "warning" });
    checklist.push({ label: "Deck", status: d.deckFramework?.length >= 6 ? "done" : "warning" });
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
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const strokeColor = value >= 80 ? "hsl(155 60% 45%)" : value >= 60 ? "hsl(217 91% 60%)" : value >= 40 ? "hsl(48 96% 53%)" : "hsl(0 65% 48%)";
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(222 16% 16%)" strokeWidth="7" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={strokeColor} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 60 60)" className="animate-gauge" style={{ strokeDashoffset: offset }} />
        <text x="60" y="56" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: "28px" }}>{value}</text>
        <text x="60" y="76" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "14px" }}>/100</text>
      </svg>
      <p className={`text-xs font-semibold ${levelColor}`}>{label}</p>
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
  const gaps = score?.gaps || [];
  const improvements = score?.improvements || [];
  const missing = computeReadiness(output).missing;
  const d = output.data as any;

  if (components) {
    const entries = Object.entries(components) as [string, number][];
    const weak = entries.filter(([, v]) => v < 80).sort((a, b) => a[1] - b[1]);

    for (const [key, value] of weak) {
      const label = getScoreLabel(key, output.mode);
      if (key === "riskTransparency") {
        items.push({
          type: "weakness", title: `${label} scores ${value}/100`,
          detail: "Investors evaluate risk awareness as a signal of founder maturity. A low score here suggests you haven't proactively addressed what could go wrong.",
          fix: `Add a dedicated risks section that names your top 3 risks and explains your mitigation strategy for each. Update your Deck Framework to include a Risk slide if one isn't present.`,
          linkSection: "Risks", linkTab: "thesis", linkPitchPrep: true,
        });
      } else if (key === "differentiation") {
        items.push({
          type: "weakness", title: `${label} scores ${value}/100`,
          detail: "Without clear differentiation, investors worry about defensibility against incumbents and well-funded competitors.",
          fix: `Strengthen the "Why This Wins" section of your Narrative Arc with specific competitive advantages. Add a moat slide to your Deck Framework comparing your approach vs. alternatives.`,
          linkSection: "Why This Wins", linkTab: "narrative", linkPitchPrep: true,
        });
      } else if (key === "marketFraming") {
        items.push({
          type: "weakness", title: `${label} scores ${value}/100`,
          detail: "Market framing establishes whether the opportunity is large enough to justify investment. Weak framing makes investors question returns.",
          fix: `Quantify your TAM/SAM/SOM in the Market Logic section of your Thesis tab. Include growth rate data and cite credible sources.`,
          linkSection: "Market Logic", linkTab: "thesis",
        });
      } else if (key === "clarity") {
        items.push({
          type: "weakness", title: `${label} scores ${value}/100`,
          detail: "If an investor can't explain your business to their partners in one sentence, you won't get a second meeting.",
          fix: `Simplify your Investment Thesis to a single clear sentence. Use the Core Insight as your one-liner test — if it's not instantly clear, rewrite it.`,
          linkSection: "Investment Thesis", linkTab: "thesis",
        });
      } else if (key === "persuasiveStructure") {
        items.push({
          type: "weakness", title: `${label} scores ${value}/100`,
          detail: "Your narrative doesn't build momentum effectively. Each section should escalate conviction, leading to the ask.",
          fix: `Review your Narrative Arc flow. Ensure "The Breaking Point" creates real urgency and "Why This Wins" directly answers it. Reorder your Deck Framework slides so the story builds to the ask.`,
          linkSection: "Narrative Arc", linkTab: "narrative",
        });
      }
    }
  }

  // Generate objections from threats/missing items
  const threats = missing.filter(m => m.length > 0);
  if (threats.length > 0) {
    for (const threat of threats.slice(0, 3)) {
      const t = threat.toLowerCase();
      let response = "Acknowledge the concern directly, then pivot to your mitigation plan with specific evidence.";
      if (t.includes("risk")) response = "\"We've mapped our top risks and have concrete mitigation strategies for each. Let me walk you through them.\"";
      else if (t.includes("thesis") || t.includes("thesis")) response = "\"Our thesis is grounded in [specific market data]. Here's the evidence...\"";
      else if (t.includes("traction") || t.includes("metric")) response = "\"While early, our leading indicators show [specific trend]. Here's our traction trajectory...\"";
      items.push({ type: "objection", title: threat, detail: "Investors will likely probe this area. Being prepared with a confident, data-backed response turns a weakness into a signal of maturity.", fix: response, linkPitchPrep: true });
    }
  }

  // Opportunities from improvements
  for (const imp of improvements.slice(0, 2)) {
    items.push({ type: "opportunity", title: imp, detail: "This improvement could meaningfully increase your narrative score and investor conviction.", fix: `Apply this recommendation and refine the relevant section using the "Sharper" or "Analytical" tone.` });
  }

  return items;
}

// ── Main Component ─────────────────────────────────────

export function ReadinessIndexCard({ output, isPro }: Props) {
  const navigate = useNavigate();
  const readiness = computeReadiness(output);
  const [expanded, setExpanded] = useState(true);
  const [detailTab, setDetailTab] = useState<"scores" | "coaching">("scores");
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

  return (
    <div className="card-gradient rounded-sm border border-border p-8">
      {/* Top row: gauge + checklist */}
      <div className="flex items-center gap-10 flex-wrap">
        <CircularGauge value={overall} label={readiness.level} levelColor={getLevelColor(readiness.level)} />

        <div className="flex-1 min-w-0 space-y-4">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">{getReadinessLabel(mode)}</p>
          <div className="flex flex-wrap gap-2">
            {components && Object.entries(components).map(([key, value]) => {
              const label = getScoreLabel(key, mode);
              if (value >= 80) return <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald/15 text-emerald"><Check className="h-3 w-3" />{label}</span>;
              if (value >= 65) return <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-400/15 text-yellow-400"><AlertTriangle className="h-3 w-3" />{label} ({value})</span>;
              return <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive"><X className="h-3 w-3" />{label} ({value})</span>;
            })}
          </div>

          {/* CTA or next action */}
          {showInvestorCTA ? (
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/raise/investors")}
                className="flex items-center gap-2 px-5 py-2.5 bg-electric text-primary-foreground rounded-sm font-semibold text-sm hover:opacity-90 transition-opacity">
                Find Matching Investors <ArrowRight className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground">We've identified investors that match your profile based on this narrative.</span>
            </div>
          ) : readiness.nextAction && readiness.nextAction !== "find_investors" ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-electric font-medium">Next:</span> {readiness.nextAction}
            </p>
          ) : null}
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-3 py-1.5 border border-border rounded-sm shrink-0">
          {expanded ? "Hide" : "Details"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="mt-8 pt-8 border-t border-border animate-tab-enter">
          <div className="flex gap-1 mb-8">
            {([
              { key: "scores" as const, label: "Score Breakdown" },
              { key: "coaching" as const, label: `Coaching (${coachingItems.length})` },
            ]).map(tab => (
              <button key={tab.key} onClick={() => setDetailTab(tab.key)}
                className={`text-xs px-4 py-2 rounded-sm transition-colors font-medium ${
                  detailTab === tab.key ? "bg-electric/10 text-electric border border-electric/20" : "text-muted-foreground hover:text-foreground"
                }`}>{tab.label}</button>
            ))}
          </div>

          <div className="animate-tab-enter" key={detailTab}>
            {detailTab === "scores" && components && (
              <div className="space-y-5">
                {Object.entries(components).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-xs text-foreground/80 w-40 shrink-0 font-medium">{getScoreLabel(key, mode)}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getScoreColor(value)} ${animatedScores ? "animate-score-fill" : ""}`} style={{ width: `${value}%` }} />
                    </div>
                    <span className={`text-sm font-semibold tabular-nums w-8 text-right ${value >= 80 ? "text-emerald" : value >= 60 ? "text-electric" : "text-foreground/70"}`}>{value}</span>
                  </div>
                ))}
              </div>
            )}
            {detailTab === "scores" && !components && (
              <p className="text-sm text-muted-foreground">Score component data not available for this output.</p>
            )}

            {detailTab === "coaching" && (
              <div className="space-y-4">
                {coachingItems.length === 0 && (
                  <div className="text-center py-8">
                    <Check className="h-8 w-8 text-emerald mx-auto mb-3" />
                    <p className="text-sm text-foreground font-medium">Looking great!</p>
                    <p className="text-xs text-muted-foreground mt-1">No major coaching items identified. Keep refining to push scores higher.</p>
                  </div>
                )}

                {/* Weaknesses */}
                {coachingItems.filter(i => i.type === "weakness").length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" /> Areas to Strengthen
                    </p>
                    <div className="space-y-3">
                      {coachingItems.filter(i => i.type === "weakness").map((item, idx) => (
                        <CoachingCard key={`w-${idx}`} item={item} navigate={navigate} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Objections */}
                {coachingItems.filter(i => i.type === "objection").length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5 font-medium">
                      <MessageCircleQuestion className="h-3.5 w-3.5 text-destructive" /> Objections Investors Will Raise
                    </p>
                    <div className="space-y-3">
                      {coachingItems.filter(i => i.type === "objection").map((item, idx) => (
                        <div key={`o-${idx}`} className="p-4 rounded-sm bg-destructive/5 border border-destructive/15">
                          <p className="text-sm font-semibold text-foreground mb-1.5">"{item.title}"</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.detail}</p>
                          <div className="p-3 rounded-sm bg-background/50 border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Suggested Response</p>
                            <p className="text-sm text-foreground/80 leading-relaxed italic">{item.fix}</p>
                          </div>
                          {item.linkPitchPrep && (
                            <p className="text-xs text-electric mt-2 flex items-center gap-1">
                              <Link2 className="h-3 w-3" /> You'll likely get asked about this — see Common Investor Questions in Pitch Prep
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opportunities */}
                {coachingItems.filter(i => i.type === "opportunity").length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5 font-medium">
                      <TrendingUp className="h-3.5 w-3.5 text-electric" /> Opportunities
                    </p>
                    <div className="space-y-3">
                      {coachingItems.filter(i => i.type === "opportunity").map((item, idx) => (
                        <div key={`op-${idx}`} className="flex items-start gap-3 p-4 rounded-sm bg-electric/5 border border-electric/10">
                          <Lightbulb className="h-4 w-4 text-electric shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground mb-1">{item.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.fix}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CoachingCard({ item, navigate }: { item: CoachingItem; navigate: (path: string) => void }) {
  return (
    <div className="p-4 rounded-sm bg-muted/50 border border-border accent-left-border">
      <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.detail}</p>
      <div className="p-3 rounded-sm bg-background/50 border border-border mb-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">How to Fix</p>
        <p className="text-sm text-foreground/80 leading-relaxed">{item.fix}</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {item.linkSection && item.linkTab && (
          <span className="text-xs text-electric flex items-center gap-1">
            <Link2 className="h-3 w-3" /> Fix this in {item.linkSection}
          </span>
        )}
        {item.linkPitchPrep && (
          <span className="text-xs text-electric flex items-center gap-1">
            <MessageCircleQuestion className="h-3 w-3" /> See Pitch Prep → Investor Questions
          </span>
        )}
      </div>
    </div>
  );
}
