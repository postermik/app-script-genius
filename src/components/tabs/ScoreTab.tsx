import { useState, useMemo, useCallback } from "react";
import { Check, Sparkles, Loader2, Lock, Compass, X, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useDecksmith } from "@/context/DecksmithContext";
import type { NarrativeOpportunity } from "@/context/DecksmithContext";

// Strip markdown formatting from AI research results
function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,4}\s+/gm, "")           // strip heading markers
    .replace(/\*\*([^*]+)\*\*/g, "$1")      // strip bold markers
    .replace(/\*([^*]+)\*/g, "$1")          // strip italic markers
    .replace(/^[-*]\s*$/gm, "")             // remove lines that are just a dash/star/bullet
    .replace(/^\.\s*$/gm, "")              // remove lines that are just a period
    .replace(/^[-*]\s+/gm, "")             // strip bullet markers, keep text
    .replace(/^\u2022\s*/gm, "")           // strip unicode bullets
    .replace(/^>\s*/gm, "")               // strip blockquotes
    .replace(/`([^`]+)`/g, "$1")           // strip inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip links, keep text
    .replace(/\n{2,}/g, "\n\n")            // collapse multiple blank lines
    .trim();
}

function getBarColor(pct: number) {
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
  purpose?: string;
  showRescore?: boolean;
  slides?: { categoryLabel: string; headline: string }[];
  onRescore?: () => void;
  isRescoring?: boolean;
  hasPendingImprovements?: boolean;
}

export function ScoreTab({ score, mode, purpose, slides = [] }: Props) {
  const { computeNarrativeStrength, aiAssistOpportunity, isFree, refineSection, coreNarrative, outputData, updateNarrativeSection, guideSummary, loadingGuideSummary, refreshGuideSummary } = useDecksmith();

  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [applyingOp, setApplyingOp] = useState<string | null>(null);
  const [manuallyApplied, setManuallyApplied] = useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const strength = computeNarrativeStrength();
  const allOpportunities = strength.opportunities;
  const completedOps = strength.completedOpportunities;

  // Build cards from CATEGORIES
  const cards = useMemo(() => {
    const allOps = [...completedOps, ...allOpportunities];
    const categoryMap = new Map<string, { ops: NarrativeOpportunity[]; completed: NarrativeOpportunity[]; uncompleted: NarrativeOpportunity[] }>();

    for (const op of allOps) {
      const cat = op.category;
      if (!categoryMap.has(cat)) categoryMap.set(cat, { ops: [], completed: [], uncompleted: [] });
      const entry = categoryMap.get(cat)!;
      entry.ops.push(op);
      if (op.completed || manuallyApplied.has(op.id)) entry.completed.push(op);
      else entry.uncompleted.push(op);
    }

    return [...categoryMap.entries()].map(([category, data]) => {
      const allDone = data.uncompleted.length === 0;
      const sectionHeading = data.ops[0]?.sectionHeading || "";
      const sectionContent = coreNarrative?.sections?.find((s: any) => s.heading.toLowerCase() === sectionHeading.toLowerCase())?.content || "";
      const preview = sectionContent.length > 120 ? sectionContent.slice(0, 120) + "..." : sectionContent;
      // Missing = section has no meaningful content at all (< 30 chars) and has uncompleted ops
      const isMissing = !allDone && sectionContent.length < 30 && category !== "Materials";
      return {
        category, sectionHeading, sectionContent, preview, allDone, isMissing,
        opportunities: data.uncompleted,
        completedOpportunities: data.completed,
        primaryOp: data.uncompleted[0] || null,
      };
    });
  }, [allOpportunities, completedOps, manuallyApplied, coreNarrative]);

  // Materials
  const slideFw = outputData?.slide_framework?.deckFramework || [];
  const qaItems = outputData?.investor_qa?.investorQA || [];
  const emailVariants = outputData?.pitch_email?.pitchEmails || [];

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
      setActiveCard(null);
      refreshGuideSummary();
    } catch (e: any) {
      toast.error("Failed to apply. Please try again.");
      console.error("[Guide] Apply error:", e);
    } finally { setApplyingOp(null); }
  };

  // Inline edit: save section content directly
  const saveInlineEdit = useCallback(async (sectionHeading: string, newContent: string) => {
    setSavingEdit(true);
    try {
      await updateNarrativeSection(sectionHeading, newContent);
      setEditingSection(null);
      toast.success("Section updated");
    } catch (e: any) {
      toast.error("Failed to save edit.");
      console.error("[Guide] Save error:", e);
    } finally { setSavingEdit(false); }
  }, [updateNarrativeSection]);

  const switchToOutputs = (outputTab?: string) => {
    window.dispatchEvent(new CustomEvent('rhetoric:switch-tab', {
      detail: { tab: 'outputs', outputTab: outputTab || 'core_narrative' }
    }));
  };

  const totalSegments = 10;
  const filledSegments = Math.round((strength.percentage / 100) * totalSegments);

  return (
    <div className="space-y-5">

      {/* CONSULTANT HEADER */}
      <div className="card-gradient rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <p className={`text-sm font-bold ${getTierColor(strength.tier)}`}>{strength.tierLabel}</p>
          {guideSummary && (
            <button onClick={refreshGuideSummary} disabled={loadingGuideSummary} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1">
              <Compass className={`h-3 w-3 ${loadingGuideSummary ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
        {loadingGuideSummary && !guideSummary ? (
          <div className="flex items-center gap-2 py-1 mb-3">
            <Loader2 className="h-3 w-3 animate-spin text-electric" />
            <span className="text-xs text-muted-foreground">Reviewing your narrative...</span>
          </div>
        ) : guideSummary ? (
          <p className="text-[13px] text-foreground/80 leading-relaxed mb-4">{guideSummary}</p>
        ) : (
          <p className="text-[13px] text-muted-foreground/60 mb-4">{strength.tierDescription}</p>
        )}
        <div className="flex gap-1">
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < filledSegments ? getBarColor(strength.percentage) : "bg-muted/40"
            }`} />
          ))}
        </div>
      </div>

      {/* NARRATIVE CARDS */}
      {cards.length > 0 && (
        <div className="relative">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2.5 px-0.5">Your narrative</p>
          <div className={isFree ? "pointer-events-none select-none" : ""} style={isFree ? { filter: "blur(5px)", opacity: 0.45 } : {}}>
            <div className="grid grid-cols-2 gap-2">
              {cards.filter(c => c.category !== "Materials").map((card) => {
                const isActive = activeCard === card.category;
                const borderColor = card.allDone ? "border-l-emerald" : card.isMissing ? "border-l-red-400" : "border-l-amber-500";
                return (
                  <div key={card.category}
                    onClick={() => { if (!isActive) { setActiveCard(card.category); setEditingSection(null); } }}
                    className={`rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                      isActive
                        ? card.allDone ? "border-emerald/40 bg-emerald/[0.03]" : card.isMissing ? "border-red-300 bg-red-50/50" : "border-amber-300 bg-amber-50/50"
                        : `border-l-[3px] ${borderColor} border-t border-r border-b border-t-border/60 border-r-border/60 border-b-border/60 bg-card hover:bg-secondary/50`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-foreground">{card.category}</span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        card.allDone ? "bg-emerald/10 text-emerald" :
                        card.isMissing ? "bg-red-100 text-red-600" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {card.allDone ? "Covered" : card.isMissing ? "Missing" : "Strengthen"}
                      </span>
                    </div>
                    {card.preview && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{card.preview}</p>
                    )}
                    {/* Covered cards: show what was addressed */}
                    {card.allDone && !isActive && card.completedOpportunities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {card.completedOpportunities.map(cop => (
                          <span key={cop.id} className="inline-flex items-center gap-0.5 text-[10px] text-emerald bg-emerald/8 border border-emerald/20 px-1.5 py-0.5 rounded-full">
                            <Check className="h-2.5 w-2.5" /> {cop.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {card.primaryOp && !isActive && (
                      <p className={`text-[11px] mt-2 flex items-center gap-1.5 opacity-80 ${card.isMissing ? "text-red-500" : "text-amber-600"}`}>
                        {card.isMissing ? <AlertTriangle className="h-3 w-3 shrink-0" /> : <Sparkles className="h-3 w-3 shrink-0" />}
                        {card.primaryOp.description}
                      </p>
                    )}
                    {/* No section mapping label on collapsed cards - redundant with card title */}
                  </div>
                );
              })}
            </div>

            {/* EXPANDED PANEL */}
            <div className={`transition-all duration-300 ease-out overflow-hidden ${activeCard ? "max-h-[1200px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"}`}>
              {activeCard && (() => {
                const card = cards.find(c => c.category === activeCard);
                if (!card) return null;
                const op = card.primaryOp;
                const isEditing = editingSection === card.sectionHeading;
                const borderColor = card.allDone ? "border-emerald/20" : card.isMissing ? "border-red-200" : "border-amber-200";

                return (
                  <div className={`rounded-lg border ${borderColor} bg-card p-5 space-y-4`}>
                    {/* Header with close X */}
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold flex items-center gap-1.5 ${card.allDone ? "text-emerald" : "text-electric"}`}>
                        {card.category}
                        {card.allDone && (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">Covered</span>
                        )}
                      </p>
                      <button onClick={(e) => { e.stopPropagation(); setActiveCard(null); setEditingSection(null); }}
                        className="p-1 rounded-lg hover:bg-muted/20 transition-colors text-muted-foreground/60 hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Completed checks summary */}
                    {card.completedOpportunities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {card.completedOpportunities.map(cop => (
                          <span key={cop.id} className="inline-flex items-center gap-1 text-[10px] text-emerald bg-emerald/8 border border-emerald/20 px-2 py-0.5 rounded-full">
                            <Check className="h-2.5 w-2.5" /> {cop.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Section content: always show for non-Materials cards */}
                    {card.category !== "Materials" && (
                      <div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editBuffer}
                              onChange={(e) => setEditBuffer(e.target.value)}
                              className="w-full bg-background/60 border border-border/50 rounded-lg px-3 py-2.5 text-[12px] text-foreground leading-relaxed resize-none focus:outline-none focus:border-electric/50 transition-colors"
                              rows={Math.max(4, Math.ceil(editBuffer.length / 80))}
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setEditingSection(null)}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1">Cancel</button>
                              <button onClick={() => saveInlineEdit(card.sectionHeading, editBuffer)}
                                disabled={savingEdit || editBuffer === card.sectionContent}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-electric text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40">
                                {savingEdit ? <><Loader2 className="h-3 w-3 animate-spin" />Saving...</> : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : card.sectionContent ? (
                          <div className="group relative">
                            <p className="text-[12px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                              {card.sectionContent}
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingSection(card.sectionHeading); setEditBuffer(card.sectionContent); }}
                              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 border border-transparent hover:border-border/40 transition-all">
                              <Pencil className="h-3 w-3" /> Edit core narrative section
                            </button>
                          </div>
                        ) : (
                          <p className="text-[12px] text-muted-foreground/50 italic leading-relaxed">No content in this section yet. Use the input below to add information.</p>
                        )}
                      </div>
                    )}

                    {/* AI suggestions for uncompleted ops */}
                    {op && (
                      <div className="border-t border-border/30 pt-3 space-y-3">
                        <p className="text-[10px] font-semibold text-electric uppercase tracking-wider">{op.label}</p>
                        <p className="text-[11px] text-foreground/60 leading-relaxed">{op.description}</p>

                        {aiResults[op.id] && (
                          <div className="bg-electric/[0.04] border border-electric/15 rounded-lg p-3.5 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3 text-electric" />
                              <span className="text-[10px] font-semibold text-electric uppercase tracking-wider">Here's what I found</span>
                            </div>
                            <div className="max-h-[280px] overflow-y-auto">
                              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{cleanMarkdown(aiResults[op.id])}</p>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button onClick={() => setAiResults(prev => ({ ...prev, [op.id]: "" }))}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1">Dismiss</button>
                              <button onClick={() => applyToNarrative(op, aiResults[op.id])}
                                disabled={applyingOp === op.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-electric text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40">
                                {applyingOp === op.id ? <><Loader2 className="h-3 w-3 animate-spin" />Applying...</> : card.sectionHeading ? `Add to ${card.sectionHeading}` : "Add to narrative"}
                              </button>
                            </div>
                          </div>
                        )}

                        {op.prompt && (
                          <div>
                            <textarea
                              value={userInputs[op.id] || ""}
                              onChange={(e) => setUserInputs(prev => ({ ...prev, [op.id]: e.target.value }))}
                              placeholder={op.prompt}
                              className="w-full bg-background/60 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-electric/50 transition-colors"
                              rows={2}
                            />
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {op.aiAssistAvailable && !aiResults[op.id] && (
                                  <button onClick={() => handleAiAssist(op)} disabled={loadingAi === op.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-electric/70 hover:text-electric border border-electric/20 hover:border-electric/40 transition-colors disabled:opacity-50">
                                    {loadingAi === op.id ? <><Loader2 className="h-3 w-3 animate-spin" />Researching...</> : <><Sparkles className="h-3 w-3" />Help me find this</>}
                                  </button>
                                )}
                              </div>
                              <button onClick={() => applyToNarrative(op, userInputs[op.id] || "")}
                                disabled={!userInputs[op.id]?.trim() || applyingOp === op.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-electric text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40">
                                {applyingOp === op.id ? <><Loader2 className="h-3 w-3 animate-spin" />Applying...</> : card.sectionHeading ? `Add to ${card.sectionHeading}` : "Add to narrative"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {isFree && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/70 backdrop-blur-[2px]">
              <Lock className="h-5 w-5 text-electric mb-2.5" />
              <p className="text-sm font-semibold text-foreground mb-1">Upgrade to unlock your narrative guide</p>
              <p className="text-xs text-muted-foreground mb-4 text-center px-6">Personalized guidance with AI-powered research</p>
              <button onClick={() => window.dispatchEvent(new CustomEvent('rhetoric:upgrade-required'))}
                className="px-4 py-2 text-xs font-medium bg-electric text-primary-foreground rounded-lg hover:opacity-90 transition-opacity glow-blue">
                Upgrade to Hobby
              </button>
            </div>
          )}
        </div>
      )}

      {/* MATERIALS */}
      {(slideFw.length > 0 || qaItems.length > 0 || emailVariants.length > 0) && (
        <div>
          {/* Ready message when narrative is strong (70%+ = ready or exceptional tier) */}
          {(strength.tier === "ready" || strength.tier === "exceptional") && (
            <p className="text-xs text-foreground/60 mb-3 leading-relaxed">
              {purpose === "sales" ? "Your pitch is ready. Export your materials or refine your approach." : purpose === "board_meeting" ? "Your update is ready. Export your materials." : "Your narrative is ready. Export your materials or start finding investors."}
            </p>
          )}
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2.5 px-0.5">Your materials</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {slideFw.length > 0 && (
              <button onClick={() => switchToOutputs('slide_framework')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-card/30 border border-border/50 text-[11px] text-foreground/60 hover:text-foreground/80 hover:border-border/70 transition-colors">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.6"/><path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>
                {slideFw.length} slides
              </button>
            )}
            {qaItems.length > 0 && (
              <button onClick={() => switchToOutputs('investor_qa')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-card/30 border border-border/50 text-[11px] text-foreground/60 hover:text-foreground/80 hover:border-border/70 transition-colors">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1" opacity="0.6"/><path d="M6 6.5c0-1.1.9-1.5 2-1.5s2 .7 2 1.5c0 1.5-2 1.5-2 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/><circle cx="8" cy="12" r="0.5" fill="currentColor" opacity="0.6"/></svg>
                {qaItems.length} Q&A
              </button>
            )}
            {emailVariants.length > 0 && (
              <button onClick={() => switchToOutputs('pitch_email')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-card/30 border border-border/50 text-[11px] text-foreground/60 hover:text-foreground/80 hover:border-border/70 transition-colors">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4l6 4 6-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.6"/></svg>
                {emailVariants.length} emails
              </button>
            )}
          </div>
        </div>
      )}

      {/* ADAPTIVE CTA */}
      <div className="pt-1">
        {strength.tier === "ready" || strength.tier === "exceptional" ? (
          <div className="flex gap-2">
            <button onClick={() => switchToOutputs()}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-electric text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              Export materials
            </button>
            {(!purpose || purpose === "fundraising") && (
              <a href="/raise/investors"
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium border border-border/60 rounded-lg hover:bg-muted/10 hover:border-border transition-colors text-foreground/70">
                Find investors
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-secondary-foreground text-center leading-relaxed">
            Continue strengthening your narrative above.
          </p>
        )}
      </div>
    </div>
  );
}