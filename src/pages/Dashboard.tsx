import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductView } from "@/components/ProductView";

export default function Dashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log("[Dashboard] Mounting, checking session...");

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Dashboard] getSession result:", session ? "HAS SESSION" : "NO SESSION");
      if (!session) {
        navigate("/auth?next=/dashboard", { replace: true });
      } else {
        setReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Dashboard] onAuthStateChange:", event, session ? "HAS SESSION" : "NO SESSION");
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT") {
        navigate("/auth?next=/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return null;
  return <ProductView />;
}
