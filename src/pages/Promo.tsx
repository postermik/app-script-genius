import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIERS } from "@/hooks/useSubscription";

// Valid promo codes: code -> { tier, trialDays, description }
const PROMO_CODES: Record<string, { tier: "hobby" | "pro"; trialDays: number; description: string }> = {
  "FOUNDER5": { tier: "hobby", trialDays: 5, description: "5 days of full access" },
  "LAUNCH3": { tier: "hobby", trialDays: 3, description: "3 days of full access" },
};

export default function Promo() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams<{ code: string }>();
  const [code, setCode] = useState(urlCode?.toUpperCase() || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Redeem Promo Code | Rhetoric";
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
    });
  }, []);

  // If code came from URL and user is logged in, auto-validate
  useEffect(() => {
    if (urlCode && session && !checkingAuth) {
      const upper = urlCode.toUpperCase();
      if (PROMO_CODES[upper]) {
        handleRedeem(upper);
      }
    }
  }, [urlCode, session, checkingAuth]);

  const handleRedeem = async (promoCode?: string) => {
    const codeToUse = (promoCode || code).toUpperCase().trim();
    setError("");

    if (!codeToUse) {
      setError("Enter a promo code.");
      return;
    }

    const promo = PROMO_CODES[codeToUse];
    if (!promo) {
      setError("Invalid promo code.");
      return;
    }

    if (!session) {
      // Save code and redirect to auth
      navigate(`/auth?signup=true&next=/promo/${codeToUse}`);
      return;
    }

    setLoading(true);
    try {
      const tier = TIERS[promo.tier];
      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: tier.price_id,
          trialDays: promo.trialDays,
        },
      });

      if (fnError) throw fnError;

      if (data.url) {
        window.location.href = data.url;
      } else if (data.clientSecret) {
        // Embedded mode fallback - redirect to pricing with session
        window.location.href = data.url || "/pricing";
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-electric" />
      </div>
    );
  }

  const validPromo = code ? PROMO_CODES[code.toUpperCase().trim()] : null;

  return (
    <div className="flex-1 px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
      <div className="max-w-[400px] mx-auto">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
          Redeem your promo code
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your code to unlock full access. Your card will be captured but not charged during the trial.
        </p>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="Enter code"
              className="w-full px-4 py-3 bg-card/50 border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-electric/50 transition-colors uppercase tracking-wider"
              autoFocus
            />
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            {validPromo && !error && (
              <p className="text-xs text-electric mt-2">{validPromo.description}</p>
            )}
          </div>

          <button
            onClick={() => handleRedeem()}
            disabled={loading || !code.trim()}
            className="w-full py-3 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to checkout...</>
            ) : (
              <>Start free trial <ArrowRight className="h-4 w-4" /></>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground/40 text-center leading-relaxed">
            You'll be redirected to Stripe to enter your card. You won't be charged until the trial ends. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}