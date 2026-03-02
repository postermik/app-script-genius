import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

export default function Settings() {
  const navigate = useNavigate();
  const { subscribed, productId, loading: subLoading } = useSubscription();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Tier display
  const isPro = subscribed && productId === TIERS.pro.product_id;
  const isHobby = subscribed && productId === TIERS.hobby.product_id;
  const tierLabel = isPro ? "Pro" : isHobby ? "Hobby" : "Free";
  const tierPrice = isPro ? "$29/mo" : isHobby ? "$9/mo" : "—";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth?next=/settings", { replace: true });
      } else {
        setSession(session);
        setReady(true);
        loadProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT") navigate("/auth", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.full_name) setFullName(data.full_name);
  };

  const handleSaveName = async () => {
    if (!session) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", session.user.id);
      if (error) throw error;
      toast.success("Name updated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update name.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Could not open subscription portal.");
    }
  };

  if (!ready) return null;

  const inputClass =
    "w-full bg-card border border-border rounded-sm px-4 py-3 text-foreground text-sm focus:outline-none focus:border-electric/40 transition-colors";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block";
  const sectionClass = "bg-card/50 border border-border rounded-sm p-6";

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12">
      <div className="max-w-[560px] w-full animate-fade-in space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your subscription, profile, and security.</p>
        </div>

        {/* Subscription Plan */}
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-foreground mb-4 tracking-tight">Subscription Plan</h2>
          {subLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">{tierLabel}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tierPrice}</p>
              </div>
              {subscribed && (
                <button
                  onClick={handleManageSubscription}
                  className="text-xs font-medium px-3 py-1.5 bg-electric/10 text-electric border border-electric/20 rounded-sm hover:bg-electric/15 transition-colors flex items-center gap-1.5"
                >
                  Manage Subscription <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-foreground mb-4 tracking-tight">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={session?.user.email || ""}
                disabled
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {savingName && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-foreground mb-4 tracking-tight">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className={inputClass}
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {changingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update Password
            </button>
          </div>
        </div>

        {/* Legal */}
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-foreground mb-4 tracking-tight">Legal</h2>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/terms")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Use
            </button>
            <button
              onClick={() => navigate("/privacy")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
