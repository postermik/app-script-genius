import { useState, useEffect, useMemo } from "react";
import { Check, ChevronDown, ChevronUp, Sparkles, Loader2, TrendingUp, Lock, Compass, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDecksmith } from "@/context/DecksmithContext";
import type { NarrativeOpportunity } from "@/context/DecksmithContext";

function getGaugeStroke(pct: number) {
  if (pct >= 90) return "hsl(155 60% 45%)";
  if (pct >= 70) return "hsl(217 91% 60%)";
  if (pct >= 40) return "hsl(48 96% 53%)";
  return "hsl(222 16% 28%)";
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

export function ScoreTab({ score, mode, slides = [] }: Props) {
  const { computeNarrativeStrength, aiAssistOpportunity, generateGuideSummary, isFree, refineSection, coreNarrative, outputData } = useDecksmith();

  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [applyingOp, setApplyingOp] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [manuallyApplied, setManuallyApplied] = useState<Set<string>>(new Set());

  const strength = computeNarrativeStrength();
  const allOpportunities = strength.opportunities;
  const completedOps = strength.completedOpportunities;

  // Build narrative section map
  const rooms = useMemo(() => {
    if (!coreNarrative?.sections?.length) return [];
    return coreNarrative.sections.map((section: any, idx: number) => {
      const heading = section.heading;
      const content = section.content || "";
      const preview = content.length > 140 ? content.slice(0, 140) + "..." : content;
      const sectionOps = allOpportunities.filter(o => o.sectionHeading.toLowerCase() === heading.toLowerCase());
      const completedSectionOps = completedOps.filter(o => o.sectionHeading.toLowerCase() === heading.toLowerCase());
      const allOpsApplied = sectionOps.length > 0 && sectionOps.every(o => manuallyApplied.has(o.id));
      const needsWork = sectionOps.length > 0 && !allOpsApplied;
      return { heading, content, preview, idx, needsWork, allOpsApplied, opportunities: sectionOps, completedOpportunities: completedSectionOps };
    });
  }, [coreNarrative, allOpportunities, completedOps, manuallyApplied]);

  // Materials
  const slideFw = outputData?.slide_framework?.deckFramework || [];
  const qaItems = outputData?.investor_qa?.investorQA || [];
  const emailVariants = outputData?.pitch_email?.pitchEmails || [];
  const memoSections = outputData?.investment_memo?.sections || [];

  // Load consultant summary
  useEffect(() => {
    if (!coreNarrative?.sections?.length || summaryLoaded) return;
    let cancelled = false;
    setLoadingSummary(true);
    generateGuideSummary().then(result => {
      if (!cancelled) { setSummary(result); setSummaryLoaded(true); }
    }).catch(() => {}).finally(() => { if (!cancelled) setLoadingSummary(false); });
    return () => { cancelled = true; };
  }, [coreNarrative, generateGuideSummary, summaryLoaded]);

  const refreshSummary = async () => {
    setLoadingSummary(true);
    try { const result = await generateGuideSummary(); setSummary(result); }
    catch {} finally { setLoadingSummary(false); }
  };

  const handleAiAssist = async (op: NarrativeOpportunity) => {
    setLoadingAi(op.id);
    try {
      const result = await aiAssistOpportunity(op.id, "");
      setAiResults(prev => ({ ...prev, [op.id]: result }));
    } catch {
      setAiResults(prev => ({ ...prev, [op.id]: "Could not generate suggestions. Try again." }));
    } finally { setLoadingAi(null); }
  };

  const applyToNarrative = async (op: NarrativeOpportunity, content: string) => {
    if (!content.trim()) return;
    setApplyingOp(op.id);
    console.log("[Guide] Applying:", op.id, op.sectionHeading);
    try {
      const cn = coreNarrative;
      const sectionIdx = cn?.sections?.findIndex((s: any) =>
        s.heading.toLowerCase() === op.sectionHeading.toLowerCase()
      ) ?? -1;

      if (sectionIdx >= 0) {
        await refineSection(`opportunity-${op.id}`, `coreNarrative.sections.${sectionIdx}.content`,
          `Incorporate this information naturally into this section. Keep existing content and weave in the new information: ${content}` as any);
        toast.success(`Updated ${cn?.sections?.[sectionIdx]?.heading} section`);
      } else {
        await refineSection(`opportunity-${op.id}`, "narrativeStructure",
          `Add to the narrative in the context of ${op.category}: ${content}` as any);
        toast.success("Narrative updated");
      }
      setManuallyApplied(prev => new Set(prev).add(op.id));
      setUserInputs(prev => ({ ...prev, [op.id]: "" }));
      setAiResults(prev => ({ ...prev, [op.id]: "" }));
      setActiveRoom(null);
      refreshSummary();
    } catch (e: any) {
      toast.error("Failed to apply. Please try again.");
      console.error("[Guide] Apply error:", e);
    } finally { setApplyingOp(null); }
  };

  // Switch to Outputs tab
  const switchToOutputs = () => {
    window.dispatchEvent(new CustomEvent('rhetoric:switch-tab', { detail: { tab: 'outputs' } }));
  };

  return (
    <div className="space-y-5">

      {/* CONSULTANT SUMMARY */}
      <div className="card-gradient rounded-sm border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="23" fill="none" stroke="hsl(222 16% 16%)" strokeWidth="4" />
              <circle cx="28" cy="28" r="23" fill="none" stroke={getGaugeStroke(strength.percentage)}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={String(2 * Math.PI * 23)}
                strokeDashoffset={String(2 * Math.PI * 23 * (1 - strength.percentage / 100))}
                transform="rotate(-90 28 28)" />
              <text x="28" y="25" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold" style={{ fontSize: "14px" }}>{strength.completedCount}</text>
              <text x="28" y="37" textAnchor="middle" dominantBaseline="middle" className="fill-secondary-foreground" style={{ fontSize: "8px", fontWeight: 500 }}>of {strength.totalCount}</text>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-sm font-bold ${getTierColor(strength.tier)}`}>{strength.tierLabel}</p>
              {summaryLoaded && (
                <button onClick={refreshSummary} disabled={loadingSummary} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1">
                  <Compass className={`h-3 w-3 ${loadingSummary ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>
            {loadingSummary && !summary ? (
              <div className="flex items-center gap-2 py-1">
                <Loader2 className="h-3 w-3 animate-spin text-electric" />
                <span className="text-xs text-muted-foreground">Reviewing your narrative...</span>
              </div>
            ) : summary ? (
              <p className="text-[13px] text-foreground/80 leading-relaxed">{summary}</p>
            ) : (
              <p className="text-[13px] text-muted-foreground/60">{strength.tierDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* NARRATIVE MAP */}
      {rooms.length > 0 && (
        <div className="relative">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/60 mb-2.5 px-0.5">Your narrative</p>
          <div className={isFree ? "pointer-events-none select-none" : ""} style={isFree ? { filter: "blur(5px)", opacity: 0.45 } : {}}>
            <div className="grid grid-cols-2 gap-2">
              {rooms.map((room) => {
                const isActive = activeRoom === room.heading;
                const primaryOp = room.opportunities[0];
                const showAsComplete = !room.needsWork;
                return (
                  <div key={room.heading}
                    onClick={() => setActiveRoom(isActive ? null : room.heading)}
                    className={`rounded-sm border p-4 cursor-pointer transition-all duration-200 ${
                      isActive
                        ? (showAsComplete ? "border-emerald/40 bg-emerald/[0.03]" : "border-electric/50 bg-electric/[0.04]")
                        : showAsComplete
                        ? "border-l-[3px] border-l-emerald border-t border-r border-b border-t-border/60 border-r-border/60 border-b-border/60 bg-card/30 hover:bg-muted/10"
                        : "border-l-[3px] border-l-electric border-t border-r border-b border-t-border/60 border-r-border/60 border-b-border/60 bg-card/30 hover:bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-foreground">{room.heading}</span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        room.allOpsApplied ? "bg-emerald/10 text-emerald" :
                        room.needsWork ? "bg-electric/10 text-electric" :
                        "bg-emerald/10 text-emerald"
                      }`}>
                        {room.allOpsApplied ? "Applied" : room.needsWork ? "Strengthen" : "Covered"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{room.preview}</p>
                    {primaryOp && !isActive && !room.allOpsApplied && (
                      <p className="text-[11px] text-electric mt-2 flex items-center gap-1.5 opacity-80">
                        <Sparkles className="h-3 w-3 shrink-0" />
                        {primaryOp.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* EXPANDED PANEL */}
            <div className={`grid transition-all duration-300 ease-out ${activeRoom ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
              <div className="overflow-hidden">
                {activeRoom && (() => {
                  const room = rooms.find(r => r.heading === activeRoom);
                  if (!room) return null;
                  const op = room.needsWork ? room.opportunities[0] : null;
                  const fullContent = coreNarrative?.sections?.find((s: any) => s.heading === activeRoom)?.content || "";

                  // Covered or Applied room: show full content with edit hint
                  if (!op) {
                    return (
                      <div className="rounded-sm border border-emerald/20 bg-[hsl(222_24%_7%)] p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-emerald flex items-center gap-1.5">
                            <Check className="h-3 w-3" /> {room.heading}
                          </p>
                          <button onClick={() => setActiveRoom(null)}
                            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">Close</button>
                        </div>
                        <p className="text-[12px] text-foreground/75 leading-relaxed whitespace-pre-wrap">{fullContent}</p>
                        <p className="text-[10px] text-muted-foreground/40 mt-3 flex items-center gap-1">
                          <Pencil className="h-2.5 w-2.5" /> Edit this section in the Outputs tab
                        </p>
                      </div>
                    );
                  }

                  // Strengthen room: input + AI assist
                  return (
                    <div className="rounded-sm border border-electric/30 bg-[hsl(222_24%_7%)] p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-electric">{op.label}</p>
                        <button onClick={() => setActiveRoom(null)}
                          className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">Close</button>
                      </div>

                      {/* AI result */}
                      {aiResults[op.id] && (
                        <div className="bg-electric/[0.04] border border-electric/15 rounded-sm p-3.5 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-electric" />
                            <span className="text-[10px] font-semibold text-electric uppercase tracking-wider">Here's what I found</span>
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{aiResults[op.id]}</p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button onClick={() => setAiResults(prev => ({ ...prev, [op.id]: "" }))}
                              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1">Dismiss</button>
                            <button onClick={() => applyToNarrative(op, aiResults[op.id])}
                              disabled={applyingOp === op.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] font-semibold bg-electric text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40">
                              {applyingOp === op.id ? <><Loader2 className="h-3 w-3 animate-spin" />Applying...</> : "Add to narrative"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* User input */}
                      {op.prompt && (
                        <div>
                          <textarea
                            value={userInputs[op.id] || ""}
                            onChange={(e) => setUserInputs(prev => ({ ...prev, [op.id]: e.target.value }))}
                            placeholder={op.prompt}
                            className="w-full bg-background/60 border border-border/50 rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-electric/50 transition-colors"
                            rows={2}
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {op.aiAssistAvailable && !aiResults[op.id] && (
                                <button onClick={() => handleAiAssist(op)} disabled={loadingAi === op.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-medium text-electric/70 hover:text-electric border border-electric/20 hover:border-electric/40 transition-colors disabled:opacity-50">
                                  {loadingAi === op.id ? <><Loader2 className="h-3 w-3 animate-spin" />Researching...</> : <><Sparkles className="h-3 w-3" />Help me find this</>}
                                </button>
                              )}
                              <button onClick={() => setActiveRoom(null)}
                                className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors px-2 py-1">Skip for now</button>
                            </div>
                            <button onClick={() => applyToNarrative(op, userInputs[op.id] || "")}
                              disabled={!userInputs[op.id]?.trim() || applyingOp === op.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] font-semibold bg-electric text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40">
                              {applyingOp === op.id ? <><Loader2 className="h-3 w-3 animate-spin" />Applying...</> : "Add to narrative"}
                            </button>
                          </div>
                        </div>
                      )}

                      {!op.prompt && op.category === "Materials" && (
                        <p className="text-xs text-muted-foreground/60">Select this output from the Outputs tab to generate it.</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {isFree && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm bg-background/70 backdrop-blur-[2px]">
              <Lock className="h-5 w-5 text-electric mb-2.5" />
              <p className="text-sm font-semibold text-foreground mb-1">Upgrade to unlock your narrative guide</p>
              <p className="text-xs text-muted-foreground mb-4 text-center px-6">Personalized guidance with AI-powered research</p>
              <button onClick={() => window.dispatchEvent(new CustomEvent('rhetoric:upgrade-required'))}
                className="px-4 py-2 text-xs font-medium bg-electric text-primary-foreground rounded-sm hover:opacity-90 transition-opacity glow-blue">
                Upgrade to Hobby
              </button>
            </div>
          )}
        </div>
      )}

      {/* MATERIALS ROW */}
      {(slideFw.length > 0 || qaItems.length > 0 || emailVariants.length > 0 || memoSections.length > 0) && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/60 mb-2.5 px-0.5">Your materials</p>
          <div className="grid grid-cols-3 gap-2">
            {slideFw.length > 0 && (
              <div onClick={switchToOutputs} className="rounded-sm border border-border/60 border-b-2 border-b-emerald bg-card/30 p-3 text-center cursor-pointer hover:bg-muted/10 transition-colors">
                <p className="text-[11px] text-muted-foreground/50 mb-1">{slideFw.length} slides</p>
                <p className="text-xs font-medium text-foreground">Slide framework</p>
                <p className="text-[10px] text-emerald mt-1">Ready</p>
              </div>
            )}
            {qaItems.length > 0 && (
              <div onClick={switchToOutputs} className="rounded-sm border border-border/60 border-b-2 border-b-emerald bg-card/30 p-3 text-center cursor-pointer hover:bg-muted/10 transition-colors">
                <p className="text-[11px] text-muted-foreground/50 mb-1">{qaItems.length} questions</p>
                <p className="text-xs font-medium text-foreground">Investor Q&A</p>
                <p className="text-[10px] text-emerald mt-1">Ready</p>
              </div>
            )}
            {emailVariants.length > 0 && (
              <div onClick={switchToOutputs} className="rounded-sm border border-border/60 border-b-2 border-b-emerald bg-card/30 p-3 text-center cursor-pointer hover:bg-muted/10 transition-colors">
                <p className="text-[11px] text-muted-foreground/50 mb-1">{emailVariants.length} variants</p>
                <p className="text-xs font-medium text-foreground">Pitch emails</p>
                <p className="text-[10px] text-emerald mt-1">Ready</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLETED LOG */}
      {completedOps.length > 0 && allOpportunities.length > 0 && (
        <div className="rounded-sm border border-emerald/20 bg-emerald/5 overflow-hidden">
          <button onClick={() => setShowCompleted(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald/10 transition-colors text-left">
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-emerald" />
              <span className="text-xs font-medium text-emerald/80">{completedOps.length} area{completedOps.length !== 1 ? "s" : ""} covered</span>
            </div>
            {showCompleted ? <ChevronUp className="h-3 w-3 text-emerald/50" /> : <ChevronDown className="h-3 w-3 text-emerald/50" />}
          </button>
          {showCompleted && (
            <div className="border-t border-emerald/10 px-4 py-2.5 space-y-1.5">
              {completedOps.map((op) => (
                <div key={op.id} className="flex items-center gap-2 py-0.5">
                  <Check className="h-2.5 w-2.5 text-emerald shrink-0" />
                  <span className="text-[11px] text-foreground/50">{op.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ALL DONE */}
      {allOpportunities.length === 0 && completedOps.length > 0 && (
        <div className="card-gradient rounded-sm border border-emerald/30 p-5 text-center">
          <Check className="h-6 w-6 text-emerald mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald mb-1">Your narrative is ready for the room</p>
          <p className="text-xs text-muted-foreground">All key areas covered. Export your materials or explore investors.</p>
        </div>
      )}

      {/* CTAs - adaptive based on state */}
      <div className="pt-1">
        {allOpportunities.length > 0 ? (
          <p className="text-[11px] text-muted-foreground/50 text-center leading-relaxed">
            Continue strengthening above, or{" "}
            <button onClick={switchToOutputs} className="text-electric/70 hover:text-electric transition-colors">review your materials</button>
            {" "}when ready.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <a href="/raise/investors"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold border border-foreground/30 rounded-sm hover:bg-muted/10 hover:border-foreground/50 transition-colors text-foreground">
              <TrendingUp className="h-3.5 w-3.5" />Find Investors
            </a>
            <button onClick={() => document.querySelector('[data-export-trigger]')?.click()}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-electric text-primary-foreground rounded-sm hover:opacity-90 transition-opacity">
              Export Materials
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
