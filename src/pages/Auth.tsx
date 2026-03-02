import { useState, useEffect } from "react";
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
  const navigate = useNavigate();

  const nextUrl = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    console.log("[Auth] Mounting, checking session...");

    // One-time session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Auth] getSession result:", session ? "HAS SESSION" : "NO SESSION");
      if (session) {
        console.log("[Auth] Already authenticated, redirecting to", nextUrl);
        navigate(nextUrl, { replace: true });
      } else {
        setChecking(false);
      }
    });

    // Listen for future auth changes (sign-in, sign-out) but NOT initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] onAuthStateChange:", event, session ? "HAS SESSION" : "NO SESSION");
      if (event === "INITIAL_SESSION") return; // Skip — handled by getSession above
      if (event === "SIGNED_IN" && session) {
        console.log("[Auth] SIGNED_IN, navigating to", nextUrl);
        navigate(nextUrl, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, nextUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("[Auth] Submitting", isSignUp ? "signUp" : "signIn", "for", email);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + nextUrl },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
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

  if (checking) return null;

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

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 glow-blue"
          >
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
