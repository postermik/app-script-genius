import { useState } from "react";
import { Rocket, Search, Mail, FolderLock, GitGraph } from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";

const FEATURES = [
  {
    icon: Search,
    title: "Investor Discovery",
    description: "Find investors who match your stage, sector, and thesis. Curated profiles with check sizes, portfolio companies, and contact info.",
  },
  {
    icon: Mail,
    title: "Outreach Tools",
    description: "Track warm intros, cold outreach, and follow-ups in one place. Never lose track of a conversation again.",
  },
  {
    icon: FolderLock,
    title: "Data Room",
    description: "Secure, organized file sharing for due diligence. Control access per investor and track document views.",
  },
  {
    icon: GitGraph,
    title: "Pipeline Tracker",
    description: "Visualize your fundraising funnel from first touch to term sheet. See conversion rates and identify bottlenecks.",
  },
];

export function RaiseUpgradeLanding() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      <div className="max-w-[800px] mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-electric/10 border border-electric/20 text-electric text-xs font-semibold tracking-wide uppercase mb-6">
          <Rocket className="h-3.5 w-3.5" /> Pro Feature
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
          Your fundraising command center
        </h1>
        <p className="text-base text-secondary-foreground max-w-[540px] mx-auto mb-12 leading-relaxed">
          Everything you need to run a structured raise: from finding the right investors to closing the round. All in one place.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12 text-left">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-sm border border-border card-gradient"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-sm bg-electric/10">
                  <f.icon className="h-4 w-4 text-electric" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              </div>
              <p className="text-[13px] text-secondary-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setUpgradeOpen(true)}
          className="px-8 py-3 bg-electric text-primary-foreground rounded-sm font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro
        </button>
        <p className="text-xs text-muted-foreground mt-3">
          Unlock the full fundraising toolkit with a Pro subscription.
        </p>
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
