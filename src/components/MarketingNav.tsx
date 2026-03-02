import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Logo } from "@/components/Logo";
import type { Session } from "@supabase/supabase-js";

export function MarketingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { subscribed, productId } = useSubscription();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); setAuthReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname === "/dashboard";
  const isPricingPage = location.pathname === "/pricing";
  const isPro = subscribed && productId === TIERS.pro.product_id;

  const linkClass = (path: string) =>
    `text-sm transition-colors ${isActive(path) ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`;

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  return (
    <>
      <nav className="border-b border-border px-6 py-5 relative z-10">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <button onClick={() => navigate(session ? "/dashboard" : "/")} className="flex items-center">
            <Logo variant={session ? "mark" : "full"} size={session ? 26 : 32} className="sm:block hidden" />
            <Logo variant={session ? "mark" : "full"} size={session ? 22 : 24} className="sm:hidden block" />
          </button>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6" style={{ visibility: authReady ? "visible" : "hidden" }}>
              {session ? (
                <>
                  {isDashboard && !isPro && (
                    <button onClick={() => setUpgradeOpen(true)} className="text-xs font-medium px-3 py-1.5 bg-electric/10 text-electric border border-electric/20 rounded-sm hover:bg-electric/15 transition-colors">Upgrade</button>
                  )}
                  {isPricingPage && (
                    <button onClick={() => navigate("/dashboard")} className={linkClass("/dashboard")}>Dashboard</button>
                  )}
                  {!isDashboard && !isPricingPage && !isPro && (
                    <button onClick={() => setUpgradeOpen(true)} className="text-xs font-medium px-3 py-1.5 bg-electric/10 text-electric border border-electric/20 rounded-sm hover:bg-electric/15 transition-colors">Upgrade</button>
                  )}
                  <button onClick={() => navigate("/resources")} className={linkClass("/resources")}>Resources</button>
                  <button onClick={handleSignOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate("/pricing")} className={linkClass("/pricing")}>Pricing</button>
                  <button onClick={() => navigate("/resources")} className={linkClass("/resources")}>Resources</button>
                  <button onClick={() => navigate("/auth")} className={linkClass("/auth")}>Sign In</button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
