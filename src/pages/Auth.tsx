import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const nextUrl = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    console.log("[Auth] Mounting, checking session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Auth] getSession result:", session ? "HAS SESSION" : "NO SESSION");
      if (session) {
        console.log("[Auth] Already authenticated, redirecting to", nextUrl);
        navigate(nextUrl, { replace: true });
      } else {
        setChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] onAuthStateChange:", event, session ? "HAS SESSION" : "NO SESSION");
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_IN" && session) {
        console.log("[Auth] SIGNED_IN, navigating to", nextUrl);
        navigate(nextUrl, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, nextUrl]);

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (otpStep && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("[Auth] Submitting", isSignUp ? "signUp" : "signIn", "for", email);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Check if email already exists
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          toast.error("An account with this email already exists. Please sign in instead.");
        } else {
          // Move to OTP verification step
          setOtpStep(true);
          toast.success("Check your email for a verification code.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log("[Auth] signIn successful, onAuthStateChange should handle redirect");
      }
    } catch (err: any) {
      console.error("[Auth] Error:", err.message);
      toast.error(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setVerifying(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: "signup",
      });
      if (error) throw error;
      // onAuthStateChange will handle the redirect
    } catch (err: any) {
      console.error("[Auth] OTP verification error:", err.message);
      toast.error(err.message || "Invalid code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("New code sent. Check your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code.");
    }
  };

  if (checking) return null;

  // OTP verification step
  if (otpStep) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px] animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            We sent a code to <span className="text-foreground">{email}</span>
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Verification code</label>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter code from email"
                maxLength={8}
                required
                className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground text-sm tracking-[0.3em] text-center font-mono focus:outline-none focus:border-electric/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || otpCode.length < 6}
              className="w-full py-3 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 glow-blue"
            >
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify
            </button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Didn't get the code?{" "}
            <button onClick={handleResendCode} className="text-foreground hover:underline">
              Resend
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {isSignUp ? "Start building investor-ready narratives." : "Sign in to continue."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:border-electric/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:border-electric/40 transition-colors"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 glow-blue">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          {isSignUp ? "Already have an account?" : "No account yet?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-foreground hover:underline">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
