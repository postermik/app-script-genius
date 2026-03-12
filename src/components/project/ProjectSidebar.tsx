import { useNavigate } from "react-router-dom";
import { Layers, Target, Search, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OutputTabKey } from "@/types/rhetoric";
import { useIsMobile } from "@/hooks/use-mobile";
import { GenerationStepper } from "@/components/GenerationStepper";
import { useDecksmith } from "@/context/DecksmithContext";
import { useState, useEffect, useRef } from "react";

interface SidebarItem {
  key: OutputTabKey;
  label: string;
  Icon: LucideIcon;
}

const CREATE_SIDEBAR: SidebarItem[] = [
  { key: "outputs", label: "Outputs", Icon: Layers },
  { key: "score", label: "Score", Icon: Target },
];

const EVALUATE_SIDEBAR: SidebarItem[] = [
  { key: "analysis", label: "Analysis", Icon: Search },
  { key: "outputs", label: "Outputs", Icon: Layers },
  { key: "score", label: "Score", Icon: Target },
];

// Which completedOutputs key signals each tab is done
const TAB_COMPLETION_SIGNALS: Partial<Record<OutputTabKey, string[]>> = {
  outputs: ["core_narrative"],
  score: ["_scoring"],
  analysis: ["_scoring"],
};

interface Props {
  activeTab: OutputTabKey;
  onTabChange: (tab: OutputTabKey) => void;
  intent: "create" | "evaluate";
  isLoading?: boolean;
}

export function ProjectSidebar({ activeTab, onTabChange, intent, isLoading }: Props) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { completedOutputs, isGeneratingOutputs, isGenerating } = useDecksmith();
  const items = intent === "evaluate" ? EVALUATE_SIDEBAR : CREATE_SIDEBAR;
  const stepperVisible = isLoading || isGeneratingOutputs || completedOutputs.size > 0;

  // Track which tabs have new content since last visit
  const [pulseTabs, setPulseTabs] = useState<Set<OutputTabKey>>(new Set());
  const prevCompletedRef = useRef<Set<string>>(new Set());

  // Reset pulse state on new generation
  useEffect(() => {
    if (isGenerating) {
      setPulseTabs(new Set());
      prevCompletedRef.current = new Set();
    }
  }, [isGenerating]);

  // Detect newly completed signals and pulse the relevant tab if it's not active
  useEffect(() => {
    const prev = prevCompletedRef.current;
    const newKeys = [...completedOutputs].filter(k => !prev.has(k));

    if (newKeys.length > 0) {
      setPulseTabs(current => {
        const next = new Set(current);
        for (const [tab, signals] of Object.entries(TAB_COMPLETION_SIGNALS) as [OutputTabKey, string[]][]) {
          if (tab !== activeTab && signals.some(s => newKeys.includes(s))) {
            next.add(tab);
          }
        }
        return next;
      });
      prevCompletedRef.current = new Set(completedOutputs);
    }
  }, [completedOutputs, activeTab]);

  // Clear pulse when user clicks that tab
  const handleTabChange = (tab: OutputTabKey) => {
    setPulseTabs(prev => {
      const next = new Set(prev);
      next.delete(tab);
      return next;
    });
    onTabChange(tab);
  };

  if (isMobile) {
    return (
      <div className="border-b border-border bg-background sticky top-14 z-40 overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          {items.map((item) => {
            const active = activeTab === item.key;
            const hasPulse = pulseTabs.has(item.key);
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-electric/10 text-electric border border-electric/30"
                    : "text-secondary-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <item.Icon className="h-3 w-3 shrink-0" />
                {item.label}
                {hasPulse && !active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-electric animate-pulse" />
                )}
              </button>
            );
          })}
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-secondary-foreground hover:text-foreground transition-colors whitespace-nowrap ml-auto"
          >
            <Settings className="h-3 w-3 shrink-0" />
            Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside
      className="bg-[hsl(222_24%_4%)] border-r border-border overflow-y-auto flex flex-col"
      style={{ position: "fixed", top: 56, left: 0, bottom: 0, width: 200, zIndex: 40 }}
    >
      <div className="flex-1 px-2.5 pt-5">
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = activeTab === item.key;
            const hasPulse = pulseTabs.has(item.key);
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-colors text-left ${
                  active
                    ? "bg-electric/10 text-electric border-l-[3px] border-l-electric border-y border-r border-y-electric/20 border-r-electric/20 pl-[9px]"
                    : "text-secondary-foreground hover:text-foreground hover:bg-muted/30 border-l-[3px] border-transparent pl-[9px]"
                }`}
              >
                <item.Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
                {/* Pulse dot — appears when this tab has new content and isn't active */}
                {hasPulse && !active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-electric animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Generation stepper */}
        <div className={`mt-6 pt-4 border-t border-border transition-opacity duration-500 ${stepperVisible ? "block" : "hidden"}`}>
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3 px-3">
            Generating
          </p>
          <GenerationStepper />
        </div>
      </div>

      <div className="px-2.5 pb-5 pt-3 border-t border-border mt-auto">
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-colors text-left text-secondary-foreground hover:text-foreground hover:bg-muted/30 border-l-[3px] border-transparent pl-[9px] w-full"
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          Settings
        </button>
      </div>
    </aside>
  );
}
