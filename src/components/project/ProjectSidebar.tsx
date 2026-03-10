import { useNavigate } from "react-router-dom";
import { Layers, Target, Search, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OutputTabKey } from "@/types/rhetoric";
import { useIsMobile } from "@/hooks/use-mobile";
import { GenerationStepper } from "@/components/GenerationStepper";
import { useDecksmith } from "@/context/DecksmithContext";

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

interface Props {
  activeTab: OutputTabKey;
  onTabChange: (tab: OutputTabKey) => void;
  intent: "create" | "evaluate";
  isLoading?: boolean;
}

export function ProjectSidebar({ activeTab, onTabChange, intent, isLoading }: Props) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const items = intent === "evaluate" ? EVALUATE_SIDEBAR : CREATE_SIDEBAR;

  if (isMobile) {
    return (
      <div className="border-b border-border bg-background sticky top-14 z-40 overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          {items.map((item) => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-electric/10 text-electric border border-electric/30"
                    : "text-secondary-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <item.Icon className="h-3 w-3 shrink-0" />
                {item.label}
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
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        bottom: 0,
        width: 200,
        zIndex: 40,
      }}
    >
      <div className="flex-1 px-2.5 pt-5">
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-colors text-left ${
                  active
                    ? "bg-electric/10 text-electric border-l-[3px] border-l-electric border-y border-r border-y-electric/20 border-r-electric/20 pl-[9px]"
                    : "text-secondary-foreground hover:text-foreground hover:bg-muted/30 border-l-[3px] border-transparent pl-[9px]"
                }`}
              >
                <item.Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Generation stepper — always mounted, visibility controlled by CSS */}
        {(() => {
          const { completedOutputs } = useDecksmith();
          const hasCompleted = completedOutputs.size > 0;
          const visible = isLoading || hasCompleted;
          return (
            <div className={`mt-6 pt-4 border-t border-border transition-opacity duration-500 ${visible ? "block" : "hidden"}`}>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3 px-3">
                Generating
              </p>
              <GenerationStepper />
            </div>
          );
        })()}
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
