import { useDecksmith } from "@/context/DecksmithContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { OriginalInputSection } from "@/components/project/OriginalInputSection";
import { DeckView } from "@/components/deliverable/DeckView";
import { MemoView } from "@/components/deliverable/MemoView";
import { EmailView } from "@/components/deliverable/EmailView";
import { DocumentView } from "@/components/deliverable/DocumentView";
import { ScoreTab } from "@/components/tabs/ScoreTab";
import { AnalysisTab } from "@/components/tabs/AnalysisTab";
import { OutputTabBar } from "@/components/outputs/OutputTabBar";
import { ElevatorPitchView } from "@/components/outputs/ElevatorPitchView";
import { InvestorQAView } from "@/components/outputs/InvestorQAView";
import { PitchEmailView } from "@/components/outputs/PitchEmailView";
import { InvestmentMemoView } from "@/components/outputs/InvestmentMemoView";
import { SlideShimmer, PitchShimmer, QAShimmer, EmailShimmer, MemoShimmer, ScoreShimmer } from "@/components/outputs/OutputShimmer";
import { sortBySpeed } from "@/lib/outputOrder";
import type { DeckTheme } from "@/components/SlidePreview";
import type { OutputTabKey, OutputDeliverable, ElevatorPitchData, InvestorQAItem, PitchEmailVariant, InvestmentMemoData } from "@/types/rhetoric";
import { getOutputIntent, getDeliverable, getScore, getAnalysis } from "@/types/rhetoric";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useIsMobile } from "@/hooks/use-mobile";

// ── Synthesize outputs from existing data ──

function synthesizeElevatorPitch(output: any): ElevatorPitchData | null {
  const d = output?.data || output?.supporting || {};
  const pitchScript = d.pitchScript;
  const thesis = d.thesis?.content || d.thesis || d.vision || d.headline || "";
  if (!pitchScript && !thesis) return null;

  const sixtySecond = pitchScript || thesis;
  // Derive a 30s version: take first 3 sentences
  const sentences = sixtySecond.split(/(?<=[.!?])\s+/).filter(Boolean);
  const thirtySecond = sentences.slice(0, Math.min(3, sentences.length)).join(" ");

  return { thirtySecond, sixtySecond };
}

function synthesizeInvestorQA(output: any): InvestorQAItem[] | null {
  // From analysis (evaluate mode)
  if (output?.analysis?.commonQuestions?.length) {
    return output.analysis.commonQuestions.map((q: any) => ({
      question: q.question,
      answer: q.suggestedAnswer,
    }));
  }
  // From score gaps/improvements, generate implied Q&A
  const score = output?.score;
  if (!score) return null;
  const items: InvestorQAItem[] = [];
  const gaps = score.gaps || [];
  const improvements = score.improvements || [];
  gaps.forEach((gap: string, i: number) => {
    items.push({
      question: `How do you address: ${gap}?`,
      answer: improvements[i] || "Consider strengthening this area with specific data and examples.",
    });
  });
  return items.length > 0 ? items : null;
}

function synthesizePitchEmails(output: any): PitchEmailVariant[] | null {
  const d = output?.data || output?.supporting || {};
  const thesis = d.thesis?.content || d.thesis || d.vision || "";
  const title = output?.title || "our company";
  if (!thesis) return null;

  const shortThesis = thesis.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");

  return [
    {
      label: "Direct Ask",
      subject: `{firm_name} + ${title} — Quick intro`,
      body: `Hi {investor_name},\n\nI'm building ${title}. ${shortThesis}\n\nWe're raising and I'd love 20 minutes to walk you through our traction. Would next week work?\n\nBest,\n[Your name]`,
    },
    {
      label: "Warm Intro Request",
      subject: `Intro request: ${title}`,
      body: `Hi {mutual_connection},\n\nI'd love an intro to {investor_name} at {firm_name}. ${shortThesis}\n\nHappy to send a one-pager if helpful. Thanks!\n\n[Your name]`,
    },
    {
      label: "Follow-Up",
      subject: `Re: ${title} — following up`,
      body: `Hi {investor_name},\n\nFollowing up on my note last week. Since then we've [milestone]. Would love to share an update — do you have 15 min this week?\n\nBest,\n[Your name]`,
    },
  ];
}

function synthesizeInvestmentMemo(output: any): InvestmentMemoData | null {
  const d = output?.data || output?.supporting || {};
  const sections: { heading: string; content: string }[] = [];

  const thesis = d.thesis?.content || d.thesis || "";
  if (thesis) sections.push({ heading: "Thesis", content: thesis });

  const ns = d.narrativeStructure;
  if (ns?.worldToday) sections.push({ heading: "Problem", content: ns.worldToday + (ns.breakingPoint ? `\n\n${ns.breakingPoint}` : "") });
  if (ns?.newModel) sections.push({ heading: "Solution", content: ns.newModel });

  const market = d.marketLogic;
  if (market) sections.push({ heading: "Market", content: Array.isArray(market) ? market.join("\n• ") : market });

  if (ns?.whyThisWins) sections.push({ heading: "Traction & Differentiation", content: ns.whyThisWins });
  if (d.risks) sections.push({ heading: "Risks", content: d.risks });
  if (d.whyNow) sections.push({ heading: "Why Now", content: d.whyNow });
  if (ns?.theFuture) sections.push({ heading: "The Ask", content: ns.theFuture });

  return sections.length > 0 ? { sections } : null;
}


export function OutputView() {
  const { output, setOutput, reset, isPro, generationCount, currentProjectId, rawInput, isEvaluation, intakeSelections, setIntakeSelections, refineSection, refiningSection, rescoreNarrative, isGenerating } = useDecksmith();
  const navigate = useNavigate();
  const { subscribed } = useSubscription();
  const isMobile = useIsMobile();

  const intent = output ? getOutputIntent(output) : "create";
  const deliverable = output ? getDeliverable(output) : null;
  const score = output ? getScore(output) : null;
  const analysis = output ? getAnalysis(output) : null;

  const effectiveIntent = isEvaluation ? "evaluate" : intent;
  const defaultTab: OutputTabKey = effectiveIntent === "evaluate" ? "analysis" : "outputs";
  const isLoading = isGenerating && !output;

  const [activeTab, setActiveTab] = useState<OutputTabKey>(defaultTab);
  const [excludedSlides, setExcludedSlides] = useState<Set<number>>(new Set());
  const [slideOrder, setSlideOrder] = useState<number[]>([]);
  const [deckTheme, setDeckTheme] = useState<DeckTheme>({ scheme: "dark", primary: "#3b82f6", secondary: "#0b0f14", accent: "#1e3a5f" });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isRefiningPitch, setIsRefiningPitch] = useState(false);
  const [refiningQAIndex, setRefiningQAIndex] = useState<number | null>(null);
  const [isRescoring, setIsRescoring] = useState(false);
  const [outputErrors, setOutputErrors] = useState<Record<string, string>>({});

  // Determine which output tabs to show — preserve user's selection order
  const selectedOutputs: OutputDeliverable[] = intakeSelections?.outputs?.length
    ? intakeSelections.outputs
    : ["slide_framework"];

  const [activeOutputTab, setActiveOutputTab] = useState<OutputDeliverable>(selectedOutputs[0]);

  // Ensure active output tab is valid
  useEffect(() => {
    if (!selectedOutputs.includes(activeOutputTab)) {
      setActiveOutputTab(selectedOutputs[0]);
    }
  }, [selectedOutputs, activeOutputTab]);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputRef = useRef(output);

  const triggerAutoSave = useCallback(async () => {
    if (!currentProjectId) return;
    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    if (output === outputRef.current) return;
    outputRef.current = output;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { triggerAutoSave(); }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [output, triggerAutoSave]);

  useEffect(() => {
    if (!deliverable) return;
    const framework = deliverable.deckFramework || deliverable.boardDeckOutline || [];
    if (framework.length > 0 && slideOrder.length !== framework.length) {
      setSlideOrder(framework.map((_: any, i: number) => i));
      setExcludedSlides(new Set());
    }
  }, [deliverable]);

  if (!output && !isGenerating) return null;

  const isFirstFree = !isPro && generationCount >= 1;

  const toggleSlide = (idx: number) => {
    setExcludedSlides(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleUpdateDeliverable = (updated: any) => {
    if (!output) return;
    setOutput({ ...output, deliverable: updated } as any);
  };

  // Render deck/memo/email/document preview
  const renderSlideFramework = () => {
    if (!deliverable) return <p className="text-sm text-muted-foreground text-center py-12">No deliverable content available.</p>;
    switch (deliverable.type) {
      case "deck":
        return (
          <DeckView
            deliverable={deliverable}
            excludedSlides={excludedSlides}
            onToggleSlide={toggleSlide}
            slideOrder={slideOrder}
            onReorder={setSlideOrder}
            deckTheme={deckTheme}
            onThemeChange={setDeckTheme}
            onUpdateDeliverable={handleUpdateDeliverable}
          />
        );
      case "memo":
        return <MemoView deliverable={deliverable} onUpdateDeliverable={handleUpdateDeliverable} />;
      case "email":
        return <EmailView deliverable={deliverable} onUpdateDeliverable={handleUpdateDeliverable} />;
      case "document":
        return <DocumentView deliverable={deliverable} onUpdateDeliverable={handleUpdateDeliverable} />;
      default:
        const oldData = (output as any).data;
        if (oldData?.deckFramework?.length || oldData?.boardDeckOutline?.length) {
          const fallbackDeliverable = { type: "deck" as const, deckFramework: oldData.deckFramework || oldData.boardDeckOutline };
          return (
            <DeckView
              deliverable={fallbackDeliverable}
              excludedSlides={excludedSlides}
              onToggleSlide={toggleSlide}
              slideOrder={slideOrder}
              onReorder={setSlideOrder}
              deckTheme={deckTheme}
              onThemeChange={setDeckTheme}
            />
          );
        }
        return <p className="text-sm text-muted-foreground text-center py-12">Unsupported deliverable type.</p>;
    }
  };

  const handleRefinePitch = async () => {
    setIsRefiningPitch(true);
    try {
      await refineSection("pitchScript", "pitchScript", "refine");
    } catch { /* already toasted */ }
    finally { setIsRefiningPitch(false); }
  };

  const handleRefineQAItem = async (index: number) => {
    setRefiningQAIndex(index);
    try {
      await refineSection(`qa-${index}`, `analysis.commonQuestions.${index}.suggestedAnswer`, "refine");
    } catch { /* already toasted */ }
    finally { setRefiningQAIndex(null); }
  };

  const handleRescore = async () => {
    setIsRescoring(true);
    try {
      await rescoreNarrative();
    } catch { /* already toasted */ }
    finally { setIsRescoring(false); }
  };

  const getShimmerForTab = (tab: OutputDeliverable) => {
    switch (tab) {
      case "slide_framework": return <SlideShimmer />;
      case "elevator_pitch": return <PitchShimmer />;
      case "investor_qa": return <QAShimmer />;
      case "pitch_email": return <EmailShimmer />;
      case "investment_memo": return <MemoShimmer />;
      default: return <SlideShimmer />;
    }
  };

  const handleAddOutput = (newOutputs: OutputDeliverable[]) => {
    // Sort new outputs by speed, then append to existing selection order
    const sorted = sortBySpeed(newOutputs);
    const updated = [...selectedOutputs, ...sorted];
    if (intakeSelections) {
      setIntakeSelections({ ...intakeSelections, outputs: updated });
    } else {
      setIntakeSelections({ purpose: "investor_pitch", outputs: updated, stage: "seed" });
    }
    setActiveOutputTab(sorted[0]);
    toast.success(`Added ${sorted.map(o => o.replace(/_/g, " ")).join(", ")}`);
  };

  const renderErrorWithRetry = (tab: OutputDeliverable, message: string) => (
    <div className="card-gradient border border-border rounded-sm p-8 text-center space-y-4">
      <p className="text-sm text-destructive font-medium">{message}</p>
      <p className="text-xs text-muted-foreground">This output failed to generate. You can retry it independently.</p>
      <button
        onClick={() => {
          setOutputErrors(prev => { const n = { ...prev }; delete n[tab]; return n; });
          toast.info("Please regenerate to retry this output.");
        }}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-medium text-foreground border border-border hover:border-muted-foreground/30 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  // Render the active output deliverable tab
  const renderOutputContent = () => {
    if (isLoading) return getShimmerForTab(activeOutputTab);

    // Check for per-output errors
    if (outputErrors[activeOutputTab]) {
      return renderErrorWithRetry(activeOutputTab, outputErrors[activeOutputTab]);
    }

    switch (activeOutputTab) {
      case "slide_framework":
        return renderSlideFramework();
      case "elevator_pitch": {
        const pitchData = synthesizeElevatorPitch(output);
        if (!pitchData) return <p className="text-sm text-muted-foreground text-center py-12">No pitch data available. Try generating with more narrative content.</p>;
        return <ElevatorPitchView data={pitchData} onRefine={handleRefinePitch} isRefining={isRefiningPitch} />;
      }
      case "investor_qa": {
        const qaItems = synthesizeInvestorQA(output);
        if (!qaItems) return <p className="text-sm text-muted-foreground text-center py-12">No Q&A data available.</p>;
        return <InvestorQAView items={qaItems} onRefineItem={handleRefineQAItem} refiningIndex={refiningQAIndex} />;
      }
      case "pitch_email": {
        const emails = synthesizePitchEmails(output);
        if (!emails) return <p className="text-sm text-muted-foreground text-center py-12">No email data available. Try generating with a thesis or narrative.</p>;
        return <PitchEmailView variants={emails} />;
      }
      case "investment_memo": {
        const memo = synthesizeInvestmentMemo(output);
        if (!memo) return <p className="text-sm text-muted-foreground text-center py-12">No memo data available.</p>;
        return <InvestmentMemoView data={memo} />;
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col">
        <ProjectSidebar activeTab={activeTab} onTabChange={setActiveTab} intent={effectiveIntent} isLoading={isLoading} />
        <div style={isMobile ? undefined : { marginLeft: 200 }}>
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6 w-full animate-fade-in" key={activeTab}>
            {/* Outputs tab */}
            {activeTab === "outputs" && (
              <>
                {rawInput && !isLoading && <OriginalInputSection rawInput={rawInput} />}
                <OutputTabBar
                  tabs={selectedOutputs}
                  activeTab={activeOutputTab}
                  onTabChange={setActiveOutputTab}
                  onAddOutput={!isLoading ? handleAddOutput : undefined}
                />
                <div className="min-h-[400px] animate-tab-enter" key={activeOutputTab}>
                  {renderOutputContent()}
                </div>
              </>
            )}

            {/* Score tab (with merged coaching) */}
            {activeTab === "score" && isLoading && <ScoreShimmer />}
            {activeTab === "score" && !isLoading && score && <ScoreTab score={score} mode={output!.mode} onRescore={handleRescore} isRescoring={isRescoring} />}
            {activeTab === "score" && !isLoading && !score && (
              <p className="text-sm text-muted-foreground text-center py-12">No score data available.</p>
            )}

            {/* Analysis tab (evaluate mode) */}
            {activeTab === "analysis" && isLoading && <ScoreShimmer />}
            {activeTab === "analysis" && !isLoading && analysis && score && (
              <AnalysisTab analysis={analysis} score={score} mode={output!.mode} />
            )}
            {activeTab === "analysis" && !isLoading && (!analysis || !score) && score && (
              <ScoreTab score={score} mode={output!.mode} onRescore={handleRescore} isRescoring={isRescoring} />
            )}
            {activeTab === "analysis" && !isLoading && !score && (
              <p className="text-sm text-muted-foreground text-center py-12">No analysis data available.</p>
            )}
          </div>
        </div>
      </div>

      {isFirstFree && (
        <div className="border-t border-border px-6 py-5 card-gradient sticky bottom-0">
          <div className="flex items-center justify-between" style={isMobile ? undefined : { marginLeft: 200 }}>
            <div>
              <p className="text-sm font-medium text-foreground">Unlock Full Narrative</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Pro for all sections, exports, and refinements.</p>
            </div>
            <button onClick={() => toast.info("Upgrade to Pro for full access.")} className="text-xs px-4 py-2 rounded-sm font-medium bg-electric text-primary-foreground hover:opacity-90 transition-all glow-blue">
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

export function buildTabs(output: any): { key: string; label: string; sections: { key: string; path: string; label: string; content: string }[] }[] {
  const d = (output.data || output.supporting || output.deliverable || {}) as any;
  const mode = output.mode;
  if (mode === "fundraising") {
    return [
      { key: "thesis", label: "Thesis", sections: [{ key: "thesis-content", path: "thesis.content", label: "Investment Thesis", content: d.thesis?.content || "" }, { key: "thesis-insight", path: "thesis.coreInsight", label: "Core Insight", content: d.thesis?.coreInsight || "" }, { key: "market-logic", path: "marketLogic", label: "Market Logic", content: Array.isArray(d.marketLogic) ? d.marketLogic.join("\n") : (d.marketLogic || "") }, { key: "why-now", path: "whyNow", label: "Why Now", content: d.whyNow || "" }, { key: "risks", path: "risks", label: "Risks", content: d.risks || "" }] },
      { key: "narrative", label: "Narrative Arc", sections: [{ key: "world-today", path: "narrativeStructure.worldToday", label: "The World Today", content: d.narrativeStructure?.worldToday || "" }, { key: "breaking-point", path: "narrativeStructure.breakingPoint", label: "The Breaking Point", content: d.narrativeStructure?.breakingPoint || "" }, { key: "new-model", path: "narrativeStructure.newModel", label: "The New Model", content: d.narrativeStructure?.newModel || "" }, { key: "why-wins", path: "narrativeStructure.whyThisWins", label: "Why This Wins", content: d.narrativeStructure?.whyThisWins || "" }, { key: "the-future", path: "narrativeStructure.theFuture", label: "The Future", content: d.narrativeStructure?.theFuture || "" }] },
      { key: "pitch", label: "Pitch Prep", sections: [{ key: "pitch-script", path: "pitchScript", label: "60-Second Pitch", content: d.pitchScript || "" }] },
      { key: "deck", label: "Deck Framework", sections: [] },
    ];
  }
  if (mode === "board_update") {
    return [
      { key: "summary", label: "Executive Summary", sections: [{ key: "exec-summary", path: "executiveSummary", label: "Executive Summary", content: d.executiveSummary || "" }] },
      { key: "metrics", label: "Metrics Narrative", sections: [{ key: "metrics-narr", path: "metricsNarrative", label: "Metrics Narrative", content: d.metricsNarrative || "" }] },
      { key: "deck", label: "Board Deck Outline", sections: [] },
    ];
  }
  return [];
}
