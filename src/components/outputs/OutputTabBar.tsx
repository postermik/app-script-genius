import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import type { OutputDeliverable } from "@/types/rhetoric";

const TAB_LABELS: Record<OutputDeliverable, string> = {
  slide_framework: "Slide Framework",
  elevator_pitch: "Elevator Pitch",
  investor_qa: "Investor Q&A",
  pitch_email: "Pitch Emails",
  investment_memo: "Investment Memo",
};

const ALL_OUTPUTS: OutputDeliverable[] = [
  "slide_framework",
  "elevator_pitch",
  "investor_qa",
  "pitch_email",
  "investment_memo",
];

interface Props {
  tabs: OutputDeliverable[];
  activeTab: OutputDeliverable;
  onTabChange: (tab: OutputDeliverable) => void;
  onAddOutput?: (output: OutputDeliverable) => void;
  generatingOutputs?: Set<OutputDeliverable>;
}

export function OutputTabBar({ tabs, activeTab, onTabChange, onAddOutput, generatingOutputs }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableToAdd = ALL_OUTPUTS.filter(o => !tabs.includes(o));

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <div className="border-b border-border mb-6 overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
      <div className="flex items-center gap-0 min-w-max">
        {tabs.map(tab => {
          const active = activeTab === tab;
          const isGenerating = generatingOutputs?.has(tab);
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
              <span className="flex items-center gap-1.5">
                {TAB_LABELS[tab]}
                {isGenerating && (
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-1 bg-electric rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 bg-electric rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 bg-electric rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-electric rounded-full" />
              )}
            </button>
          );
        })}

        {onAddOutput && availableToAdd.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-center w-7 h-7 ml-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Add output"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-card border border-border rounded-sm shadow-lg py-1 animate-fade-in">
                {availableToAdd.map(output => (
                  <button
                    key={output}
                    onClick={() => {
                      onAddOutput(output);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-secondary-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {TAB_LABELS[output]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
