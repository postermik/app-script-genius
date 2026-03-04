import { useNavigate } from "react-router-dom";
import { Eye, Target, MessageSquare, Search, RefreshCw, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OutputTabKey } from "@/types/rhetoric";

interface SidebarItem {
  key: OutputTabKey;
  label: string;
  Icon: LucideIcon;
}

const CREATE_SIDEBAR: SidebarItem[] = [
  { key: "preview", label: "Preview", Icon: Eye },
  { key: "score", label: "Score", Icon: Target },
  { key: "coaching", label: "Coaching", Icon: MessageSquare },
];

const EVALUATE_SIDEBAR: SidebarItem[] = [
  { key: "analysis", label: "Analysis", Icon: Search },
  { key: "rebuilt", label: "Rebuilt", Icon: RefreshCw },
  { key: "coaching", label: "Coaching", Icon: MessageSquare },
];

interface Props {
  activeTab: OutputTabKey;
  onTabChange: (tab: OutputTabKey) => void;
  intent: "create" | "evaluate";
}

export function ProjectSidebar({ activeTab, onTabChange, intent }: Props) {
  const navigate = useNavigate();
  const items = intent === "evaluate" ? EVALUATE_SIDEBAR : CREATE_SIDEBAR;

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
