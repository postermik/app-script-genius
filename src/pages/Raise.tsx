import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { RaiseUpgradeLanding } from "@/components/raise/RaiseUpgradeLanding";
import { RaiseSidebar } from "@/components/raise/RaiseSidebar";

export default function Raise() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const { subscribed, productId, loading } = useSubscription();

  const isPro = subscribed && productId === TIERS.pro.product_id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth?next=/raise", { replace: true });
      } else {
        setReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT") {
        navigate("/auth?next=/raise", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (ready && !loading && isPro && location.pathname === "/raise") {
      navigate("/raise/investors", { replace: true });
    }
  }, [ready, loading, isPro, location.pathname, navigate]);

  if (!ready || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPro) {
    return <RaiseUpgradeLanding />;
  }

  if (location.pathname === "/raise") return null;

  return (
    <div className="pl-52">
      <RaiseSidebar />
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
}
