import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";

const PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    tierId: null,
    description: "One free draft to try it out.",
    features: ["1 draft creation", "All output modes", "No exports", "No refinements"],
    highlighted: false,
  },
  {
    name: "Hobby",
    monthlyPrice: 20,
    tierId: "hobby" as const,
    description: "For founders getting started.",
    features: ["Unlimited drafts", "Limited refinements", "Thesis and pitch script only", "No exports", "Partial tabs locked"],
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 100,
    tierId: "pro" as const,
    description: "Full capital readiness.",
    features: ["Unlimited projects", "Unlimited refinements", "All output modes unlocked", "Export to PPT and PDF", "Board and fundraising templates", "Deck framework generation", "Advanced optimization", "Priority processing"],
    highlighted: true,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const { subscribed, productId } = useSubscription();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });
  }, []);

  const getPrice = (plan: typeof PLANS[0]) => {
    if (plan.monthlyPrice === 0) return "$0";
    const price = annual ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice;
    return `$${price}`;
  };

  const isCurrentPlan = (plan: typeof PLANS[0]) => {
    if (!plan.tierId) return !subscribed;
    if (!subscribed || !productId) return false;
    return TIERS[plan.tierId].product_id === productId;
  };

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!plan.tierId) {
      if (session) {
        navigate("/dashboard");
      } else {
        navigate("/auth?signup=true&next=/dashboard");
      }
      return;
    }

    if (!session) {
      navigate("/auth?signup=true");
      return;
    }

    if (isCurrentPlan(plan)) {
      setLoadingTier(plan.tierId);
      try {
        const { data, error } = await supabase.functions.invoke("customer-portal");
        if (error) throw error;
        window.open(data.url, "_blank");
      } catch {
        toast.error("Unable to open billing portal. Try again.");
      } finally {
        setLoadingTier(null);
      }
      return;
    }

    setUpgradeOpen(true);
  };

  const getButtonLabel = (plan: typeof PLANS[0], current: boolean) => {
    if (!plan.tierId) {
      if (current) return "Current Plan";
      return "Get Started";
    }
    if (current) return "Manage Subscription";
    if (!session) return `Choose ${plan.name}`;
    return `Upgrade to ${plan.name}`;
  };

  const isButtonDisabled = (plan: typeof PLANS[0], current: boolean) => {
    if (!plan.tierId && current) return true;
    if (loadingTier === plan.tierId) return true;
    return false;
  };

  return (
    <>
      <div className="px-6 pt-24 pb-8">
        <div className="max-w-[1100px] mx-auto text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
            Simple, transparent pricing.
          </h1>
          <p className="text-base text-muted-foreground max-w-[500px] mx-auto mb-10">
            Start free. Upgrade when you need the full capital readiness suite.
          </p>

          <div className="flex items-center justify-center gap-3 mb-16">
            <span className={`text-sm ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-11 h-6 rounded-full border transition-colors ${annual ? "bg-electric/20 border-electric/30" : "bg-card border-border"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${annual ? "left-[22px] bg-electric" : "left-0.5 bg-foreground"}`} />
            </button>
            <span className={`text-sm ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual <span className="text-xs text-electric ml-1">Save 20%</span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-24">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const current = isCurrentPlan(plan);
            return (
              <div key={plan.name} className="relative">
                {plan.highlighted && !current && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-medium tracking-[0.15em] uppercase text-electric bg-card border border-electric/30 px-2.5 py-1 rounded-sm whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                {current && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-medium tracking-[0.15em] uppercase text-emerald-400 bg-card border border-emerald-400/30 px-2.5 py-1 rounded-sm whitespace-nowrap">
                    Your Plan
                  </span>
                )}
                <div className={`bg-card/50 border rounded-sm p-10 flex flex-col h-full transition-all hover:-translate-y-0.5 ${
                  current
                    ? "border-emerald-400/30"
                    : plan.highlighted
                    ? "border-electric/30 glow-blue-subtle"
                    : "border-border hover:border-muted-foreground/20"
                }`}>
                  <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-foreground">{getPrice(plan)}</span>
                    {plan.monthlyPrice > 0 && <span className="text-sm text-muted-foreground">/seat/mo</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-10">{plan.description}</p>

                  <ul className="space-y-3 mb-10 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="text-sm text-foreground/80 flex items-start gap-2.5">
                        <Check className="h-3.5 w-3.5 text-electric mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isButtonDisabled(plan, current)}
                    className={`w-full py-3 text-sm font-medium rounded-sm transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 ${
                      plan.highlighted && !current
                        ? "bg-primary text-primary-foreground hover:opacity-90 glow-blue"
                        : "border border-border text-foreground hover:border-muted-foreground/30"
                    }`}
                  >
                    {loadingTier === plan.tierId && <Loader2 className="h-4 w-4 animate-spin" />}
                    {getButtonLabel(plan, current)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
