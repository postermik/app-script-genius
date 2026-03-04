import { useDecksmith } from "@/context/DecksmithContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { ExportDropdown } from "@/components/ExportDropdown";
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
import { ArrowLeft, ChevronDown, Save, Pencil, Check, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Logo } from "@/components/Logo";
import type { AudienceType } from "@/types/narrative";

const AUDIENCES: { value: AudienceType; label: string; desc: string }[] = [
  { value: "general", label: "General", desc: "Default output" },
  { value: "investors", label: "Investors", desc: "Risk-aware, returns-focused" },
  { value: "board", label: "Board", desc: "Metrics-heavy, strategic" },
  { value: "internal", label: "Internal", desc: "Transparent, motivational" },
];

const NAV_HEIGHT = 56;

export function OutputView() {
  const { output, setOutput, reset, isPro, generationCount, versions, currentVersion, saveVersion, loadVersion, currentProjectId, activeAudience, setActiveAudience, audienceVariants, adaptForAudience, isAdapting, rawInput, isEvaluation } = useDecksmith();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscribed, productId } = useSubscription();
  const isProNav = subscribed && productId === TIERS.pro.product_id;

  // Derived data from output
  const intent = output ? getOutputIntent(output) : "create";
  const deliverable = output ? getDeliverable(output) : null;
  const score = output ? getScore(output) : null;
  const analysis = output ? getAnalysis(output) : null;

  // If isEvaluation from context, override intent
  const effectiveIntent = isEvaluation ? "evaluate" : intent;
  const defaultTab: OutputTabKey = effectiveIntent === "evaluate" ? "analysis" : "preview";

  const [activeTab, setActiveTab] = useState<OutputTabKey>(defaultTab);
  const [showVersions, setShowVersions] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [excludedSlides, setExcludedSlides] = useState<Set<number>>(new Set());
  const [slideOrder, setSlideOrder] = useState<number[]>([]);
  const [deckTheme, setDeckTheme] = useState<DeckTheme>({ scheme: "dark", primary: "#3b82f6", secondary: "#0b0f14", accent: "#1e3a5f" });
  const [showAudiences, setShowAudiences] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputRef = useRef(output);

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };
  const isActive = (path: string) => location.pathname === path;
  const navLinkClass = (path: string) =>
    `text-xs transition-colors ${isActive(path) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`;

  const triggerAutoSave = useCallback(async () => {
    if (!currentProjectId) return;
    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", currentProjectId);
    setLastSaved(new Date());
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

  const projectTitle = (output as any).title || "Untitled Project";
  const isFirstFree = !isPro && generationCount >= 1;

  const handleTitleEdit = () => { setTitleValue(projectTitle); setEditingTitle(true); };
  const handleTitleSave = async () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== projectTitle && currentProjectId) {
      await supabase.from("projects").update({ title: titleValue.trim() }).eq("id", currentProjectId);
      toast.success("Title updated.");
    }
  };

  const toggleSlide = (idx: number) => {
    setExcludedSlides(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleAudienceSelect = (audience: AudienceType) => {
    if (audience === "general") {
      setActiveAudience("general");
      setShowAudiences(false);
    } else if (audienceVariants && audienceVariants[audience]) {
      setActiveAudience(audience);
      setShowAudiences(false);
    } else {
      adaptForAudience(audience);
      setShowAudiences(false);
    }
  };

  const versionLabel = `v${currentVersion}`;
  const savedLabel = lastSaved ? `Saved ${format(lastSaved, "h:mm a")}` : null;

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
      {/* Header */}
      <nav
        className="border-b border-border px-5 sticky top-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-between"
        style={{ height: `${NAV_HEIGHT}px` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => { reset(); navigate("/dashboard"); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <Logo variant="mark" size={22} />
        </div>

        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          {editingTitle ? (
            <div className="flex items-center gap-1">
              <input value={titleValue} onChange={e => setTitleValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTitleSave()} className="text-xs font-semibold tracking-wide uppercase text-foreground bg-transparent border-b border-electric outline-none px-1 max-w-[220px]" autoFocus />
              <button onClick={handleTitleSave} className="text-electric hover:text-foreground transition-colors p-0.5"><Check className="h-3 w-3" /></button>
            </div>
          ) : (
            <button onClick={handleTitleEdit} className="text-xs font-semibold tracking-wide uppercase text-foreground hover:text-electric transition-colors flex items-center gap-1.5 group">
              {projectTitle}
              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          {currentProjectId && (
            <div className="relative">
              <button onClick={() => setShowVersions(!showVersions)} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-1.5 py-0.5 border border-border rounded-sm">
                {versionLabel}
                {savedLabel && <span className="text-muted-foreground/60 ml-0.5">· {savedLabel}</span>}
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
              {showVersions && (
                <div className="absolute top-full mt-1 right-0 w-56 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in">
                  <button onClick={() => { saveVersion(); setShowVersions(false); }} className="w-full text-left text-xs px-3 py-2.5 text-foreground hover:bg-accent transition-colors flex items-center gap-2 border-b border-border font-medium">
                    <Save className="h-3 w-3" />Save as New Version
                  </button>
                  {versions.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto">
                      {versions.map((v) => (
                        <button key={v.id} onClick={() => { loadVersion(v.version_number); setShowVersions(false); }} className={`w-full text-left text-xs px-3 py-2.5 hover:bg-accent transition-colors ${v.version_number === currentVersion ? "text-foreground bg-accent/50" : "text-secondary-foreground"}`}>
                          <span className="font-medium">v{v.version_number}</span><span className="ml-2 text-muted-foreground">{v.summary}</span>
                        </button>
                      ))}
                    </div>
                  ) : (<p className="text-xs text-muted-foreground px-3 py-2.5">No saved versions yet</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAudiences(!showAudiences)} className="text-[11px] text-secondary-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 border border-border rounded-sm transition-colors font-medium">
            <Users className="h-3 w-3 text-electric" />
            <span className="text-foreground capitalize">{activeAudience}</span>
            <ChevronDown className={`h-2.5 w-2.5 transition-transform ${showAudiences ? "rotate-180" : ""}`} />
          </button>
          {isAdapting && (
            <span className="text-xs text-electric flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          )}
          <ExportDropdown output={output} isPro={isPro} deliverable={deliverable} excludedSlides={excludedSlides} slideOrder={slideOrder} deckTheme={deckTheme} />

          <div className="w-px h-5 bg-border" />

          <button onClick={() => { reset(); navigate("/dashboard"); }} className={navLinkClass("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/raise")} className={`text-xs transition-colors ${location.pathname.startsWith("/raise") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>Raise</button>
          {!isProNav && (
            <button onClick={() => setUpgradeOpen(true)} className="text-[10px] font-medium px-2 py-1 bg-electric/10 text-electric border border-electric/20 rounded-sm hover:bg-electric/15 transition-colors">Upgrade</button>
          )}
          <button onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
        </div>
      </nav>

      {showAudiences && (
        <div className="border-b border-border px-5 py-2 bg-background/95 backdrop-blur-sm z-40 sticky" style={{ top: `${NAV_HEIGHT}px` }}>
          <div className="flex items-center gap-2 ml-[200px]">
            {AUDIENCES.map(a => (
              <button
                key={a.value}
                onClick={() => handleAudienceSelect(a.value)}
                disabled={isAdapting}
                className={`text-[11px] px-2.5 py-1.5 rounded-sm border transition-colors font-medium ${
                  activeAudience === a.value
                    ? "border-electric/30 text-electric bg-electric/10"
                    : "border-border text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
                } disabled:opacity-40`}
              >
                {a.label}
                <span className="text-muted-foreground ml-1 font-normal hidden sm:inline">· {a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content with sidebar */}
      <div className="flex-1">
        <ProjectSidebar activeTab={activeTab} onTabChange={setActiveTab} intent={effectiveIntent} />
        <div style={{ marginLeft: 200 }}>
          <div className="max-w-[900px] mx-auto px-6 py-6 w-full animate-fade-in" key={activeTab}>
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
          <div className="flex items-center justify-between" style={{ marginLeft: 200 }}>
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
  const d = output.data || output.deliverable || {};
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
