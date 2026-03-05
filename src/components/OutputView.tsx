import { useDecksmith } from "@/context/DecksmithContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { OriginalInputSection } from "@/components/project/OriginalInputSection";
import { DeckView } from "@/components/deliverable/DeckView";
import { MemoView } from "@/components/deliverable/MemoView";
import { EmailView } from "@/components/deliverable/EmailView";
import { DocumentView } from "@/components/deliverable/DocumentView";
import { ScoreTab } from "@/components/tabs/ScoreTab";
import { CoachingTab } from "@/components/tabs/CoachingTab";
import { AnalysisTab } from "@/components/tabs/AnalysisTab";
import type { DeckTheme } from "@/components/SlidePreview";
import type { OutputTabKey } from "@/types/rhetoric";
import { getOutputIntent, getDeliverable, getScore, getAnalysis } from "@/types/rhetoric";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useIsMobile } from "@/hooks/use-mobile";



export function OutputView() {
  const { output, setOutput, reset, isPro, generationCount, currentProjectId, rawInput, isEvaluation } = useDecksmith();
  const navigate = useNavigate();
  const { subscribed } = useSubscription();
  const isMobile = useIsMobile();

  // Derived data from output
  const intent = output ? getOutputIntent(output) : "create";
  const deliverable = output ? getDeliverable(output) : null;
  const score = output ? getScore(output) : null;
  const analysis = output ? getAnalysis(output) : null;

  // If isEvaluation from context, override intent
  const effectiveIntent = isEvaluation ? "evaluate" : intent;
  const defaultTab: OutputTabKey = effectiveIntent === "evaluate" ? "analysis" : "preview";

  const [activeTab, setActiveTab] = useState<OutputTabKey>(defaultTab);
  const [excludedSlides, setExcludedSlides] = useState<Set<number>>(new Set());
  const [slideOrder, setSlideOrder] = useState<number[]>([]);
  const [deckTheme, setDeckTheme] = useState<DeckTheme>({ scheme: "dark", primary: "#3b82f6", secondary: "#0b0f14", accent: "#1e3a5f" });
  const [upgradeOpen, setUpgradeOpen] = useState(false);

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

  // Initialize slide order from deliverable
  useEffect(() => {
    if (!deliverable) return;
    const framework = deliverable.deckFramework || deliverable.boardDeckOutline || [];
    if (framework.length > 0 && slideOrder.length !== framework.length) {
      setSlideOrder(framework.map((_: any, i: number) => i));
      setExcludedSlides(new Set());
    }
  }, [deliverable]);

  if (!output) return null;

  const isFirstFree = !isPro && generationCount >= 1;

  const toggleSlide = (idx: number) => {
    setExcludedSlides(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  // Update deliverable in output state (for inline edits / suggestions)
  const handleUpdateDeliverable = (updated: any) => {
    if (!output) return;
    setOutput({ ...output, deliverable: updated } as any);
  };

  // Render the deliverable preview
  const renderPreview = () => {
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
        // Old format fallback
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Main content with sidebar */}
      <div className="flex-1 flex flex-col">
        <ProjectSidebar activeTab={activeTab} onTabChange={setActiveTab} intent={effectiveIntent} />
        <div style={isMobile ? undefined : { marginLeft: 200 }}>
          <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6 w-full animate-fade-in" key={activeTab}>
            {/* Show raw input on preview tab */}
            {activeTab === "preview" && rawInput && <OriginalInputSection rawInput={rawInput} />}

            {/* CREATE: Preview */}
            {activeTab === "preview" && renderPreview()}

            {/* CREATE: Score */}
            {activeTab === "score" && score && <ScoreTab score={score} mode={output.mode} />}
            {activeTab === "score" && !score && (
              <p className="text-sm text-muted-foreground text-center py-12">No score data available.</p>
            )}

            {/* Coaching */}
            {activeTab === "coaching" && score && <CoachingTab score={score} />}
            {activeTab === "coaching" && !score && (
              <p className="text-sm text-muted-foreground text-center py-12">No coaching data available.</p>
            )}

            {/* EVALUATE: Analysis */}
            {activeTab === "analysis" && analysis && score && (
              <AnalysisTab analysis={analysis} score={score} mode={output.mode} />
            )}
            {activeTab === "analysis" && (!analysis || !score) && score && (
              <ScoreTab score={score} mode={output.mode} />
            )}
            {activeTab === "analysis" && !score && (
              <p className="text-sm text-muted-foreground text-center py-12">No analysis data available.</p>
            )}

            {/* EVALUATE: Rebuilt */}
            {activeTab === "rebuilt" && renderPreview()}
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

// Keep buildTabs export for backward compat (used by old export)
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
