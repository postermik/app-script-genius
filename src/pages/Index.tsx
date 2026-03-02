import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LandingPage } from "@/components/LandingPage";

export default function Index() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    console.log("[Index] Mounting, checking session...");

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Index] getSession result:", session ? "HAS SESSION" : "NO SESSION");
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        setChecked(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Index] onAuthStateChange:", event, session ? "HAS SESSION" : "NO SESSION");
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!checked) return null;
  return <LandingPage />;
}
