import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConstellationBackground } from "@/components/ConstellationBackground";
import { DesignShowcase } from "@/components/landing/DesignShowcase";
import { BeyondTheDeck } from "@/components/landing/BeyondTheDeck";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps";

const OUTPUTS = [
  {
    title: "Fundraising Narrative",
    description: "Investment thesis, story arc, and deck structure built to withstand real diligence.",
  },
  {
    title: "Board Update",
    description: "Executive summary, KPI framing, and risk articulation. Clear. Direct. Defensible.",
  },
  {
    title: "Strategy Memo",
    description: "Strategic positioning and decision logic your team can align around.",
  },
  {
    title: "Investor Update",
    description: "Monthly progress reports with metrics framing, challenges, and milestone tracking.",
  },
];

const EXAMPLES = [
  {
    title: "Pre-seed SaaS Fundraise",
    mode: "Fundraising",
    readiness: "Investor-Ready",
    thesis: "Autoflow replaces manual data pipeline management with AI-driven orchestration. The $4.2B data integration market is fragmented across legacy tools that require dedicated engineering teams. Autoflow reduces pipeline setup from weeks to minutes.",
    insight: "The company that owns the data pipeline layer owns the modern data stack.",
  },
  {
    title: "Series A Board Update",
    mode: "Board Update",
    readiness: "Board-Ready",
    thesis: "Q3 closed at $1.8M ARR, up 34% QoQ. Net revenue retention at 128%. Two enterprise contracts signed ($180K+ ACV). Engineering headcount doubled. Burn rate increased 22% but within planned runway.",
    insight: "Revenue quality is improving faster than revenue quantity — a leading indicator of breakout growth.",
  },
  {
    title: "Market Entry Strategy",
    mode: "Strategy",
    readiness: "Solid",
    thesis: "The US clinical trial recruitment market is a $7.2B inefficiency. Patient matching is still done manually by site coordinators. AI-driven matching can compress trial timelines by 40% while reducing per-patient acquisition cost by 60%.",
    insight: "The bottleneck in drug development isn't science — it's patient access.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Try it out with one draft.",
    features: ["1 draft creation", "All output modes", "Basic readiness score", "No exports", "No Raise features"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Hobby",
    price: "$20",
    period: "/mo",
    description: "For founders getting started.",
    features: ["Unlimited drafts", "Full readiness scoring + coaching", "Pitch prep", "Export to PPT + PDF", "Dark deck theme only", "No Raise features"],
    cta: "Choose Hobby",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$100",
    period: "/mo",
    description: "Full capital readiness + raise tools.",
    features: [
      "Everything in Hobby",
      "Investor discovery with AI matching",
      "Pipeline tracker",
      "Data room with analytics",
      "All export formats incl. DOCX",
      "Custom deck themes + brand colors",
      "Audience-specific versions",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-28 overflow-hidden">
        <ConstellationBackground />
        <div className="absolute inset-0 radial-glow pointer-events-none" />
        <div className="max-w-[800px] mx-auto text-center relative z-10 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6">
            Craft the narrative.
          </h1>
          <p className="text-lg text-muted-foreground max-w-[620px] mx-auto leading-relaxed mb-12">
            Turn raw thinking into investor-grade decks, memos, and pitch scripts — then find the right investors and manage your raise. All in one platform.
          </p>
          <button
            onClick={() => navigate("/auth?signup=true&next=/dashboard")}
            className="bg-primary text-primary-foreground px-8 py-4 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 glow-blue"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* What It Produces */}
      <section className="px-6 py-24">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Where It Applies</p>
          <h2 className="text-3xl font-bold text-foreground mb-16 tracking-tight">Structured narratives for real decisions.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {OUTPUTS.map((f) => (
              <div key={f.title} className="bg-card/50 border border-border rounded-sm p-8 hover:border-muted-foreground/20 transition-all hover:-translate-y-0.5">
                <h3 className="text-lg font-semibold text-foreground mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DesignShowcase />

      <BeyondTheDeck />

      {/* Example Gallery */}
      <section className="px-6 py-24">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Example Narratives</p>
          <h2 className="text-3xl font-bold text-foreground mb-16 tracking-tight">See how it reads.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EXAMPLES.map((ex) => (
              <div key={ex.title} className="bg-card/50 border border-border rounded-sm p-8 flex flex-col hover:border-muted-foreground/20 transition-all hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground border border-border px-2 py-0.5 rounded-sm">{ex.mode}</span>
                  <span className="text-[11px] text-emerald font-medium">{ex.readiness}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-3">{ex.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{ex.thesis}</p>
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Core Insight</p>
                  <p className="text-sm text-foreground/90 italic">{ex.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WorkflowSteps />

      {/* Pricing */}
      <section className="px-6 py-24">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Pricing</p>
          <h2 className="text-3xl font-bold text-foreground mb-16 tracking-tight">Start focused. Scale when needed.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`bg-card/50 border rounded-sm p-8 flex flex-col transition-all hover:-translate-y-0.5 ${plan.highlighted ? "border-electric/30 glow-blue-subtle" : "border-border hover:border-muted-foreground/20"}`}>
                <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-8">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-electric mt-0.5">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/auth?signup=true&next=/dashboard")}
                  className={`w-full py-3 text-sm font-medium rounded-sm transition-opacity ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:opacity-90 glow-blue"
                      : "border border-border text-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
