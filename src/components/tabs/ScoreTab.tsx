import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Sparkles, Loader2, TrendingUp, Lock, RefreshCw } from "lucide-react";
import { useDecksmith } from "@/context/DecksmithContext";
import type { NarrativeOpportunity } from "@/context/DecksmithContext";

function getProgressColor(pct: number) {
  if (pct >= 90) return "bg-emerald";
  if (pct >= 70) return "bg-electric";
  if (pct >= 40) return "bg-yellow-400";
  return "bg-muted-foreground/40";
}

function getTierColor(tier: string) {
  if (tier === "exceptional") return "text-emerald";
  if (tier === "ready") return "text-electric";
  if (tier === "sharpening") return "text-yellow-400";
  return "text-muted-foreground";
}

interface Props {
  score: any;
  mode: string;
  showRescore?: boolean;
  slides?: { categoryLabel: string; headline: string }[];
  onRescore?: () => void;
  isRescoring?: boolean;
  hasPendingImprovements?: boolean;
}

export function ScoreTab({ score, mode, showRescore, onRescore, isRescoring, slides = [] }: Props) {
  const { computeNarrativeStrength, aiAssistOpportunity, isFree, refineSection } = useDecksmith();

  const [expandedOp, setExpandedOp] = useState<string | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [applyingOp, setApplyingOp] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const strength = computeNarrativeStrength();
  const allOpportunities = strength.opportunities;
  const completedCount = strength.completedCount;
  const totalCount = strength.totalCount;

  const handleAiAssist = async (op: NarrativeOpportunity) => {
    setLoadingAi(op.id);
    try {
      const result = await aiAssistOpportunity(op.id, "");
      setAiResults(prev => ({ ...prev, [op.id]: result }));
    } catch {
      setAiResults(prev => ({ ...prev, [op.id]: "Could not generate suggestions. Please try again." }));
    } finally {
      setLoadingAi(null);
    }
  };

  const handleApplyUserInput = async (op: NarrativeOpportunity) => {
    const input = userInputs[op.id]?.trim();
    if (!input) return;
    setApplyingOp(op.id);
    try {
      const directive = `Incorporate this information into the ${op.category} section: ${input}`;
      await refineSection(`opportunity-${op.id}`, "narrativeStructure", directive as any);
      setUserInputs(prev => ({ ...prev, [op.id]: "" }));
      setExpandedOp(null);
    } catch {
      // refineSection shows toast
    } finally {
      setApplyingOp(null);
    }
  };

  const handleApplyAiSuggestion = async (op: NarrativeOpportunity) => {
    const suggestion = aiResults[op.id];
    if (!suggestion) return;
    setApplyingOp(op.id);
    try {
      const directive = `Incorporate these findings into the ${op.category} section:\n${suggestion}`;
      await refineSection(`opportunity-${op.id}`, "narrativeStructure", directive as any);
      setAiResults(prev => ({ ...prev, [op.id]: "" }));
      setExpandedOp(null);
    } catch {
      // refineSection shows toast
    } finally {
      setApplyingOp(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* HERO: Progress + tier */}
      <div className="card-gradient rounded-sm border border-border p-5">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="36" fill="none" stroke="hsl(222 16% 16%)" strokeWidth="6" />
              <circle
                cx="45" cy="45" r="36" fill="none"
                stroke={strength.percentage >= 90 ? "hsl(155 60% 45%)" : strength.percentage >= 70 ? "hsl(217 91% 60%)" : strength.percentage >= 40 ? "hsl(48 96% 53%)" : "hsl(222 16% 28%)"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={String(2 * Math.PI * 36)}
                strokeDashoffset={String(2 * Math.PI * 36 * (1 - strength.percentage / 100))}
                transform="rotate(-90 45 45)"
              />
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
                return <line key={i} x1={45 + 41 * Math.cos(angle)} y1={45 + 41 * Math.sin(angle)} x2={45 + 44 * Math.cos(angle)} y2={45 + 44 * Math.sin(angle)} stroke="hsl(222 16% 28%)" strokeWidth="1.5" />;
              })}
              <text x="45" y="42" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold" style={{ fontSize: "20px" }}>{completedCount}</text>
              <text x="45" y="56" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: "9px" }}>of {totalCount}</text>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1">Narrative Strength</p>
            <p className={`text-lg font-bold ${getTierColor(strength.tier)}`}>{strength.tierLabel}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 mb-2">{strength.tierDescription}</p>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${getProgressColor(strength.percentage)}`} style={{ width: `${strength.percentage}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{completedCount} of {totalCount} areas covered</p>
          </div>
        </div>
      </div>

      {/* OPPORTUNITIES */}
      {allOpportunities.length > 0 && (
        <div className="relative card-gradient rounded-sm border border-border p-5 pb-6">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
            Strengthen your narrative
          </h3>
          <div className={isFree ? "pointer-events-none select-none" : ""} style={isFree ? { filter: "blur(5px)", opacity: 0.45 } : {}}>
            <div className="space-y-2">
              {allOpportunities.map((op) => {
                const expanded = expandedOp === op.id;
                const hasAiResult = !!aiResults[op.id];
                const isLoading = loadingAi === op.id;
                const isApplying = applyingOp === op.id;

                return (
                  <div key={op.id} className="rounded-sm border border-border/60 bg-card/30 overflow-hidden">
                    <button
                      onClick={() => setExpandedOp(expanded ? null : op.id)}
                      className="w-full flex items-start justify-between px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <Sparkles className="h-3.5 w-3.5 text-electric shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground/90">{op.label}</span>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{op.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3 mt-0.5">
                        <span className="text-[9px] font-semibold text-electric/60 bg-electric/10 px-1.5 py-0.5 rounded-full">+{op.points}</span>
                        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 border-t border-border/50 pt-3 animate-fade-in space-y-3">
                        <div>
                          <textarea
                            value={userInputs[op.id] || ""}
                            onChange={(e) => setUserInputs(prev => ({ ...prev, [op.id]: e.target.value }))}
                            placeholder={op.prompt}
                            className="w-full bg-background/60 border border-border/50 rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:border-electric/50 transition-colors"
                            rows={2}
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {op.aiAssistAvailable && !hasAiResult && (
                                <button
                                  onClick={() => handleAiAssist(op)}
                                  disabled={isLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-medium text-electric/70 hover:text-electric border border-electric/20 hover:border-electric/40 transition-colors disabled:opacity-50"
                                >
                                  {isLoading ? <><Loader2 className="h-3 w-3 animate-spin" />Researching...</> : <><Sparkles className="h-3 w-3" />Help me find this</>}
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => handleApplyUserInput(op)}
                              disabled={!userInputs[op.id]?.trim() || isApplying}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-sm text-[10px] font-medium bg-electric text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                            >
                              {isApplying ? <><Loader2 className="h-3 w-3 animate-spin" />Applying...</> : "Add to narrative"}
                            </button>
                          </div>
                        </div>

                        {hasAiResult && (
                          <div className="bg-electric/[0.04] border border-electric/15 rounded-sm p-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3 text-electric" />
                              <span className="text-[10px] font-semibold text-electric uppercase tracking-wider">AI Suggestion</span>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{aiResults[op.id]}</p>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setAiResults(prev => ({ ...prev, [op.id]: "" }))}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handleApplyAiSuggestion(op)}
                                disabled={isApplying}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-sm text-[10px] font-medium bg-electric text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                              >
                                {isApplying ? <><Loader2 className="h-3 w-3 animate-spin" />Applying...</> : "Use this"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {isFree && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm bg-background/70 backdrop-blur-[2px]">
              <Lock className="h-5 w-5 text-electric mb-2.5" />
              <p className="text-sm font-semibold text-foreground mb-1">Upgrade to unlock narrative guidance</p>
              <p className="text-xs text-muted-foreground mb-4 text-center px-6">
                {allOpportunities.length} ways to strengthen your narrative, each with AI-powered assistance
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

      {/* COMPLETED */}
      {completedCount > 0 && (
        <div className="rounded-sm border border-emerald/20 bg-emerald/5 overflow-hidden">
          <button
            onClick={() => setShowCompleted(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald/10 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald" />
              <span className="text-sm font-medium text-emerald/90">{completedCount} area{completedCount !== 1 ? "s" : ""} covered</span>
            </div>
            {showCompleted ? <ChevronUp className="h-3.5 w-3.5 text-emerald/60" /> : <ChevronDown className="h-3.5 w-3.5 text-emerald/60" />}
          </button>
        </div>
      )}

      {/* ALL DONE state */}
      {allOpportunities.length === 0 && completedCount > 0 && (
        <div className="card-gradient rounded-sm border border-emerald/30 p-5 text-center">
          <Check className="h-6 w-6 text-emerald mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald mb-1">Your narrative is ready for the room</p>
          <p className="text-xs text-muted-foreground">All key areas covered. Export your materials and start your conversations.</p>
        </div>
      )}

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