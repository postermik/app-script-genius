import { useState } from "react";
import type { ReadinessIndex, NarrativeOutputData, NarrativeScore } from "@/types/narrative";
import { Check, AlertTriangle, X, ChevronDown, ChevronUp, Target, TrendingUp, Shield, Lightbulb } from "lucide-react";

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
  // Adapt labels per mode
  if (mode === "board_update") {
    const labels: Record<string, string> = {
      clarity: "Clarity", marketFraming: "Metrics Coverage", differentiation: "Action Items",
      riskTransparency: "Risk Transparency", persuasiveStructure: "Decision Framing",
    };
    return labels[key] || key;
  }
  if (mode === "strategy") {
    const labels: Record<string, string> = {
      clarity: "Clarity", marketFraming: "Market Framing", differentiation: "Differentiation",
      riskTransparency: "Risk Assessment", persuasiveStructure: "Strategic Logic",
    };
    return labels[key] || key;
  }
  const labels: Record<string, string> = {
    clarity: "Clarity", marketFraming: "Market Framing", differentiation: "Differentiation",
    riskTransparency: "Risk Transparency", persuasiveStructure: "Persuasive Structure",
  };
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
    if (ratio >= 0.9) nextAction = "Generate investor target list and create intro emails.";
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

function getStatusBadge(item: ReadinessIndex["checklist"][0]) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium";
  switch (item.status) {
    case "done":
      return <span className={`${base} bg-emerald/10 text-emerald`}><Check className="h-3 w-3" />{item.label}</span>;
    case "warning":
      return <span className={`${base} bg-yellow-400/10 text-yellow-400`}><AlertTriangle className="h-3 w-3" />{item.label}</span>;
    case "missing":
      return <span className={`${base} bg-muted text-muted-foreground/50`}><X className="h-3 w-3" />{item.label}</span>;
  }
}

function getScoreColor(value: number) {
  if (value >= 80) return "bg-emerald";
  if (value >= 60) return "bg-electric";
  if (value >= 40) return "bg-yellow-400";
  return "bg-destructive";
}

export function ReadinessIndexCard({ output, isPro }: Props) {
  const readiness = computeReadiness(output);
  const [expanded, setExpanded] = useState(true);
  const [detailTab, setDetailTab] = useState<"scores" | "gaps" | "swot">("scores");
  const score = output.score;
  const overall = score?.overall || 50;
  const components = score?.components;
  const gaps = score?.gaps || [];
  const improvements = score?.improvements || [];
  const strengths = score?.strengths || [];
  const mode = output.mode;

  return (
    <div>
      {/* Horizontal scorecard bar */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-2xl font-bold tabular-nums ${getLevelColor(readiness.level)}`}>{overall}</span>
          <div>
            <p className="text-xs font-medium text-foreground leading-tight">{getReadinessLabel(mode)}</p>
            <p className={`text-[11px] font-semibold ${getLevelColor(readiness.level)}`}>{readiness.level}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-border hidden sm:block" />

        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {readiness.checklist.map((item) => (
            <span key={item.label}>{getStatusBadge(item)}</span>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 border border-border rounded-sm shrink-0"
        >
          {expanded ? "Hide" : "Details"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="mt-5 pt-5 border-t border-border animate-fade-in">
          <div className="flex gap-1 mb-5">
            {[
              { key: "scores" as const, label: "Score Breakdown" },
              { key: "gaps" as const, label: "Gaps & Actions" },
              { key: "swot" as const, label: "SWOT Analysis" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setDetailTab(tab.key)}
                className={`text-[11px] px-3 py-1.5 rounded-sm transition-colors ${
                  detailTab === tab.key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {detailTab === "scores" && components && (
            <div className="space-y-3">
              {Object.entries(components).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground w-32 shrink-0">{getScoreLabel(key, mode)}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${getScoreColor(value)}`} style={{ width: `${value}%` }} />
                  </div>
                  <span className={`text-[11px] font-medium tabular-nums w-8 text-right ${value >= 80 ? "text-emerald" : value >= 60 ? "text-electric" : "text-muted-foreground"}`}>{value}</span>
                </div>
              ))}
            </div>
          )}
          {detailTab === "scores" && !components && (
            <p className="text-xs text-muted-foreground">Score component data not available for this output.</p>
          )}

          {detailTab === "gaps" && (
            <div className="space-y-4">
              {gaps.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-yellow-400" /> Gaps to Address
                  </p>
                  <div className="space-y-2">
                    {gaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-sm bg-muted/50 border border-border">
                        <div className="w-5 h-5 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold">{i + 1}</span>
                        </div>
                        <span className="text-xs text-foreground/80 leading-relaxed">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {improvements.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3 text-electric" /> Recommended Improvements
                  </p>
                  <div className="space-y-2">
                    {improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-sm bg-electric/5 border border-electric/10">
                        <TrendingUp className="h-3.5 w-3.5 text-electric shrink-0 mt-0.5" />
                        <span className="text-xs text-foreground/80 leading-relaxed">{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {gaps.length === 0 && improvements.length === 0 && (
                <p className="text-xs text-muted-foreground">No gaps or improvements data available.</p>
              )}
            </div>
          )}

          {detailTab === "swot" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-sm bg-emerald/5 border border-emerald/10">
                <p className="text-[10px] font-semibold text-emerald uppercase tracking-wider mb-2 flex items-center gap-1"><Check className="h-3 w-3" /> Strengths</p>
                {strengths.length > 0 ? (<ul className="space-y-1.5">{strengths.map((s, i) => <li key={i} className="text-[11px] text-foreground/70 leading-relaxed">• {s}</li>)}</ul>) : <p className="text-[11px] text-muted-foreground">—</p>}
              </div>
              <div className="p-3 rounded-sm bg-yellow-400/5 border border-yellow-400/10">
                <p className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Weaknesses</p>
                {gaps.length > 0 ? (<ul className="space-y-1.5">{gaps.map((g, i) => <li key={i} className="text-[11px] text-foreground/70 leading-relaxed">• {g}</li>)}</ul>) : <p className="text-[11px] text-muted-foreground">—</p>}
              </div>
              <div className="p-3 rounded-sm bg-electric/5 border border-electric/10">
                <p className="text-[10px] font-semibold text-electric uppercase tracking-wider mb-2 flex items-center gap-1"><Target className="h-3 w-3" /> Opportunities</p>
                {improvements.length > 0 ? (<ul className="space-y-1.5">{improvements.map((o, i) => <li key={i} className="text-[11px] text-foreground/70 leading-relaxed">• {o}</li>)}</ul>) : <p className="text-[11px] text-muted-foreground">—</p>}
              </div>
              <div className="p-3 rounded-sm bg-destructive/5 border border-destructive/10">
                <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Threats</p>
                {readiness.missing.length > 0 ? (<ul className="space-y-1.5">{readiness.missing.map((t, i) => <li key={i} className="text-[11px] text-foreground/70 leading-relaxed">• {t}</li>)}</ul>) : <p className="text-[11px] text-muted-foreground">—</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
