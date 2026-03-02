import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductView } from "@/components/ProductView";

export default function Dashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth?next=/dashboard", { replace: true });
      } else {
        setReady(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth?next=/dashboard", { replace: true });
      } else {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!ready) return null;
  return <ProductView />;
}
