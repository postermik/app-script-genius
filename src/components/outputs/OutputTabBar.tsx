import { useState, useEffect, useRef } from "react";
import { Plus, Zap } from "lucide-react";
import type { OutputDeliverable, IntakePurpose } from "@/types/rhetoric";
import { OUTPUT_LABELS, sortBySpeed } from "@/lib/outputOrder";
import { INTENT_OUTPUTS } from "@/types/rhetoric";

interface Props {
  tabs: OutputDeliverable[];
  activeTab: OutputDeliverable;
  onTabChange: (tab: OutputDeliverable) => void;
  onAddOutput?: (outputs: OutputDeliverable[]) => void;
  purpose?: IntakePurpose;
  completedOutputs?: Set<string>;
  isGenerating?: boolean;
}

export function OutputTabBar({ tabs, activeTab, onTabChange, onAddOutput, purpose, completedOutputs, isGenerating }: Props) {
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [pendingOutputs, setPendingOutputs] = useState<Set<OutputDeliverable>>(new Set());
  const [glowingTabs, setGlowingTabs] = useState<Set<string>>(new Set());
  const prevCompleted = useRef<Set<string>>(new Set());

  // Detect newly completed tabs and trigger glow
  useEffect(() => {
    if (!completedOutputs) return;
    const newlyCompleted: string[] = [];
    completedOutputs.forEach(tab => {
      if (!prevCompleted.current.has(tab) && tab !== "_scoring" && tab !== "_analyzing") {
        newlyCompleted.push(tab);
      }
    });
    prevCompleted.current = new Set(completedOutputs);

    if (newlyCompleted.length > 0) {
      setGlowingTabs(prev => {
        const next = new Set(prev);
        newlyCompleted.forEach(t => next.add(t));
        return next;
      });
      // Remove glow after 1s
      setTimeout(() => {
        setGlowingTabs(prev => {
          const next = new Set(prev);
          newlyCompleted.forEach(t => next.delete(t));
          return next;
        });
      }, 1000);
    }
  }, [completedOutputs]);

  const allForPurpose = purpose ? INTENT_OUTPUTS[purpose].map(o => o.value) : [];
  const availableToAdd = allForPurpose.filter(o => !tabs.includes(o));

  const togglePending = (output: OutputDeliverable) => {
    setPendingOutputs(prev => {
      const next = new Set(prev);
      if (next.has(output)) next.delete(output);
      else next.add(output);
      return next;
    });
  };

  const handleGenerate = () => {
    if (pendingOutputs.size === 0) return;
    onAddOutput?.(Array.from(pendingOutputs));
    setPendingOutputs(new Set());
    setShowAddOptions(false);
  };

  return (
    <div className="border-b border-border mb-6 overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
      <div className="flex items-center gap-0 min-w-max">
        {tabs.map(tab => {
          const active = activeTab === tab;
          const isCompleted = completedOutputs?.has(tab);
          const isLoading = isGenerating && !isCompleted && tab !== "core_narrative";
          const isGlowing = glowingTabs.has(tab);
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                isGlowing
                  ? "animate-tab-glow"
                  : active
                    ? "text-electric"
                    : isLoading
                      ? "text-muted-foreground/50"
                      : "text-secondary-foreground hover:text-foreground"
              }`}
            >
              {OUTPUT_LABELS[tab] || tab}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-electric rounded-full" />
              )}
              {isLoading && (
                <span className="absolute top-2 right-1 w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Pending (not yet generated) output tabs */}
        {showAddOptions && availableToAdd.map(output => {
          const selected = pendingOutputs.has(output);
          return (
            <button
              key={output}
              onClick={() => togglePending(output)}
              className={`relative px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap border-b-2 ${
                selected
                  ? "text-electric/70 border-b-electric/40"
                  : "text-muted-foreground/50 hover:text-muted-foreground border-b-transparent"
              }`}
            >
              {OUTPUT_LABELS[output] || output}
            </button>
          );
        })}

        {/* Generate button for pending outputs */}
        {showAddOptions && pendingOutputs.size > 0 && (
          <button
            onClick={handleGenerate}
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium bg-electric text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Zap className="w-3 h-3" />
            Generate
          </button>
        )}

        {/* Add button */}
        {onAddOutput && availableToAdd.length > 0 && !isGenerating && (
          <button
            onClick={() => {
              setShowAddOptions(!showAddOptions);
              if (showAddOptions) setPendingOutputs(new Set());
            }}
            className={`flex items-center justify-center w-7 h-7 ml-1 rounded-sm transition-colors ${
              showAddOptions
                ? "text-electric bg-electric/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            title={showAddOptions ? "Cancel" : "Add output"}
          >
            <Plus className={`w-3.5 h-3.5 transition-transform ${showAddOptions ? "rotate-45" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}
