import { useDecksmith } from "@/context/DecksmithContext";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { OriginalInputSection } from "@/components/project/OriginalInputSection";
import { DeckView } from "@/components/deliverable/DeckView";
import { MemoView } from "@/components/deliverable/MemoView";
import { EmailView } from "@/components/deliverable/EmailView";
import { DocumentView } from "@/components/deliverable/DocumentView";
import { ScoreTab } from "@/components/tabs/ScoreTab";
import { AnalysisTab } from "@/components/tabs/AnalysisTab";
import { OutputTabBar } from "@/components/outputs/OutputTabBar";
import { CoreNarrativeView } from "@/components/outputs/CoreNarrativeView";
import { ElevatorPitchView } from "@/components/outputs/ElevatorPitchView";
import { InvestorQAView } from "@/components/outputs/InvestorQAView";
import { PitchEmailView } from "@/components/outputs/PitchEmailView";
import { InvestmentMemoView } from "@/components/outputs/InvestmentMemoView";
import { BoardMemoView } from "@/components/outputs/BoardMemoView";
import { KeyMetricsSummaryView } from "@/components/outputs/KeyMetricsSummaryView";
import { StrategicMemoView } from "@/components/outputs/StrategicMemoView";
import { SlideShimmer, PitchShimmer, QAShimmer, EmailShimmer, MemoShimmer, CoreNarrativeShimmer, ScoreShimmer } from "@/components/outputs/OutputShimmer";
import { sortBySpeed } from "@/lib/outputOrder";
import { Layout, RefreshCw } from "lucide-react";
import type { DeckTheme } from "@/components/SlidePreview";
import type { OutputTabKey, OutputDeliverable, ElevatorPitchData, InvestorQAItem, PitchEmailVariant, InvestmentMemoData, BoardMemoData, KeyMetricsSummaryData, StrategicMemoData } from "@/types/rhetoric";
import { getOutputIntent, getDeliverable, getScore, getAnalysis } from "@/types/rhetoric";
import { findData } from "@/lib/findData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useIsMobile } from "@/hooks/use-mobile";

// ── Synthesize outputs from existing data ──

function synthesizeElevatorPitch(output: any, outputData: Record<string, any>): ElevatorPitchData | null {
  const od = outputData?.elevator_pitch;
  console.log("[Render] elevator_pitch structure:", Object.keys(od || {}));

  // Check all known paths for the pitch object
  const pitch = findData<ElevatorPitchData>(od,
    "elevatorPitch",
    "deliverable.elevatorPitch",
    "data.elevatorPitch",
  );
  if (pitch?.thirtySecond) return pitch;

  // Maybe od itself IS the pitch data
  if (od?.thirtySecond && od?.sixtySecond) return od as ElevatorPitchData;

  // Fallback: synthesize from legacy output shape
  const d = output?.data || output?.supporting || {};
  const pitchScript = d.pitchScript;
  const thesis = d.thesis?.content || d.thesis || d.vision || d.headline || "";
  if (!pitchScript && !thesis) return null;
  const sixtySecond = pitchScript || thesis;
  const sentences = sixtySecond.split(/(?<=[.!?])\s+/).filter(Boolean);
  const thirtySecond = sentences.slice(0, Math.min(3, sentences.length)).join(" ");
  return { thirtySecond, sixtySecond };
}

function synthesizeInvestorQA(output: any, outputData: Record<string, any>): InvestorQAItem[] | null {
  const od = outputData?.investor_qa;
  console.log("[Render] investor_qa structure:", Object.keys(od || {}));

  const items = findData<InvestorQAItem[]>(od,
    "investorQA",
    "deliverable.investorQA",
    "data.investorQA",
    "questions",
    "deliverable.questions",
  );
  if (items?.length) return items;

  // Fallback: from analysis
  if (output?.analysis?.commonQuestions?.length) {
    return output.analysis.commonQuestions.map((q: any) => ({ question: q.question, answer: q.suggestedAnswer }));
  }
  const score = output?.score;
  if (!score) return null;
  const fallback: InvestorQAItem[] = [];
  (score.gaps || []).forEach((gap: string, i: number) => {
    fallback.push({
      question: `How do you address: ${gap}?`,
      answer: (score.improvements || [])[i] || "Consider strengthening this area with specific data and examples.",
    });
  });
  return fallback.length > 0 ? fallback : null;
}

function synthesizePitchEmails(output: any, outputData: Record<string, any>): PitchEmailVariant[] | null {
  const od = outputData?.pitch_email;
  console.log("[Render] pitch_email structure:", Object.keys(od || {}));

  const emails = findData<PitchEmailVariant[]>(od,
    "pitchEmails",
    "deliverable.pitchEmails",
    "data.pitchEmails",
    "emails",
    "deliverable.emails",
    "variants",
    "deliverable.variants",
  );
  if (emails?.length) return emails;

  // Fallback: synthesize templates from legacy output
  const d = output?.data || output?.supporting || {};
  const thesis = d.thesis?.content || d.thesis || d.vision || "";
  const title = output?.title || "our company";
  if (!thesis) return null;
  const shortThesis = thesis.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  return [
    { label: "Direct Ask", subject: `{firm_name} + ${title} — Quick intro`, body: `Hi {investor_name},\n\nI'm building ${title}. ${shortThesis}\n\nWe're raising and I'd love 20 minutes to walk you through our traction. Would next week work?\n\nBest,\n[Your name]` },
    { label: "Warm Intro Request", subject: `Intro request: ${title}`, body: `Hi {mutual_connection},\n\nI'd love an intro to {investor_name} at {firm_name}. ${shortThesis}\n\nHappy to send a one-pager if helpful. Thanks!\n\n[Your name]` },
    { label: "Follow-Up", subject: `Re: ${title} — following up`, body: `Hi {investor_name},\n\nFollowing up on my note last week. Since then we've [milestone]. Would love to share an update — do you have 15 min this week?\n\nBest,\n[Your name]` },
  ];
}

function synthesizeInvestmentMemo(output: any, outputData: Record<string, any>): InvestmentMemoData | null {
  const od = outputData?.investment_memo;
  console.log("[Render] investment_memo structure:", Object.keys(od || {}));

  // Check all known paths for sections array
  const sections = findData<{ heading: string; content: string }[]>(od,
    "investmentMemo.sections",
    "deliverable.sections",
    "data.sections",
    "sections",
    "memo.sections",
    "deliverable.investmentMemo.sections",
  );
  if (sections?.length) return { sections };

  // Check for the investmentMemo wrapper object itself
  const memoObj = findData<InvestmentMemoData>(od,
    "investmentMemo",
    "deliverable.investmentMemo",
    "data.investmentMemo",
  );
  if (memoObj?.sections?.length) return memoObj;

  // Fallback: synthesize from legacy output
  const d = output?.data || output?.supporting || {};
  const fallback: { heading: string; content: string }[] = [];
  const thesis = d.thesis?.content || d.thesis || "";
  if (thesis) fallback.push({ heading: "Thesis", content: thesis });
  const ns = d.narrativeStructure;
  if (ns?.worldToday) fallback.push({ heading: "Problem", content: ns.worldToday + (ns.breakingPoint ? `\n\n${ns.breakingPoint}` : "") });
  if (ns?.newModel) fallback.push({ heading: "Solution", content: ns.newModel });
  const market = d.marketLogic;
  if (market) fallback.push({ heading: "Market", content: Array.isArray(market) ? market.join("\n• ") : market });
  if (ns?.whyThisWins) fallback.push({ heading: "Traction & Differentiation", content: ns.whyThisWins });
  if (d.risks) fallback.push({ heading: "Risks", content: d.risks });
  if (d.whyNow) fallback.push({ heading: "Why Now", content: d.whyNow });
  if (ns?.theFuture) fallback.push({ heading: "The Ask", content: ns.theFuture });
  return fallback.length > 0 ? { sections: fallback } : null;
}

function synthesizeBoardMemo(outputData: Record<string, any>): BoardMemoData | null {
  const od = outputData?.board_memo;
  console.log("[Render] board_memo structure:", Object.keys(od || {}));

  const sections = findData<{ heading: string; content: string }[]>(od,
    "boardMemo.sections",
    "deliverable.sections",
    "data.sections",
    "sections",
    "deliverable.boardMemo.sections",
  );
  if (sections?.length) return { sections };

  const memoObj = findData<BoardMemoData>(od,
    "boardMemo",
    "deliverable.boardMemo",
    "data.boardMemo",
  );
  if (memoObj?.sections?.length) return memoObj;

  return null;
}

function synthesizeKeyMetrics(outputData: Record<string, any>): KeyMetricsSummaryData | null {
  const od = outputData?.key_metrics_summary;
  console.log("[Render] key_metrics_summary structure:", Object.keys(od || {}));

  const categories = findData<KeyMetricsSummaryData["categories"]>(od,
    "keyMetrics.categories",
    "deliverable.categories",
    "data.categories",
    "categories",
    "deliverable.keyMetrics.categories",
    "keyMetricsSummary.categories",
  );
  if (categories?.length) return { categories };

  const metricsObj = findData<KeyMetricsSummaryData>(od,
    "keyMetrics",
    "deliverable.keyMetrics",
    "data.keyMetrics",
    "keyMetricsSummary",
  );
  if (metricsObj?.categories?.length) return metricsObj;

  return null;
}

function synthesizeStrategicMemo(outputData: Record<string, any>): StrategicMemoData | null {
  const od = outputData?.strategic_memo;
  console.log("[Render] strategic_memo structure:", Object.keys(od || {}));

  const sections = findData<{ heading: string; content: string }[]>(od,
    "strategicMemo.sections",
    "deliverable.sections",
    "data.sections",
    "sections",
    "deliverable.strategicMemo.sections",
  );
  if (sections?.length) return { sections };

  const memoObj = findData<StrategicMemoData>(od,
    "strategicMemo",
    "deliverable.strategicMemo",
    "data.strategicMemo",
  );
  if (memoObj?.sections?.length) return memoObj;

  return null;
}

function AllOutputsReadyCard({ selectedOutputs, completedOutputs, isGenerating, onGoToScore }: {
  selectedOutputs: string[];
  completedOutputs: Set<string>;
  isGenerating: boolean;
  onGoToScore: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [wasGenerating, setWasGenerating] = useState(false);

  // Track that generation was happening
  useEffect(() => {
    if (isGenerating) setWasGenerating(true);
  }, [isGenerating]);

  const allDone = wasGenerating && !isGenerating && selectedOutputs.every(t => completedOutputs.has(t));

  // Auto-dismiss after 10s
  useEffect(() => {
    if (allDone && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [allDone, dismissed]);

  // Reset when new generation starts
  useEffect(() => {
    if (isGenerating) setDismissed(false);
  }, [isGenerating]);

  if (!allDone || dismissed) return null;

  return (
    <div className="mt-6 animate-fade-in">
      <button
        onClick={() => { onGoToScore(); setDismissed(true); }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-sm border border-emerald/20 bg-emerald/5 hover:bg-emerald/10 hover:border-emerald/30 transition-colors group"
      >
        <p className="text-xs text-foreground/80">
          <span className="font-medium text-emerald">All outputs ready.</span>{" "}
          Check your Capital Readiness Score
        </p>
        <ArrowRight className="h-3.5 w-3.5 text-emerald group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

export function OutputView() {
  const {
    output, setOutput, reset, isPro, generationCount, currentProjectId, rawInput,
    isEvaluation, intakeSelections, setIntakeSelections, refineSection, refiningSection,
    rescoreNarrative, isGenerating, generateSlides, isGeneratingSlides, generateOutput,
    completedOutputs, coreNarrative, outputData, isGeneratingOutputs,
  } = useDecksmith();
  const navigate = useNavigate();
  const { subscribed } = useSubscription();
  const isMobile = useIsMobile();

  const intent = output ? getOutputIntent(output) : "create";
  const deliverable = output ? getDeliverable(output) : null;
  const score = output ? getScore(output) : null;
  const analysis = output ? getAnalysis(output) : null;

  const effectiveIntent = isEvaluation ? "evaluate" : intent;
  const defaultTab: OutputTabKey = effectiveIntent === "evaluate" ? "analysis" : "outputs";
  const isLoading = isGenerating && !output && !coreNarrative;

  const [activeTab, setActiveTab] = useState<OutputTabKey>(defaultTab);
  const [excludedSlides, setExcludedSlides] = useState<Set<number>>(new Set());
  const [slideOrder, setSlideOrder] = useState<number[]>([]);
  const [deckTheme, setDeckTheme] = useState<DeckTheme>({ scheme: "dark", primary: "#3b82f6", secondary: "#0b0f14", accent: "#1e3a5f" });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isRefiningPitch, setIsRefiningPitch] = useState(false);
  const [refiningQAIndex, setRefiningQAIndex] = useState<number | null>(null);
  const [isRescoring, setIsRescoring] = useState(false);
  const [refiningCoreIndex, setRefiningCoreIndex] = useState<number | null>(null);

  // Build tabs: core_narrative always first, then outputs in their stored order (no re-sorting)
  const selectedOutputs: OutputDeliverable[] = intakeSelections?.outputs?.length
    ? ["core_narrative" as OutputDeliverable, ...intakeSelections.outputs]
    : ["core_narrative" as OutputDeliverable, "slide_framework"];

  const [activeOutputTab, setActiveOutputTab] = useState<OutputDeliverable>("core_narrative");

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

  if (!output && !coreNarrative && !isGenerating) return null;

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

  const renderSlideFramework = () => {
    if (deliverable?.type === "deck" && deliverable.deckFramework?.length) {
      return (
        <DeckView
          deliverable={deliverable} excludedSlides={excludedSlides} onToggleSlide={toggleSlide}
          slideOrder={slideOrder} onReorder={setSlideOrder} deckTheme={deckTheme}
          onThemeChange={setDeckTheme} onUpdateDeliverable={handleUpdateDeliverable}
        />
      );
    }

    // Check outputData for persisted slide framework
    const persistedSlides = outputData?.slide_framework?.deckFramework || outputData?.slide_framework?.deliverable?.deckFramework;
    if (persistedSlides?.length) {
      const persistedDeliverable = { type: "deck" as const, deckFramework: persistedSlides };
      return <DeckView deliverable={persistedDeliverable} excludedSlides={excludedSlides} onToggleSlide={toggleSlide} slideOrder={slideOrder} onReorder={setSlideOrder} deckTheme={deckTheme} onThemeChange={setDeckTheme} onUpdateDeliverable={handleUpdateDeliverable} />;
    }

    const oldData = (output as any)?.data;
    if (oldData?.deckFramework?.length || oldData?.boardDeckOutline?.length) {
      const fallbackDeliverable = { type: "deck" as const, deckFramework: oldData.deckFramework || oldData.boardDeckOutline };
      return <DeckView deliverable={fallbackDeliverable} excludedSlides={excludedSlides} onToggleSlide={toggleSlide} slideOrder={slideOrder} onReorder={setSlideOrder} deckTheme={deckTheme} onThemeChange={setDeckTheme} />;
    }

    const supporting = (output as any)?.supporting;
    if (supporting?.deckFramework?.length) {
      const fallbackDeliverable = { type: "deck" as const, deckFramework: supporting.deckFramework };
      return <DeckView deliverable={fallbackDeliverable} excludedSlides={excludedSlides} onToggleSlide={toggleSlide} slideOrder={slideOrder} onReorder={setSlideOrder} deckTheme={deckTheme} onThemeChange={setDeckTheme} />;
    }

    if (isGeneratingSlides || (isGenerating && !completedOutputs.has("slide_framework"))) return <SlideShimmer />;

    return (
      <div className="card-gradient border border-border rounded-sm p-8 text-center space-y-4">
        <Layout className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-foreground font-medium">Generate Slide Framework</p>
        <p className="text-xs text-muted-foreground">Create a complete slide framework from your existing narrative.</p>
        <button onClick={() => generateSlides()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-medium bg-electric text-primary-foreground hover:opacity-90 transition-opacity glow-blue">
          Generate Slides
        </button>
      </div>
    );
  };

  const handleRefinePitch = async () => {
    setIsRefiningPitch(true);
    try { await refineSection("pitchScript", "pitchScript", "refine"); } catch {}
    finally { setIsRefiningPitch(false); }
  };

  const handleRefineQAItem = async (index: number) => {
    setRefiningQAIndex(index);
    try { await refineSection(`qa-${index}`, `analysis.commonQuestions.${index}.suggestedAnswer`, "refine"); } catch {}
    finally { setRefiningQAIndex(null); }
  };

  const handleRefineCoreSection = async (index: number) => {
    setRefiningCoreIndex(index);
    try { await refineSection(`core-${index}`, `coreNarrative.sections.${index}.content`, "refine"); } catch {}
    finally { setRefiningCoreIndex(null); }
  };

  const handleRescore = async () => {
    setIsRescoring(true);
    try { await rescoreNarrative(); } catch {}
    finally { setIsRescoring(false); }
  };

  const getShimmerForTab = (tab: OutputDeliverable) => {
    switch (tab) {
      case "core_narrative": return <CoreNarrativeShimmer />;
      case "slide_framework": return <SlideShimmer />;
      case "elevator_pitch": return <PitchShimmer />;
      case "investor_qa": return <QAShimmer />;
      case "pitch_email": return <EmailShimmer />;
      case "investment_memo": return <MemoShimmer />;
      case "board_memo": return <MemoShimmer />;
      case "key_metrics_summary": return <MemoShimmer />;
      case "strategic_memo": return <MemoShimmer />;
      default: return <MemoShimmer />;
    }
  };

  const handleAddOutput = (newOutputs: OutputDeliverable[]) => {
    // Append new outputs in selection order — do NOT re-sort existing tabs
    const currentOutputs = intakeSelections?.outputs || [];
    const updated = [...currentOutputs, ...newOutputs];
    if (intakeSelections) {
      setIntakeSelections({ ...intakeSelections, outputs: updated });
    } else {
      setIntakeSelections({ purpose: "fundraising", outputs: updated, stage: "seed" });
    }
    setActiveOutputTab(newOutputs[0]);
    toast.success(`Added ${newOutputs.map(o => o.replace(/_/g, " ")).join(", ")}`);

    // Generate each new output
    newOutputs.forEach(outputType => {
      generateOutput(outputType);
    });
  };

  const renderErrorWithRetry = (tab: OutputDeliverable, message: string) => {
    const rawResponse = outputData[`${tab}_rawResponse`];
    return (
      <div className="card-gradient border border-border rounded-sm p-8 space-y-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive font-medium">{message}</p>
          <p className="text-xs text-muted-foreground">This output failed to generate. Click retry to try again.</p>
          <button
            onClick={() => {
              // Clear the error before retrying
              generateOutput(tab);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-medium text-foreground border border-border hover:border-muted-foreground/30 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
        {rawResponse && (() => { console.log("[Debug] Raw AI response for failed output:", rawResponse); return null; })()}
      </div>
    );
  };

  const renderOutputContent = () => {
    if (isLoading) return getShimmerForTab(activeOutputTab);

    // Check for per-output errors
    const errorKey = `${activeOutputTab}_error`;
    if (outputData[errorKey]) {
      return renderErrorWithRetry(activeOutputTab, outputData[errorKey]);
    }

    switch (activeOutputTab) {
      case "core_narrative": {
        if (!coreNarrative) return isGenerating ? <CoreNarrativeShimmer /> : <p className="text-sm text-muted-foreground text-center py-12">No core narrative available.</p>;
        return <CoreNarrativeView data={coreNarrative} onRefineSection={handleRefineCoreSection} refiningIndex={refiningCoreIndex} />;
      }
      case "slide_framework":
        return renderSlideFramework();
      case "elevator_pitch": {
        if (isGeneratingOutputs && !completedOutputs.has("elevator_pitch")) return <PitchShimmer />;
        const pitchData = synthesizeElevatorPitch(output, outputData);
        if (!pitchData) return <p className="text-sm text-muted-foreground text-center py-12">No pitch data available.</p>;
        return <ElevatorPitchView data={pitchData} onRefine={handleRefinePitch} isRefining={isRefiningPitch} />;
      }
      case "investor_qa": {
        if (isGeneratingOutputs && !completedOutputs.has("investor_qa")) return <QAShimmer />;
        const qaItems = synthesizeInvestorQA(output, outputData);
        if (!qaItems) return <p className="text-sm text-muted-foreground text-center py-12">No Q&A data available.</p>;
        return <InvestorQAView items={qaItems} onRefineItem={handleRefineQAItem} refiningIndex={refiningQAIndex} />;
      }
      case "pitch_email": {
        if (isGeneratingOutputs && !completedOutputs.has("pitch_email")) return <EmailShimmer />;
        const emails = synthesizePitchEmails(output, outputData);
        if (!emails) return <p className="text-sm text-muted-foreground text-center py-12">No email data available.</p>;
        return <PitchEmailView variants={emails} />;
      }
      case "investment_memo": {
        if (isGeneratingOutputs && !completedOutputs.has("investment_memo")) return <MemoShimmer />;
        const memo = synthesizeInvestmentMemo(output, outputData);
        if (!memo) return <p className="text-sm text-muted-foreground text-center py-12">No memo data available.</p>;
        return <InvestmentMemoView data={memo} />;
      }
      case "board_memo": {
        if (isGenerating && !completedOutputs.has("board_memo")) return <MemoShimmer />;
        const memo = synthesizeBoardMemo(outputData);
        if (!memo) return <p className="text-sm text-muted-foreground text-center py-12">No board memo data available.</p>;
        return <BoardMemoView data={memo} />;
      }
      case "key_metrics_summary": {
        if (isGenerating && !completedOutputs.has("key_metrics_summary")) return <MemoShimmer />;
        const metrics = synthesizeKeyMetrics(outputData);
        if (!metrics) return <p className="text-sm text-muted-foreground text-center py-12">No metrics data available.</p>;
        return <KeyMetricsSummaryView data={metrics} />;
      }
      case "strategic_memo": {
        if (isGenerating && !completedOutputs.has("strategic_memo")) return <MemoShimmer />;
        const memo = synthesizeStrategicMemo(outputData);
        if (!memo) return <p className="text-sm text-muted-foreground text-center py-12">No strategic memo data available.</p>;
        return <StrategicMemoView data={memo} />;
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col">
        <ProjectSidebar activeTab={activeTab} onTabChange={setActiveTab} intent={effectiveIntent} isLoading={isGenerating || isGeneratingSlides} />
        <div style={isMobile ? undefined : { marginLeft: 200 }}>
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6 w-full animate-fade-in" key={activeTab}>
            {activeTab === "outputs" && (
              <>
                {rawInput && !isLoading && <OriginalInputSection rawInput={rawInput} />}
                <OutputTabBar
                  tabs={selectedOutputs}
                  activeTab={activeOutputTab}
                  onTabChange={setActiveOutputTab}
                  onAddOutput={!isLoading ? handleAddOutput : undefined}
                  purpose={intakeSelections?.purpose}
                  completedOutputs={completedOutputs}
                  isGenerating={isGenerating}
                />
                <div className="min-h-[400px] animate-tab-enter" key={activeOutputTab}>
                  {renderOutputContent()}
                </div>
                <AllOutputsReadyCard
                  selectedOutputs={selectedOutputs}
                  completedOutputs={completedOutputs}
                  isGenerating={isGenerating || false}
                  onGoToScore={() => setActiveTab("score")}
                />
              </>
            )}

            {activeTab === "score" && isLoading && <ScoreShimmer />}
            {activeTab === "score" && !isLoading && score && <ScoreTab score={score} mode={output!.mode} onRescore={handleRescore} isRescoring={isRescoring} />}
            {activeTab === "score" && !isLoading && !score && (
              <p className="text-sm text-muted-foreground text-center py-12">No score data available.</p>
            )}

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
