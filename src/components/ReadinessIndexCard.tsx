import type { ReadinessIndex, NarrativeOutputData } from "@/types/narrative";
import { Check, AlertTriangle, X, ArrowRight } from "lucide-react";

interface Props { output: NarrativeOutputData; isPro: boolean; }

function computeReadiness(output: NarrativeOutputData): ReadinessIndex {
  const score = output.score;
  const d = output.data as any;
  const mode = output.mode;
  const checklist: ReadinessIndex["checklist"] = [];
  const missing: string[] = [];
  const strengths: string[] = [];

  if (mode === "fundraising") {
    checklist.push({ label: "Thesis Structured", status: d.thesis?.content ? "done" : "missing" });
    checklist.push({ label: "Differentiation Framed", status: d.narrativeStructure?.whyThisWins ? "done" : "missing" });
    checklist.push({ label: "Risks Addressed", status: d.risks && d.risks.length > 20 ? "done" : "warning" });
    checklist.push({ label: "Deck Framework", status: d.deckFramework?.length >= 6 ? "done" : "warning" });
    checklist.push({ label: "Pitch Script", status: d.pitchScript ? "done" : "missing" });
    checklist.push({ label: "Market Logic", status: d.marketLogic?.length >= 2 ? "done" : "missing" });
    if (!d.thesis?.content) missing.push("Investment thesis needs development");
    if (!d.risks || d.risks.length < 20) missing.push("Risk articulation needs depth");
  } else if (mode === "board_update") {
    checklist.push({ label: "Executive Summary", status: d.executiveSummary ? "done" : "missing" });
    checklist.push({ label: "KPI Framing", status: d.metricsNarrative ? "done" : "warning" });
    checklist.push({ label: "Forward Risks", status: d.risksFocus ? "done" : "warning" });
    checklist.push({ label: "Strategic Decisions", status: d.boardDeckOutline?.length >= 4 ? "done" : "missing" });
    if (!d.risksFocus) missing.push("Forward-looking risks needed");
  } else if (mode === "strategy") {
    checklist.push({ label: "Strategic Thesis", status: d.thesis ? "done" : "missing" });
    checklist.push({ label: "Market Positioning", status: d.positioning ? "done" : "missing" });
    checklist.push({ label: "Competitive Framework", status: d.competitiveFramework ? "done" : "warning" });
    checklist.push({ label: "Market Analysis", status: d.marketAnalysis ? "done" : "missing" });
  } else if (mode === "product_vision") {
    checklist.push({ label: "Vision Statement", status: d.vision ? "done" : "missing" });
    checklist.push({ label: "Problem Definition", status: d.userProblem ? "done" : "missing" });
    checklist.push({ label: "Solution Framework", status: d.solutionFramework ? "done" : "warning" });
    checklist.push({ label: "Roadmap", status: d.roadmapNarrative ? "done" : "missing" });
  } else if (mode === "investor_update") {
    checklist.push({ label: "Headline", status: d.headline ? "done" : "missing" });
    checklist.push({ label: "Progress Report", status: d.progress ? "done" : "missing" });
    checklist.push({ label: "Metrics", status: d.metrics ? "done" : "warning" });
    checklist.push({ label: "Challenges", status: d.challenges ? "done" : "warning" });
    checklist.push({ label: "Next Milestones", status: d.nextMilestones ? "done" : "missing" });
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

  if (score?.strengths) strengths.push(...score.strengths.slice(0, 2));
  if (score?.gaps) missing.push(...score.gaps.slice(0, 2));

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

function getStatusIcon(status: ReadinessIndex["checklist"][0]["status"]) {
  switch (status) {
    case "done": return <Check className="h-3.5 w-3.5 text-emerald" />;
    case "warning": return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />;
    case "missing": return <X className="h-3.5 w-3.5 text-muted-foreground/40" />;
  }
}

export function ReadinessIndexCard({ output, isPro }: Props) {
  const readiness = computeReadiness(output);
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="shrink-0">
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1.5">Capital Readiness</p>
        <p className={`text-lg font-bold ${getLevelColor(readiness.level)}`}>{readiness.level}</p>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {readiness.checklist.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            {getStatusIcon(item.status)}
            <span className={`text-xs ${item.status === "done" ? "text-foreground/80" : item.status === "warning" ? "text-foreground/60" : "text-muted-foreground/40"}`}>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 hidden lg:flex gap-6">
        {readiness.strengths.length > 0 && (<div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Strengths</p><ul className="space-y-1">{readiness.strengths.map((s, i) => (<li key={i} className="text-[11px] text-foreground/80">{s}</li>))}</ul></div>)}
        {readiness.missing.length > 0 && (<div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">What's Missing</p><ul className="space-y-1">{readiness.missing.slice(0, 2).map((g, i) => (<li key={i} className="text-[11px] text-foreground/60">{g}</li>))}</ul></div>)}
      </div>
      <div className="shrink-0 hidden lg:block">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Next Action</p>
        <p className="text-[11px] text-electric flex items-center gap-1">{readiness.nextAction}<ArrowRight className="h-3 w-3" /></p>
      </div>
    </div>
  );
}
