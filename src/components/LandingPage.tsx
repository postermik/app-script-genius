import { ArrowRight, Check, Zap, BarChart3, Layers, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConstellationBackground } from "@/components/ConstellationBackground";
import { ProductShowcase } from "@/components/landing/ProductShowcase";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Try it out.",
    features: [
      "1 narrative draft",
      "Readiness score",
      "All output modes",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Hobby",
    price: "$20",
    period: "/mo",
    description: "For active founders.",
    features: [
      "Unlimited drafts",
      "Full coaching & readiness scoring",
      "Pitch prep tools",
      "Export to PPT & PDF",
      "Deck theme customization",
    ],
    cta: "Choose Hobby",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$100",
    period: "/mo",
    description: "Full capital readiness.",
    features: [
      "Everything in Hobby",
      "Investor discovery with AI matching",
      "Pipeline tracker",
      "Data room with view analytics",
      "All export formats incl. DOCX",
      "Audience-specific versions",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
];

const PROOF = [
  { icon: Zap, text: "Replaces $10K pitch consultants" },
  { icon: BarChart3, text: "500+ narratives generated" },
  { icon: Users, text: "Powered by Claude AI" },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative px-6 pt-32 pb-20 overflow-hidden">
        <ConstellationBackground />
        <div className="absolute inset-0 radial-glow pointer-events-none" />
        <div className="max-w-[800px] mx-auto text-center relative z-10 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Craft the narrative.
          </h1>
          <p className="text-lg text-foreground/85 max-w-[560px] mx-auto leading-relaxed mb-10">
            Investor-grade decks, memos, and pitch scripts — generated in minutes.
          </p>
          <button
            onClick={() => navigate("/auth?signup=true&next=/dashboard")}
            className="bg-primary text-primary-foreground px-8 py-4 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 glow-blue"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Hero product preview */}
        <div className="max-w-[900px] mx-auto mt-16 relative z-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="bg-card/80 border border-border rounded-sm overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald/60" />
              <span className="ml-3 text-[10px] text-muted-foreground tracking-wider uppercase">Rhetoric — Narrative Generation</span>
            </div>
            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Readiness Score */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--electric))" strokeWidth="6"
                      strokeDasharray="251.2" strokeDashoffset="50" strokeLinecap="round"
                      className="animate-gauge" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">80</span>
                </div>
                <span className="text-xs text-foreground/70 tracking-wider uppercase">Readiness Score</span>
              </div>

              {/* Narrative snippet */}
              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-electric">Investment Thesis</span>
                  <span className="text-[10px] text-emerald font-medium px-1.5 py-0.5 border border-emerald/30 rounded-sm">Investor-Ready</span>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Autoflow replaces manual data pipeline management with AI-driven orchestration. The $4.2B data integration market is fragmented across legacy tools that require dedicated engineering teams.
                </p>
                <div className="flex gap-2 mt-2">
                  {["Thesis", "Pitch Script", "Slide Deck", "Board Memo"].map((t) => (
                    <span key={t} className="text-[10px] text-muted-foreground border border-border px-2 py-1 rounded-sm">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Showcase ── */}
      <ProductShowcase />

      {/* ── Credibility Bar ── */}
      <section className="px-6 py-12 border-y border-border">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {PROOF.map((p) => (
            <div key={p.text} className="flex items-center gap-2.5">
              <p.icon className="h-4 w-4 text-electric/70" />
              <span className="text-sm text-foreground/70">{p.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-6 py-24">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Start free. Scale when ready.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-card/50 border rounded-sm p-8 flex flex-col transition-all hover:-translate-y-0.5 ${
                  plan.highlighted
                    ? "border-electric/30 glow-blue-subtle"
                    : "border-border hover:border-muted-foreground/20"
                }`}
              >
                <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-foreground/60">{plan.period}</span>}
                </div>
                <p className="text-sm text-foreground/70 mb-8">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-foreground/85 flex items-start gap-2.5">
                      <Check className="h-3.5 w-3.5 text-electric mt-0.5 shrink-0" />
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
