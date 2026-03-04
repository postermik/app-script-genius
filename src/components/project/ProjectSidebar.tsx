import { useNavigate } from "react-router-dom";
import { Gauge, FileText, GitBranch, MessageSquare, Layout, Settings, Target, Lightbulb, Mic, Eye, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProjectSection = "readiness" | "thesis" | "narrative" | "pitch" | "deck";

interface SidebarItem {
  key: ProjectSection;
  label: string;
  icon: string;
  visible: boolean;
}

const SIDEBAR_CONFIG: Record<string, SidebarItem[]> = {
  fundraising: [
    { key: "readiness", label: "Readiness", icon: "Target", visible: true },
    { key: "thesis", label: "Thesis", icon: "Lightbulb", visible: true },
    { key: "narrative", label: "Narrative Arc", icon: "FileText", visible: true },
    { key: "pitch", label: "Pitch Prep", icon: "Mic", visible: true },
    { key: "deck", label: "Deck Framework", icon: "Layout", visible: true },
  ],
  board_update: [
    { key: "readiness", label: "Readiness", icon: "Target", visible: true },
    { key: "thesis", label: "Summary", icon: "FileText", visible: true },
    { key: "narrative", label: "Narrative Arc", icon: "FileText", visible: true },
    { key: "pitch", label: "Pitch Prep", icon: "Mic", visible: false },
    { key: "deck", label: "Board Deck", icon: "Layout", visible: true },
  ],
  strategy: [
    { key: "readiness", label: "Readiness", icon: "Target", visible: true },
    { key: "thesis", label: "Thesis", icon: "Lightbulb", visible: true },
    { key: "narrative", label: "Narrative Arc", icon: "FileText", visible: true },
    { key: "pitch", label: "Pitch Prep", icon: "Mic", visible: false },
    { key: "deck", label: "Framework", icon: "Layout", visible: false },
  ],
  product_vision: [
    { key: "readiness", label: "Readiness", icon: "Target", visible: true },
    { key: "thesis", label: "Vision", icon: "Eye", visible: true },
    { key: "narrative", label: "Narrative Arc", icon: "FileText", visible: true },
    { key: "pitch", label: "Pitch Prep", icon: "Mic", visible: false },
    { key: "deck", label: "Framework", icon: "Layout", visible: false },
  ],
  investor_update: [
    { key: "readiness", label: "Readiness", icon: "Target", visible: true },
    { key: "thesis", label: "Headline", icon: "Type", visible: true },
    { key: "narrative", label: "Narrative Arc", icon: "FileText", visible: false },
    { key: "pitch", label: "Pitch Prep", icon: "Mic", visible: false },
    { key: "deck", label: "Framework", icon: "Layout", visible: false },
  ],
};

const ICON_MAP: Record<string, LucideIcon> = {
  Target, Lightbulb, FileText, Mic, Layout, Eye, Type, Gauge, GitBranch, MessageSquare,
};

interface Props {
  activeSection: ProjectSection;
  onSectionChange: (section: ProjectSection) => void;
  mode?: string;
}

export function ProjectSidebar({ activeSection, onSectionChange, mode }: Props) {
  const navigate = useNavigate();
  const items = (SIDEBAR_CONFIG[mode || ""] || SIDEBAR_CONFIG.fundraising).filter(i => i.visible);

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
            const active = activeSection === item.key;
            const Icon = ICON_MAP[item.icon] || Gauge;
            return (
              <button
                key={item.key}
                onClick={() => onSectionChange(item.key)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-[13px] font-medium transition-colors text-left ${
                  active
                    ? "bg-electric/10 text-electric border-l-[3px] border-l-electric border-y border-r border-y-electric/20 border-r-electric/20 pl-[9px]"
                    : "text-secondary-foreground hover:text-foreground hover:bg-muted/30 border-l-[3px] border-transparent pl-[9px]"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
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
