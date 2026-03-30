import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { useDecksmith } from "@/context/DecksmithContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Logo } from "@/components/Logo";
import { ExportDropdown } from "@/components/ExportDropdown";
import { ArrowLeft, ChevronDown, Save, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getDeliverable } from "@/types/rhetoric";
import type { Session } from "@supabase/supabase-js";

export function MarketingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { subscribed, productId } = useSubscription();
  const { output, reset, isPro, versions, currentVersion, saveVersion, loadVersion, currentProjectId, deckTheme } = useDecksmith();

  const isRaise = location.pathname.startsWith("/raise");
  const isProjectView = !!output && !isRaise;
  const isPlan = subscribed && productId === TIERS.pro.product_id;

  // Project title editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const [lastSaved] = useState<Date | null>(null);

  const projectTitle = output?.title || "Untitled";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); setAuthReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `text-sm transition-colors ${isActive(path) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`;

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  const handleTitleEdit = () => { setTitleValue(projectTitle); setEditingTitle(true); };
  const handleTitleSave = async () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== projectTitle && currentProjectId) {
      await supabase.from("projects").update({ title: titleValue.trim() }).eq("id", currentProjectId);
      toast.success("Title updated.");
    }
  };

  const deliverable = output ? getDeliverable(output) : null;
  const versionLabel = `v${currentVersion}`;
  const savedLabel = lastSaved ? `Saved ${format(lastSaved, "h:mm a")}` : null;

  return (
    <>
      <nav className="border-b border-border px-5 fixed top-0 left-0 right-0 bg-background z-50 flex items-center justify-between" style={{ height: 56 }}>
        {/* Left: back arrow (project only) + logo */}
        <div className="flex items-center gap-3">
          {isProjectView && (
            <button
              onClick={() => { reset(); navigate("/dashboard"); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => navigate(session ? "/dashboard" : "/")} className="flex items-center">
            <Logo size={24} />
          </button>
        </div>

        {/* Center: project title (project view only) */}
        {isProjectView && (
          <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {editingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleTitleSave()}
                  className="text-xs font-semibold tracking-wide uppercase text-foreground bg-transparent border-b border-electric outline-none px-1 max-w-[220px]"
                  autoFocus
                />
                <button onClick={handleTitleSave} className="text-electric hover:text-foreground transition-colors p-0.5">
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleTitleEdit}
                className="text-xs font-semibold tracking-wide uppercase text-foreground hover:text-electric transition-colors flex items-center gap-1.5 group"
              >
                {projectTitle}
                <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {currentProjectId && (
              <div className="relative">
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-1.5 py-0.5 border border-border rounded-sm"
                >
                  {versionLabel}
                  {savedLabel && <span className="text-muted-foreground/60 ml-0.5">· {savedLabel}</span>}
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {showVersions && (
                  <div className="absolute top-full mt-1 right-0 w-56 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in">
                    <button
                      onClick={() => { saveVersion(); setShowVersions(false); }}
                      className="w-full text-left text-xs px-3 py-2.5 text-foreground hover:bg-accent transition-colors flex items-center gap-2 border-b border-border font-medium"
                    >
                      <Save className="h-3 w-3" />Save as New Version
                    </button>
                    {versions.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto">
                        {versions.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => { loadVersion(v.version_number); setShowVersions(false); }}
                            className={`w-full text-left text-xs px-3 py-2.5 hover:bg-accent transition-colors ${v.version_number === currentVersion ? "text-foreground bg-accent/50" : "text-secondary-foreground"}`}
                          >
                            <span className="font-medium">v{v.version_number}</span>
                            <span className="ml-2 text-muted-foreground">{v.summary}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground px-3 py-2.5">No saved versions yet</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right: nav items */}
        <div className="flex items-center gap-2 md:gap-4" style={{ visibility: authReady ? "visible" : "hidden" }}>
          {session ? (
            <>
              {isProjectView && (
                <>
                  <ExportDropdown output={output} isPro={isPro} subscribed={subscribed} deliverable={deliverable} excludedSlides={new Set()} slideOrder={[]} deckTheme={deckTheme} />
                  <div className="hidden md:block w-px h-5 bg-border" />
                </>
              )}
              <button onClick={() => { if (isProjectView) reset(); navigate("/dashboard"); }} className={linkClass("/dashboard")}>Dashboard</button>
              <button
                onClick={() => navigate("/raise")}
                className={`text-sm transition-colors ${isRaise ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Raise
              </button>
              {!isPlan && (
                <button onClick={() => setUpgradeOpen(true)} className="text-xs font-medium px-3 py-1.5 bg-electric/10 text-electric border border-electric/20 rounded-sm hover:bg-electric/15 transition-colors">
                  Upgrade
                </button>
              )}
              <button onClick={handleSignOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/pricing")} className={linkClass("/pricing")}>Pricing</button>
              <button onClick={() => navigate("/auth")} className={linkClass("/auth")}>Sign In</button>
            </>
          )}
        </div>
      </nav>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}