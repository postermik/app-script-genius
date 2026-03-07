import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import type { OutputDeliverable } from "@/types/rhetoric";
import { OUTPUT_SPEED_ORDER, OUTPUT_LABELS } from "@/lib/outputOrder";

const ALL_OUTPUTS: OutputDeliverable[] = [
  "elevator_pitch",
  "investor_qa",
  "pitch_email",
  "investment_memo",
  "slide_framework",
];

interface Props {
  tabs: OutputDeliverable[];
  activeTab: OutputDeliverable;
  onTabChange: (tab: OutputDeliverable) => void;
  onAddOutput?: (outputs: OutputDeliverable[]) => void;
}

export function OutputTabBar({ tabs, activeTab, onTabChange, onAddOutput }: Props) {
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [pendingOutputs, setPendingOutputs] = useState<Set<OutputDeliverable>>(new Set());

  const availableToAdd = ALL_OUTPUTS.filter(o => !tabs.includes(o));

  // Tabs are displayed in their original selection order (no re-sorting)

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
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? "text-electric"
                  : "text-secondary-foreground hover:text-foreground"
              }`}
            >
              {OUTPUT_LABELS[tab]}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-electric rounded-full" />
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
              {OUTPUT_LABELS[output]}
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
        {onAddOutput && availableToAdd.length > 0 && (
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
