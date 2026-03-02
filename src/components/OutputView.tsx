import { useDecksmith } from "@/context/DecksmithContext";
import { useState } from "react";
import { OutputCard } from "@/components/OutputCard";
import { ReadinessIndexCard } from "@/components/ReadinessIndexCard";
import { OutreachTracker } from "@/components/OutreachTracker";
import { ArrowLeft, Download, Lock, ChevronDown, Save, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TabConfig { key: string; label: string; sections: { key: string; path: string; label: string; content: string }[]; }

export function OutputView() {
  const { output, reset, isPro, generationCount, versions, currentVersion, saveVersion, loadVersion, currentProjectId } = useDecksmith();
  const [activeTab, setActiveTab] = useState(0);
  const [showVersions, setShowVersions] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  if (!output) return null;

  const tabs = buildTabs(output);
  const currentTab = tabs[activeTab];
  const isFirstFree = !isPro && generationCount >= 1;
  const isTabLocked = (i: number) => isFirstFree && i >= 2;

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const exportPptx = async () => {
    if (!isPro) { toast.error("Export is available on Pro."); return; }
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS(); pptx.author = "Rhetoric"; pptx.title = "Narrative Deck"; pptx.layout = "LAYOUT_16x9";
      const deckTab = tabs.find(t => t.key === "deck" || t.key === "boardDeck");
      if (deckTab) {
        deckTab.sections.forEach((s, i) => {
          const slide = pptx.addSlide(); slide.background = { color: "0b0f14" };
          slide.addText(s.content, { x: 0.8, y: 2, w: 8.4, fontSize: 28, fontFace: "Arial", bold: true, color: "dce0e8", align: "center" });
          slide.addText(`Slide ${i + 1}`, { x: 0.8, y: 4.5, w: 8.4, fontSize: 12, fontFace: "Arial", color: "6b7280", align: "center" });
        });
      }
      await pptx.writeFile({ fileName: "Rhetoric_Deck.pptx" }); toast.success("Deck exported.");
    } catch { toast.error("Export failed."); }
  };

  const nextSteps = getNextSteps(output.mode, isPro);

  return (
    <div className="flex-1 flex flex-col">
      <nav className="border-b border-border px-6 py-4 sticky top-0 bg-background/95 backdrop-blur-sm z-20">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />New</button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-[0.15em] uppercase text-foreground cursor-pointer" onClick={reset}>Rhetoric</span>
            {currentProjectId && (
              <div className="relative">
                <button onClick={() => setShowVersions(!showVersions)} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 border border-border rounded-sm">v{currentVersion}<ChevronDown className="h-3 w-3" /></button>
                {showVersions && (
                  <div className="absolute top-full mt-1 right-0 w-52 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in">
                    <button onClick={() => { saveVersion(); setShowVersions(false); }} className="w-full text-left text-xs px-3 py-2 text-foreground hover:bg-accent transition-colors flex items-center gap-2 border-b border-border"><Save className="h-3 w-3" />Save Current Version</button>
                    {versions.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto">
                        {versions.map((v) => (
                          <button key={v.id} onClick={() => { loadVersion(v.version_number); setShowVersions(false); }} className={`w-full text-left text-xs px-3 py-2 hover:bg-accent transition-colors ${v.version_number === currentVersion ? "text-foreground bg-accent/50" : "text-muted-foreground"}`}>
                            <span className="font-medium">v{v.version_number}</span><span className="ml-2 text-muted-foreground/60">{v.summary}</span>
                          </button>
                        ))}
                      </div>
                    ) : (<p className="text-[11px] text-muted-foreground px-3 py-2">No saved versions yet</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentProjectId && (<button onClick={() => setShowOutreach(!showOutreach)} className={`text-xs px-3 py-1.5 border rounded-sm transition-colors ${showOutreach ? "border-electric/30 text-foreground bg-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>Capital Strategy</button>)}
            <button onClick={exportPptx} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-sm"><Download className="h-3 w-3" />Export</button>
            <button onClick={handleSignOut} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
          </div>
        </div>
      </nav>

      {showOutreach && (<div className="border-b border-border px-6 py-6 bg-card/50 animate-fade-in"><div className="max-w-[900px] mx-auto"><OutreachTracker /></div></div>)}

      <div className="border-b border-border px-6 py-5 bg-card/30"><div className="max-w-[900px] mx-auto"><ReadinessIndexCard output={output} isPro={isPro} /></div></div>

      <div className="border-b border-border px-6 sticky top-[57px] bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-[900px] mx-auto flex gap-0 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={tab.key} onClick={() => !isTabLocked(i) && setActiveTab(i)} className={`relative text-sm py-3 px-5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${i === activeTab ? "border-electric text-foreground" : isTabLocked(i) ? "border-transparent text-muted-foreground/30 cursor-not-allowed" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {isTabLocked(i) && <Lock className="h-3 w-3" />}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-12">
        <div className="max-w-[900px] mx-auto animate-fade-in">
          {currentTab && (<div className="space-y-0">{currentTab.sections.map((section) => (<OutputCard key={section.key} label={section.label} content={section.content} path={section.path} sectionKey={section.key} locked={false} />))}</div>)}
        </div>
      </div>

      {isFirstFree && (
        <div className="border-t border-border px-6 py-6 bg-card sticky bottom-0">
          <div className="max-w-[900px] mx-auto">
            <div className="flex items-center justify-between mb-4"><div><p className="text-sm font-medium text-foreground">Recommended Next Move</p><p className="text-xs text-muted-foreground mt-0.5">Based on your {output.mode.replace("_", " ")} output.</p></div></div>
            <div className="flex flex-wrap gap-2">
              {nextSteps.map((step) => (<button key={step.label} className={`text-xs px-4 py-2 rounded-sm font-medium transition-all flex items-center gap-1.5 ${step.primary ? "bg-primary text-primary-foreground hover:opacity-90 glow-blue" : "border border-border text-foreground hover:border-muted-foreground/30"}`}>{step.label}<ArrowRight className="h-3 w-3" /></button>))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getNextSteps(mode: string, isPro: boolean) {
  if (mode === "fundraising") return [{ label: "Unlock Full Narrative", primary: true }, { label: "Generate Investor Target List", primary: false }, { label: "Create Intro Email Draft", primary: false }, { label: "Export Pitch Deck", primary: false }];
  if (mode === "board_update") return [{ label: "Unlock Full Narrative", primary: true }, { label: "Generate Decision Slide", primary: false }, { label: "Highlight Risk Scenarios", primary: false }, { label: "Export Board PDF", primary: false }];
  if (mode === "strategy") return [{ label: "Unlock Full Narrative", primary: true }, { label: "Generate Positioning Map", primary: false }, { label: "Export Strategy Memo", primary: false }];
  return [{ label: "Unlock Full Narrative", primary: true }, { label: "Export to Deck", primary: false }];
}

function buildTabs(output: any): TabConfig[] {
  const d = output.data as any;
  const mode = output.mode;
  if (mode === "fundraising") {
    return [
      { key: "thesis", label: "Thesis", sections: [{ key: "thesis-content", path: "thesis.content", label: "Investment Thesis", content: d.thesis?.content || "" }, { key: "thesis-insight", path: "thesis.coreInsight", label: "Core Insight", content: d.thesis?.coreInsight || "" }, { key: "market-logic", path: "marketLogic", label: "Market Logic", content: Array.isArray(d.marketLogic) ? d.marketLogic.join("\n") : (d.marketLogic || "") }, { key: "why-now", path: "whyNow", label: "Why Now", content: d.whyNow || "" }, { key: "risks", path: "risks", label: "Risks", content: d.risks || "" }] },
      { key: "narrative", label: "Narrative Structure", sections: [{ key: "world-today", path: "narrativeStructure.worldToday", label: "The World Today", content: d.narrativeStructure?.worldToday || "" }, { key: "breaking-point", path: "narrativeStructure.breakingPoint", label: "The Breaking Point", content: d.narrativeStructure?.breakingPoint || "" }, { key: "new-model", path: "narrativeStructure.newModel", label: "The New Model", content: d.narrativeStructure?.newModel || "" }, { key: "why-wins", path: "narrativeStructure.whyThisWins", label: "Why This Wins", content: d.narrativeStructure?.whyThisWins || "" }, { key: "the-future", path: "narrativeStructure.theFuture", label: "The Future", content: d.narrativeStructure?.theFuture || "" }] },
      { key: "pitch", label: "Pitch Script", sections: [{ key: "pitch-script", path: "pitchScript", label: "60-Second Pitch", content: d.pitchScript || "" }] },
      { key: "deck", label: "Deck Framework", sections: (d.deckFramework || []).map((h: any, i: number) => ({ key: `deck-${i}`, path: `deckFramework.${i}`, label: `Slide ${i + 1}`, content: typeof h === "string" ? h : h.headline || JSON.stringify(h) })) },
    ];
  }
  if (mode === "board_update") {
    return [
      { key: "summary", label: "Executive Summary", sections: [{ key: "exec-summary", path: "executiveSummary", label: "Executive Summary", content: d.executiveSummary || "" }] },
      { key: "metrics", label: "Metrics Narrative", sections: [{ key: "metrics-narr", path: "metricsNarrative", label: "Metrics Narrative", content: d.metricsNarrative || "" }] },
      { key: "risks", label: "Risks & Focus", sections: [{ key: "risks-focus", path: "risksFocus", label: "Risks & Focus", content: d.risksFocus || "" }] },
      { key: "boardDeck", label: "Board Deck Outline", sections: (d.boardDeckOutline || []).map((h: any, i: number) => ({ key: `board-${i}`, path: `boardDeckOutline.${i}`, label: `Slide ${i + 1}`, content: typeof h === "string" ? h : h.headline || JSON.stringify(h) })) },
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
