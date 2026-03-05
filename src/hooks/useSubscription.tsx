import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: false,
  productId: null,
  subscriptionEnd: null,
  loading: true,
  checkSubscription: async () => {},
});

export const TIERS = {
  hobby: {
    price_id: "price_1T6JwBDqdQWdRyBVWrslYqfx",
    annual_price_id: "price_1T7QQMDqdQWdRyBV8iodNkIj",
    product_id: "prod_U4SrUy9qxNChoO",
    monthlyPrice: 20,
    annualMonthlyPrice: 16,
    annualYearlyPrice: 192,
    name: "Hobby",
    description: "For active founders.",
    features: ["Unlimited drafts", "Full coaching & readiness scoring", "Inline AI suggestions", "Export to PPT, DOCX & PDF", "Deck theme customization"],
  },
  pro: {
    price_id: "price_1T6JwNDqdQWdRyBVnIXQc9Jn",
    annual_price_id: "price_1T7QQcDqdQWdRyBVZUkYKRSE",
    product_id: "prod_U4SsYqz1XAGBR4",
    monthlyPrice: 100,
    annualMonthlyPrice: 80,
    annualYearlyPrice: 960,
    name: "Pro",
    description: "Everything you need to raise.",
    features: ["Everything in Hobby", "Investor discovery with AI matching", "Pipeline tracker", "Data room with view analytics", "All export formats incl. DOCX", "Priority support"],
  },
} as const;

export const FREE_PLAN = {
  name: "Free",
  description: "Try it out.",
  features: ["1 narrative draft", "Readiness score", "All output modes"],
} as const;

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({ subscribed: false, productId: null, subscriptionEnd: null, loading: false });
        return;
      }

      // Check for admin/forced tier override in profiles table first
      const { data: profile } = await supabase
        .from("profiles")
        .select("forced_tier")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile?.forced_tier === "pro") {
        console.log("[Subscription] forced_tier=pro override active");
        setState({
          subscribed: true,
          productId: TIERS.pro.product_id,
          subscriptionEnd: null,
          loading: false,
        });
        return;
      }
      if (profile?.forced_tier === "hobby") {
        console.log("[Subscription] forced_tier=hobby override active");
        setState({
          subscribed: true,
          productId: TIERS.hobby.product_id,
          subscriptionEnd: null,
          loading: false,
        });
        return;
      }

      // Fall back to Stripe subscription check
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setState({
        subscribed: data.subscribed ?? false,
        productId: data.product_id ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        loading: false,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });
    const interval = setInterval(checkSubscription, 60000);
    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ ...state, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
