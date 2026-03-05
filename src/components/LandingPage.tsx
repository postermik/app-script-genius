import { ArrowRight, Check, Zap, BarChart3, Users, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConstellationBackground } from "@/components/ConstellationBackground";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
      "Inline AI suggestions",
      "Export to PPT, DOCX & PDF",
      "Deck theme customization",
    ],
    cta: "Choose Hobby",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$100",
    period: "/mo",
    description: "Everything you need to raise.",
    features: [
      "Everything in Hobby",
      "Investor discovery with AI matching",
      "Pipeline tracker",
      "Data room with view analytics",
      "All export formats incl. DOCX",
      "Priority support",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
];

const PROOF = [
  { icon: Zap, text: "Replaces $10K pitch consultants" },
  { icon: BarChart3, text: "500+ narratives generated" },
  { icon: Users, text: "15+ years of capital markets expertise" },
];

const FAQ_ITEMS = [
  {
    q: "What makes Rhetoric different from Tome or Gamma?",
    a: "They generate slides. We generate strategy. Rhetoric structures your thesis, coaches your narrative with inline suggestions, and produces investor-grade deliverables across formats — pitch decks, memos, emails, board updates. Not just formatted templates.",
  },
  {
    q: "What can I create with Rhetoric?",
    a: "Pitch decks, strategy memos, board updates, investor update emails, product vision docs, and pitch scripts. Each output includes inline AI suggestions to strengthen every section.",
  },
  {
    q: "Do I need design skills?",
    a: "No. Rhetoric handles structure, layout, and export. You describe what you're working on — we craft the deliverable.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. The free tier includes one full narrative draft with readiness scoring across all output modes.",
  },
  {
    q: "What AI powers Rhetoric?",
    a: "Rhetoric uses Claude by Anthropic, enhanced with a proprietary narrative framework built from 15+ years of capital markets and investor relations experience.",
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
        <ConstellationBackground />
        <div className="absolute inset-0 radial-glow pointer-events-none" />
        <div className="max-w-[800px] mx-auto text-center relative z-10 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6">
            Craft the narrative.
          </h1>
          <p className="text-lg text-foreground/85 max-w-[560px] mx-auto leading-relaxed mb-10">
            Pitch decks, strategy memos, board updates, investor emails — with AI coaching that makes every draft better.
          </p>
          <button
            onClick={() => navigate("/auth?signup=true&next=/dashboard")}
            className="bg-primary text-primary-foreground px-8 py-4 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 glow-blue"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Hero product preview — memo + inline suggestion */}
        <div className="max-w-[900px] mx-auto mt-10 sm:mt-16 relative z-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="bg-card/80 border border-border rounded-sm overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald/60" />
              <span className="ml-3 text-[10px] text-muted-foreground tracking-wider uppercase">Rhetoric — Narrative Generation</span>
            </div>
            <div className="p-4 sm:p-8">
              {/* Memo preview */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-electric">Strategy Memo</span>
                <span className="text-[10px] text-emerald font-medium px-1.5 py-0.5 border border-emerald/30 rounded-sm">Ready to Send</span>
              </div>
              <h3 className="text-electric text-sm font-semibold mt-4 mb-2">Executive Summary</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Autoflow replaces manual data pipelines with AI-driven orchestration — reducing setup time by 90% and infrastructure costs by 60%.
              </p>

              {/* Inline suggestion card */}
              <div className="mt-4 bg-electric/[0.06] border border-electric/20 rounded-sm p-3 flex items-start gap-3">
                <div className="text-electric mt-0.5 shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground/80">Consider adding a specific customer case study to strengthen the cost reduction claim.</p>
                </div>
                <button className="text-xs px-2.5 py-1 bg-electric hover:bg-electric/80 text-primary-foreground rounded-sm transition-colors font-medium shrink-0">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Showcase ── */}
      <ProductShowcase />

      {/* ── Credibility Bar ── */}
      <section className="px-4 sm:px-6 py-10 sm:py-12 border-y border-border">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-12">
          {PROOF.map((p) => (
            <div key={p.text} className="flex items-center gap-2.5 whitespace-nowrap">
              <p.icon className="h-4 w-4 text-electric shrink-0" />
              <span className="font-medium text-foreground text-sm">{p.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Start free. Scale when ready.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md md:max-w-none mx-auto w-full">
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
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
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

      {/* ── FAQ ── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-[700px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Frequently Asked Questions</p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-sm px-5 bg-card/30">
                <AccordionTrigger className="text-sm text-foreground/90 hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/70 leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
