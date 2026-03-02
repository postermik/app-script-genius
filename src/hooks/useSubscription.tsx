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
    product_id: "prod_U4SrUy9qxNChoO",
  },
  pro: {
    price_id: "price_1T6JwNDqdQWdRyBVnIXQc9Jn",
    product_id: "prod_U4SsYqz1XAGBR4",
  },
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
