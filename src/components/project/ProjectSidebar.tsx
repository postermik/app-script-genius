import { Gauge, FileText, GitBranch, MessageSquare, Layout } from "lucide-react";

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
  return (
    <aside className="w-48 shrink-0 sticky top-[73px] self-start h-[calc(100vh-73px)] overflow-y-auto">
      <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric mb-4 px-3">
        Sections
      </h3>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors text-left ${
                active
                  ? "bg-electric/10 text-electric border border-electric/20"
                  : "text-secondary-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
