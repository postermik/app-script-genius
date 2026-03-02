import { useState } from "react";
import type { ReadinessIndex, NarrativeOutputData } from "@/types/narrative";
import { Check, AlertTriangle, X, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

interface Props { output: NarrativeOutputData; isPro: boolean; }

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

export function ReadinessIndexCard({ output, isPro }: Props) {
  const readiness = computeReadiness(output);
  const [expanded, setExpanded] = useState(false);
  const score = output.score?.overall || 50;

  return (
    <div>
      {/* Main horizontal scorecard bar */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Left: Score */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-2xl font-bold tabular-nums ${getLevelColor(readiness.level)}`}>{score}</span>
          <div>
            <p className="text-xs font-medium text-foreground leading-tight">Capital Readiness</p>
            <p className={`text-[11px] font-semibold ${getLevelColor(readiness.level)}`}>{readiness.level}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border hidden sm:block" />

        {/* Middle: Badges */}
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {readiness.checklist.map((item) => (
            <span key={item.label}>{getStatusBadge(item)}</span>
          ))}
        </div>

        {/* Right: CTA + expand toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="text-xs px-4 py-2 rounded-sm font-medium bg-electric text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 glow-blue">
            {readiness.nextAction.length > 40 ? readiness.nextAction.slice(0, 38) + "…" : readiness.nextAction}
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title={expanded ? "Collapse" : "Show details"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border flex gap-8 animate-fade-in flex-wrap">
          {readiness.strengths.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Strengths</p>
              <ul className="space-y-1">
                {readiness.strengths.map((s, i) => (
                  <li key={i} className="text-[11px] text-foreground/80">✓ {s}</li>
                ))}
              </ul>
            </div>
          )}
          {readiness.missing.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Gaps</p>
              <ul className="space-y-1">
                {readiness.missing.map((g, i) => (
                  <li key={i} className="text-[11px] text-foreground/60">• {g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
