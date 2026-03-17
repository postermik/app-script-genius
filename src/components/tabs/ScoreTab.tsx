import { useState, useEffect } from "react";
import { Check, ChevronDown, ChevronUp, Sparkles, Loader2, TrendingUp, Lock, Compass } from "lucide-react";
import { useDecksmith } from "@/context/DecksmithContext";
import type { NarrativeOpportunity } from "@/context/DecksmithContext";

function getTierColor(tier: string) {
  if (tier === "exceptional") return "text-emerald";
  if (tier === "ready") return "text-electric";
  if (tier === "sharpening") return "text-yellow-400";
  return "text-muted-foreground";
}

function getGaugeStroke(pct: number) {
  if (pct >= 90) return "hsl(155 60% 45%)";
  if (pct >= 70) return "hsl(217 91% 60%)";
  if (pct >= 40) return "hsl(48 96% 53%)";
  return "hsl(222 16% 28%)";
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

export function ScoreTab({ score, mode, slides = [] }: Props) {
  const { computeNarrativeStrength, aiAssistOpportunity, generateGuideSummary, isFree, refineSection, coreNarrative } = useDecksmith();

  const [expandedOp, setExpandedOp] = useState<string | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [applyingOp, setApplyingOp] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryLoaded, setSummaryLoaded] = useState(false);

  const strength = computeNarrativeStrength();
  const allOpportunities = strength.opportunities;
  const completedCount = strength.completedCount;
  const totalCount = strength.totalCount;

  // Load consultant summary on mount or when narrative changes
  useEffect(() => {
    if (!coreNarrative?.sections?.length || summaryLoaded) return;
    let cancelled = false;
    setLoadingSummary(true);
    generateGuideSummary().then(result => {
      if (!cancelled) {
        setSummary(result);
        setSummaryLoaded(true);
      }
    }).catch(() => {
      if (!cancelled) setSummary("");
    }).finally(() => {
      if (!cancelled) setLoadingSummary(false);
    });
    return () => { cancelled = true; };
  }, [coreNarrative, generateGuideSummary]);

  const refreshSummary = async () => {
    setLoadingSummary(true);
    try {
      const result = await generateGuideSummary();
      setSummary(result);
    } catch {
      // keep existing summary
    } finally {
      setLoadingSummary(false);
    }
  };

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
      const cn = coreNarrative;
      const sectionIdx = cn?.sections?.findIndex((s: any) =>
        s.heading.toLowerCase() === op.sectionHeading.toLowerCase()
      ) ?? -1;

      if (sectionIdx >= 0) {
        await refineSection(`opportunity-${op.id}`, `coreNarrative.sections.${sectionIdx}.content`, `Incorporate this information naturally: ${input}` as any);
      } else if (op.sectionHeading) {
        await refineSection(`opportunity-${op.id}`, "narrativeStructure", `Add this to the narrative in the context of ${op.category}: ${input}` as any);
      }
      setUserInputs(prev => ({ ...prev, [op.id]: "" }));
      setExpandedOp(null);
      // Refresh summary after applying
      refreshSummary();
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
      const cn = coreNarrative;
      const sectionIdx = cn?.sections?.findIndex((s: any) =>
        s.heading.toLowerCase() === op.sectionHeading.toLowerCase()
      ) ?? -1;

      if (sectionIdx >= 0) {
        await refineSection(`opportunity-${op.id}`, `coreNarrative.sections.${sectionIdx}.content`, `Incorporate these findings naturally:\n${suggestion}` as any);
      } else if (op.sectionHeading) {
        await refineSection(`opportunity-${op.id}`, "narrativeStructure", `Add these findings to the narrative:\n${suggestion}` as any);
      }
      setAiResults(prev => ({ ...prev, [op.id]: "" }));
      setExpandedOp(null);
      refreshSummary();
    } catch {
      // refineSection shows toast
    } finally {
      setApplyingOp(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* CONSULTANT SUMMARY */}
      <div className="card-gradient rounded-sm border border-border p-5">
        <div className="flex items-start gap-4">
          {/* Subtle gauge */}
          <div className="shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="23" fill="none" stroke="hsl(222 16% 16%)" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="23" fill="none"
                stroke={getGaugeStroke(strength.percentage)}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={String(2 * Math.PI * 23)}
                strokeDashoffset={String(2 * Math.PI * 23 * (1 - strength.percentage / 100))}
                transform="rotate(-90 28 28)"
              />
              <text x="28" y="26" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold" style={{ fontSize: "14px" }}>{completedCount}</text>
              <text x="28" y="38" textAnchor="middle" dominantBaseline="middle" className="fill-secondary-foreground" style={{ fontSize: "8px", fontWeight: 500 }}>of {totalCount}</text>
            </svg>
          </div>

          {/* Summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-bold ${getTierColor(strength.tier)}`}>{strength.tierLabel}</p>
              {summaryLoaded && (
                <button onClick={refreshSummary} disabled={loadingSummary} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1">
                  <Compass className={`h-3 w-3 ${loadingSummary ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
            {loadingSummary && !summary ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-3 w-3 animate-spin text-electric" />
                <span className="text-xs text-muted-foreground">Reviewing your narrative...</span>
              </div>
            ) : summary ? (
              <p className="text-[13px] text-foreground/80 leading-relaxed">{summary}</p>
            ) : (
              <p className="text-[13px] text-muted-foreground/60 leading-relaxed">{strength.tierDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* FOCUS AREAS (uncompleted opportunities) */}
      {allOpportunities.length > 0 && (
        <div className="relative">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3 px-1">
            {allOpportunities.length === 1 ? "One area to strengthen" : `${allOpportunities.length} areas to strengthen`}
          </p>
          <div className={isFree ? "pointer-events-none select-none" : ""} style={isFree ? { filter: "blur(5px)", opacity: 0.45 } : {}}>
            <div className="space-y-2">
              {allOpportunities.map((op) => {
                const expanded = expandedOp === op.id;
                const hasAiResult = !!aiResults[op.id];
                const isLoading = loadingAi === op.id;
                const isApplying = applyingOp === op.id;

                return (
                  <div key={op.id} className="card-gradient rounded-sm border border-border overflow-hidden">
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
                        <span className="text-[9px] font-semibold text-muted-foreground/50 bg-muted/20 px-1.5 py-0.5 rounded-full">{op.category}</span>
                        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 border-t border-border/50 pt-3 animate-fade-in space-y-3">
                        {/* User input */}
                        {op.prompt && (
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
                        )}

                        {/* Non-input opportunities (like "generate slides") */}
                        {!op.prompt && op.category === "Materials" && (
                          <p className="text-xs text-muted-foreground/70">Select this output from the Outputs tab to generate it.</p>
                        )}

                        {/* AI suggestion result */}
                        {hasAiResult && (
                          <div className="bg-electric/[0.04] border border-electric/15 rounded-sm p-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3 text-electric" />
                              <span className="text-[10px] font-semibold text-electric uppercase tracking-wider">Here's what I found</span>
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
              <p className="text-sm font-semibold text-foreground mb-1">Upgrade to unlock your narrative guide</p>
              <p className="text-xs text-muted-foreground mb-4 text-center px-6">
                Personalized guidance with AI-powered research to strengthen your pitch
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

      {/* ALL DONE */}
      {allOpportunities.length === 0 && completedCount > 0 && (
        <div className="card-gradient rounded-sm border border-emerald/30 p-5 text-center">
          <Check className="h-6 w-6 text-emerald mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald mb-1">Your narrative is ready for the room</p>
          <p className="text-xs text-muted-foreground">All key areas covered. Export your materials and start your conversations.</p>
        </div>
      )}

      {/* COMPLETED AREAS */}
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
          {showCompleted && (
            <div className="border-t border-emerald/10 px-4 py-3 space-y-2">
              {strength.completedOpportunities.map((op) => (
                <div key={op.id} className="flex items-center gap-2 py-1">
                  <Check className="h-3 w-3 text-emerald shrink-0" />
                  <span className="text-xs text-foreground/60">{op.label}</span>
                  <span className="text-[9px] text-muted-foreground/40 ml-auto">{op.category}</span>
                </div>
              ))}
            </div>
          )}
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