import { useNavigate } from "react-router-dom";
import { Gauge, FileText, GitBranch, MessageSquare, Layout, Settings } from "lucide-react";

export type ProjectSection = "readiness" | "thesis" | "narrative" | "pitch" | "deck";

const NAV_ITEMS: { label: string; key: ProjectSection; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Readiness", key: "readiness", icon: Gauge },
  { label: "Thesis", key: "thesis", icon: FileText },
  { label: "Narrative Arc", key: "narrative", icon: GitBranch },
  { label: "Pitch Prep", key: "pitch", icon: MessageSquare },
  { label: "Deck Framework", key: "deck", icon: Layout },
];

interface Props {
  activeSection: ProjectSection;
  onSectionChange: (section: ProjectSection) => void;
}

export function ProjectSidebar({ activeSection, onSectionChange }: Props) {
  const navigate = useNavigate();

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
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.key;
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
                <item.icon className="h-3.5 w-3.5 shrink-0" />
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
