import { useState, useCallback, useEffect } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { Check } from "lucide-react";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    stripePromise = supabase.functions.invoke("get-stripe-config").then(({ data }) => {
      if (data?.publishableKey) return loadStripe(data.publishableKey);
      return null;
    });
  }
  return stripePromise;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annual?: boolean;
}

export function UpgradeModal({ open, onOpenChange, annual = false }: UpgradeModalProps) {
  const { subscribed, productId, checkSubscription } = useSubscription();
  const isHobby = subscribed && productId === TIERS.hobby.product_id;

  // If user is already on Hobby (including trial), only offer Pro
  const availableTiers = isHobby ? ["pro"] as const : ["hobby", "pro"] as const;
  const [selectedTier, setSelectedTier] = useState<"hobby" | "pro">(isHobby ? "pro" : "pro");
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  // Reset selected tier when modal opens based on current plan
  useEffect(() => {
    if (open) {
      setSelectedTier(isHobby ? "pro" : "pro");
      setCheckoutStarted(false);
      setCheckoutComplete(false);
    }
  }, [open, isHobby]);

  const handleClose = useCallback(() => {
    setCheckoutStarted(false);
    setCheckoutComplete(false);
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (checkoutComplete) {
      checkSubscription();
      const timer = setTimeout(() => handleClose(), 2500);
      return () => clearTimeout(timer);
    }
  }, [checkoutComplete, checkSubscription, handleClose]);

  const fetchClientSecret = useCallback(async () => {
    const priceId = annual ? TIERS[selectedTier].annual_price_id : TIERS[selectedTier].price_id;
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, embedded: true }
    });
    if (error || !data?.clientSecret) throw new Error("Failed to create checkout session");
    return data.clientSecret;
  }, [selectedTier, annual]);

  if (checkoutComplete) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border p-10 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Check className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">You're on {TIERS[selectedTier].name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedTier === "pro" ? "Full capital readiness suite is now unlocked." : "Full narrative guide is now unlocked."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`border-border bg-card ${checkoutStarted ? "sm:max-w-[600px] p-0 overflow-hidden" : "sm:max-w-[480px] p-8"}`}>
        {!checkoutStarted ? (
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-2">Upgrade</p>
            <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
              {isHobby ? "Upgrade to Pro" : "Unlock the full suite"}
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              {isHobby ? "Get investor discovery, pipeline tracking, and more." : "Choose your plan and subscribe below."}
            </p>

            {/* Only show tier selector if more than one option */}
            {availableTiers.length > 1 ? (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {availableTiers.map((tier) => (
                  <button key={tier} onClick={() => setSelectedTier(tier)}
                    className={`border rounded-sm p-5 text-left transition-colors ${selectedTier === tier ? "border-electric/40 bg-electric/5" : "border-border hover:border-muted-foreground/20"}`}>
                    <p className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground mb-2">{TIERS[tier].name}</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${annual ? TIERS[tier].annualMonthlyPrice : TIERS[tier].monthlyPrice}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      {annual && <span className="text-[10px] text-electric ml-1">billed yearly</span>}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="border border-electric/40 bg-electric/5 rounded-sm p-5 mb-8">
                <p className="text-xs font-medium tracking-[0.12em] uppercase text-muted-foreground mb-2">{TIERS.pro.name}</p>
                <p className="text-2xl font-bold text-foreground">
                  ${annual ? TIERS.pro.annualMonthlyPrice : TIERS.pro.monthlyPrice}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  {annual && <span className="text-[10px] text-electric ml-1">billed yearly</span>}
                </p>
              </div>
            )}

            <div className="mb-8">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                {selectedTier === "pro" ? "Everything included:" : "Starter features:"}
              </p>
              <ul className="space-y-2">
                {TIERS[selectedTier].features.map((f) => (
                  <li key={f} className="text-sm text-foreground/80 flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-electric mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setCheckoutStarted(true)}
              className="w-full py-3 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:opacity-90 transition-opacity glow-blue">
              Continue to payment
            </button>
          </div>
        ) : (
          <div className="min-h-[400px] bg-background p-4">
            <EmbeddedCheckoutProvider stripe={getStripePromise()} options={{ fetchClientSecret, onComplete: () => setCheckoutComplete(true) }}>
              <EmbeddedCheckout className="stripe-dark-embed" />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}