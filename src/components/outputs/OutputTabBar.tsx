import type { OutputDeliverable } from "@/types/rhetoric";

const TAB_LABELS: Record<OutputDeliverable, string> = {
  slide_framework: "Slide Framework",
  elevator_pitch: "Elevator Pitch",
  investor_qa: "Investor Q&A",
  pitch_email: "Pitch Emails",
  investment_memo: "Investment Memo",
};

interface Props {
  tabs: OutputDeliverable[];
  activeTab: OutputDeliverable;
  onTabChange: (tab: OutputDeliverable) => void;
}

export function OutputTabBar({ tabs, activeTab, onTabChange }: Props) {
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
              {TAB_LABELS[tab]}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-electric rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
