import { useLocation, useNavigate } from "react-router-dom";
import { Search, Mail, FolderLock, GitGraph } from "lucide-react";

const NAV_ITEMS = [
  { label: "Investors", path: "/raise/investors", icon: Search },
  { label: "Outreach", path: "/raise/outreach", icon: Mail },
  { label: "Data Room", path: "/raise/data-room", icon: FolderLock },
  { label: "Pipeline", path: "/raise/pipeline", icon: GitGraph },
];

export function RaiseSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-48 shrink-0 sticky top-[73px] self-start h-[calc(100vh-73px)] overflow-y-auto">
      <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric mb-4 px-3">
        Raise
      </h3>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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
