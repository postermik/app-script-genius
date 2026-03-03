import { useDecksmith } from "@/context/DecksmithContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { OutputCard } from "@/components/OutputCard";
import { ReadinessIndexCard } from "@/components/ReadinessIndexCard";
import { OutreachTracker } from "@/components/OutreachTracker";
import { ExportDropdown } from "@/components/ExportDropdown";
import { SlidePreview, type SlideData, type DeckTheme } from "@/components/SlidePreview";
import { ThesisTab } from "@/components/ThesisTab";
import { NarrativeArcTab } from "@/components/NarrativeArcTab";
import { PitchPrepTab } from "@/components/PitchPrepTab";
import { ProjectSidebar, type ProjectSection } from "@/components/project/ProjectSidebar";
import { ArrowLeft, Lock, ChevronDown, Save, Pencil, Check, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { AudienceType } from "@/types/narrative";

interface TabConfig { key: string; label: string; sections: { key: string; path: string; label: string; content: string }[]; }

const AUDIENCES: { value: AudienceType; label: string; desc: string }[] = [
  { value: "general", label: "General", desc: "Default output" },
  { value: "investors", label: "Investors", desc: "Risk-aware, returns-focused" },
  { value: "board", label: "Board", desc: "Metrics-heavy, strategic" },
  { value: "internal", label: "Internal", desc: "Transparent, motivational" },
];

export function OutputView() {
  const { output, reset, isPro, generationCount, versions, currentVersion, saveVersion, loadVersion, currentProjectId, activeAudience, setActiveAudience, audienceVariants, adaptForAudience, isAdapting } = useDecksmith();
  const [activeSection, setActiveSection] = useState<ProjectSection>("readiness");
  const [showVersions, setShowVersions] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [excludedSlides, setExcludedSlides] = useState<Set<number>>(new Set());
  const [slideOrder, setSlideOrder] = useState<number[]>([]);
  const [deckTheme, setDeckTheme] = useState<DeckTheme>({ scheme: "dark", primary: "#3b82f6", secondary: "#0b0f14", accent: "#1e3a5f" });
  const [showAudiences, setShowAudiences] = useState(false);
  
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const outputRef = useRef(output);

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

  useEffect(() => {
    if (!output) return;
    const d = output.data as any;
    const framework = d.deckFramework || d.boardDeckOutline || [];
    if (framework.length > 0 && slideOrder.length !== framework.length) {
      setSlideOrder(framework.map((_: any, i: number) => i));
      setExcludedSlides(new Set());
    }
  }, [output]);

  if (!output) return null;

  const tabs = buildTabs(output);
  const isFirstFree = !isPro && generationCount >= 1;
  const projectTitle = (output as any).title || "Untitled Project";

  const getDeckPreviewSlides = (): SlideData[] => {
    const d = output.data as any;
    const framework = d.deckFramework || d.boardDeckOutline || [];
    if (!framework || framework.length === 0) return [];
    return framework.map((slide: any, idx: number) => {
      const headline = typeof slide === "string" ? slide : (slide.headline || `Slide ${idx + 1}`);
      const h = headline.toLowerCase();
      let body = "";
      if (h.includes("thesis") || h.includes("investment")) body = d.thesis?.content || d.thesis || "";
      else if (h.includes("market") || h.includes("opportunity")) body = Array.isArray(d.marketLogic) ? d.marketLogic.join("\n") : (d.marketLogic || d.marketAnalysis || "");
      else if (h.includes("problem") || h.includes("pain") || h.includes("world")) body = d.narrativeStructure?.worldToday || d.narrativeStructure?.breakingPoint || d.userProblem || "";
      else if (h.includes("solution") || h.includes("model") || h.includes("product")) body = d.narrativeStructure?.newModel || d.solutionFramework || "";
      else if (h.includes("why") || h.includes("differentiat") || h.includes("moat")) body = d.narrativeStructure?.whyThisWins || d.competitiveFramework || "";
      else if (h.includes("vision") || h.includes("future")) body = d.narrativeStructure?.theFuture || d.vision || "";
      else if (h.includes("risk")) body = d.risks || d.risksFocus || "";
      else if (h.includes("roadmap") || h.includes("milestone")) body = d.roadmapNarrative || d.nextMilestones || "";
      else if (h.includes("ask") || h.includes("funding")) body = d.askUpdate || "";
      else if (h.includes("metric") || h.includes("traction")) body = d.metricsNarrative || d.metrics || "";
      else if (h.includes("summary")) body = d.executiveSummary || "";
      else body = typeof slide === "object" ? (slide.body || slide.content || "") : "";
      return { headline, content: body ? body.slice(0, 300) : "", slideType: slide?.metadata?.slideType, visualDirection: slide?.metadata?.visualDirection };
    });
  };

  const slidePreviewData = getDeckPreviewSlides();

  // Map activeSection to tab data
  const getTabForSection = (section: ProjectSection) => {
    const keyMap: Record<ProjectSection, string[]> = {
      readiness: [],
      thesis: ["thesis", "summary", "vision", "headline"],
      narrative: ["narrative", "metrics", "problem", "progress"],
      pitch: ["pitch", "risks", "competitive", "challenges", "solution"],
      deck: ["deck", "boardDeck", "roadmap", "next", "ask"],
    };
    const keys = keyMap[section];
    return tabs.find(t => keys.includes(t.key));
  };

  const currentTab = getTabForSection(activeSection);
  const isDeckSection = activeSection === "deck";
  const isThesisSection = activeSection === "thesis" && output.mode === "fundraising";
  const isNarrativeSection = activeSection === "narrative" && output.mode === "fundraising";
  const isPitchSection = activeSection === "pitch" && output.mode === "fundraising";

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

  return (
    <div className="flex-1 flex flex-col">
      {/* Top nav */}
      <nav className="border-b border-border px-6 py-4 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <button onClick={() => { reset(); navigate("/dashboard"); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Dashboard
          </button>
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <div className="flex items-center gap-1">
                <input value={titleValue} onChange={e => setTitleValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTitleSave()} className="text-sm font-semibold tracking-wide uppercase text-foreground bg-transparent border-b border-electric outline-none px-1 max-w-[260px]" autoFocus />
                <button onClick={handleTitleSave} className="text-electric hover:text-foreground transition-colors p-0.5"><Check className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <button onClick={handleTitleEdit} className="text-sm font-semibold tracking-wide uppercase text-foreground hover:text-electric transition-colors flex items-center gap-1.5 group">
                {projectTitle}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {currentProjectId && (
              <div className="relative">
                <button onClick={() => setShowVersions(!showVersions)} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 border border-border rounded-sm">
                  {versionLabel}
                  {savedLabel && <span className="text-muted-foreground ml-1">· {savedLabel}</span>}
                  <ChevronDown className="h-3 w-3" />
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
          <div className="flex items-center gap-2">
            {/* Audience selector */}
            <button
              onClick={() => setShowAudiences(!showAudiences)}
              className="text-xs text-secondary-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-2 border border-border rounded-sm transition-colors font-medium"
            >
              <Users className="h-3.5 w-3.5 text-electric" />
              <span className="text-foreground capitalize">{activeAudience}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showAudiences ? "rotate-180" : ""}`} />
            </button>
            {isAdapting && (
              <span className="text-xs text-electric flex items-center gap-1.5 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </span>
            )}
            <ExportDropdown output={output} isPro={isPro} buildTabs={buildTabs} excludedSlides={excludedSlides} slideOrder={slideOrder} deckTheme={deckTheme} />
          </div>
        </div>
        {showAudiences && (
          <div className="max-w-[1100px] mx-auto flex items-center gap-2 mt-3 animate-fade-in">
            {AUDIENCES.map(a => (
              <button
                key={a.value}
                onClick={() => handleAudienceSelect(a.value)}
                disabled={isAdapting}
                className={`text-xs px-3 py-2 rounded-sm border transition-colors font-medium ${
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
        )}
      </nav>

      {/* Main content with sidebar */}
      <div>
        <ProjectSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="ml-52">
          <div className="max-w-[900px] mx-auto px-6 py-8 w-full animate-fade-in" key={activeSection}>
            {/* Readiness section */}
            {activeSection === "readiness" && (
              <ReadinessIndexCard output={output} isPro={isPro} />
            )}

            {/* Thesis section (fundraising mode) */}
            {isThesisSection && currentTab && (
              <ThesisTab sections={currentTab.sections} />
            )}

            {/* Narrative Arc section (fundraising mode) */}
            {isNarrativeSection && currentTab && (
              <NarrativeArcTab sections={currentTab.sections} />
            )}

            {/* Pitch Prep section (fundraising mode) */}
            {isPitchSection && currentTab && (
              <PitchPrepTab sections={currentTab.sections} outputData={output.data} />
            )}

            {/* Deck Framework section */}
            {isDeckSection && slidePreviewData.length > 0 && (
              <SlidePreview
                slides={slidePreviewData}
                excludedSlides={excludedSlides}
                onToggleSlide={toggleSlide}
                slideOrder={slideOrder}
                onReorder={setSlideOrder}
                theme={deckTheme}
                onThemeChange={setDeckTheme}
              />
            )}

            {/* Generic tab content for non-fundraising modes */}
            {!["readiness"].includes(activeSection) && !isThesisSection && !isNarrativeSection && !isPitchSection && !isDeckSection && currentTab && (
              <div className="space-y-0">
                {currentTab.sections.map((section) => (
                  <OutputCard key={section.key} label={section.label} content={section.content} path={section.path} sectionKey={section.key} locked={false} />
                ))}
              </div>
            )}

            {/* Fallback when no tab matches */}
            {!["readiness"].includes(activeSection) && !currentTab && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">This section is not available for the current output mode.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isFirstFree && (
        <div className="border-t border-border px-6 py-6 card-gradient sticky bottom-0">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Unlock Full Narrative</p>
              <p className="text-sm text-muted-foreground mt-0.5">Upgrade to Pro to access all sections, exports, and refinements.</p>
            </div>
            <button onClick={() => toast.info("Upgrade to Pro for full access.")} className="text-xs px-4 py-2.5 rounded-sm font-medium bg-electric text-primary-foreground hover:opacity-90 transition-all glow-blue">
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function buildTabs(output: any): TabConfig[] {
  const d = output.data as any;
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
      { key: "risks", label: "Risks & Focus", sections: [{ key: "risks-focus", path: "risksFocus", label: "Risks & Focus", content: d.risksFocus || "" }] },
      { key: "boardDeck", label: "Board Deck Outline", sections: [] },
    ];
  }
  if (mode === "strategy") {
    return [
      { key: "thesis", label: "Thesis", sections: [{ key: "strat-thesis", path: "thesis", label: "Strategic Thesis", content: d.thesis || "" }] },
      { key: "positioning", label: "Positioning", sections: [{ key: "strat-pos", path: "positioning", label: "Positioning", content: d.positioning || "" }] },
      { key: "market", label: "Market Analysis", sections: [{ key: "strat-market", path: "marketAnalysis", label: "Market Analysis", content: d.marketAnalysis || "" }] },
      { key: "competitive", label: "Competitive Framework", sections: [{ key: "strat-comp", path: "competitiveFramework", label: "Competitive Framework", content: d.competitiveFramework || "" }] },
    ];
  }
  if (mode === "product_vision") {
    return [
      { key: "vision", label: "Vision", sections: [{ key: "pv-vision", path: "vision", label: "Product Vision", content: d.vision || "" }] },
      { key: "problem", label: "User Problem", sections: [{ key: "pv-problem", path: "userProblem", label: "User Problem", content: d.userProblem || "" }] },
      { key: "solution", label: "Solution", sections: [{ key: "pv-solution", path: "solutionFramework", label: "Solution Framework", content: d.solutionFramework || "" }] },
      { key: "roadmap", label: "Roadmap", sections: [{ key: "pv-roadmap", path: "roadmapNarrative", label: "Roadmap Narrative", content: d.roadmapNarrative || "" }] },
    ];
  }
  if (mode === "investor_update") {
    return [
      { key: "headline", label: "Headline", sections: [{ key: "iu-headline", path: "headline", label: "Headline", content: d.headline || "" }] },
      { key: "progress", label: "Progress", sections: [{ key: "iu-progress", path: "progress", label: "Progress", content: d.progress || "" }] },
      { key: "metrics", label: "Metrics", sections: [{ key: "iu-metrics", path: "metrics", label: "Metrics", content: d.metrics || "" }] },
      { key: "challenges", label: "Challenges", sections: [{ key: "iu-challenges", path: "challenges", label: "Challenges", content: d.challenges || "" }] },
      { key: "next", label: "Next Milestones", sections: [{ key: "iu-next", path: "nextMilestones", label: "Next Milestones", content: d.nextMilestones || "" }] },
      { key: "ask", label: "The Ask", sections: [{ key: "iu-ask", path: "askUpdate", label: "Ask Update", content: d.askUpdate || "" }] },
    ];
  }
  return [];
}
