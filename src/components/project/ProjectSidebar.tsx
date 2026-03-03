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
    <aside className="w-52 shrink-0 fixed top-[120px] left-0 bottom-0 overflow-y-auto bg-[hsl(222_24%_4%)] border-r border-border z-10 flex flex-col">
      <div className="flex-1 px-3 pt-6">
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSectionChange(item.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors text-left ${
                  active
                    ? "bg-electric/10 text-electric border border-electric/20"
                    : "text-secondary-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="px-3 pb-6 pt-4 border-t border-border mt-auto">
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors text-left text-secondary-foreground hover:text-foreground hover:bg-muted/30 border border-transparent w-full"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </button>
      </div>
    </aside>
  );
}
