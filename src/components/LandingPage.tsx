import { useState } from "react";
import { ArrowRight, Check, Zap, BarChart3, Users, Sparkles, ShieldCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TIERS, FREE_PLAN } from "@/hooks/useSubscription";

const PROOF = [
  { icon: Zap, text: "Replaces $10K pitch consultants" },
  { icon: BarChart3, text: "Trained on narratives that raised $7B+" },
  { icon: Users, text: "Built by operators, not prompt engineers" },
  { icon: ShieldCheck, text: "Your inputs stay encrypted and private" },
];

const FAQ_ITEMS = [
  { q: "What is Rhetoric?", a: "Rhetoric is an AI-powered narrative builder for founders and operators. You paste in your raw thinking: notes, bullet points, a rough thesis. Rhetoric structures it into an investor-grade pitch narrative, board update, or strategy memo. It focuses on argument, not aesthetics." },
  { q: "Who is it for?", a: "Founders raising capital, preparing board decks, or aligning a team around strategy. If you need to make a case that holds up in serious rooms, Rhetoric is built for you." },
  { q: "What do I paste in to start?", a: "Anything that represents your current thinking: a paragraph about what your company does, bullet-point notes from a brainstorm, a rough draft of your thesis. Rhetoric works best when you bring the substance, even if it's messy." },
  { q: "What do I get out at the end?", a: "A complete material system: core narrative, elevator pitch, slide framework, investor Q&A, pitch emails, and investment memo. The AI Guide identifies gaps in your story and helps you strengthen each section." },
  { q: "How is this different from ChatGPT or a generic deck template?", a: "ChatGPT gives you text. Templates give you layout. Neither gives you argument structure. Rhetoric pressure-tests your thesis, identifies narrative gaps, researches competitors and market sizing for you, and builds the story arc that investors actually follow. It's opinionated by design." },
  { q: "Is my data secure?", a: "Your inputs are encrypted in transit and at rest. We never use your data to train AI models. Projects are stored in your account and deletable at any time. We process your content to generate outputs. That's it." },
];

const PLANS = [
  { name: FREE_PLAN.name, tierId: null as "hobby" | "pro" | null, description: FREE_PLAN.description, features: FREE_PLAN.features, cta: "Get Started", highlighted: false },
  { name: TIERS.hobby.name, tierId: "hobby" as const, description: TIERS.hobby.description, features: TIERS.hobby.features, cta: "Choose Hobby", highlighted: false },
  { name: TIERS.pro.name, tierId: "pro" as const, description: TIERS.pro.description, features: TIERS.pro.features, cta: "Get Pro", highlighted: true },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const getPrice = (plan: typeof PLANS[0]) => {
    if (!plan.tierId) return "$0";
    const tier = TIERS[plan.tierId];
    return `$${annual ? tier.annualMonthlyPrice : tier.monthlyPrice}`;
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative px-4 sm:px-6 pt-24 sm:pt-32 pb-8 sm:pb-10 overflow-hidden">
        {/* Subtle warm radial background */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, hsl(36 30% 92%) 0%, transparent 70%)" }} />
        <div className="max-w-[800px] mx-auto text-center relative z-10 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6">
            Craft your narrative.
          </h1>
          <p className="text-lg text-muted-foreground max-w-[640px] mx-auto leading-relaxed mb-10">
            Turn rough notes into pitch decks, board updates, and strategy memos.
          </p>
          <button onClick={() => navigate("/auth?signup=true&next=/dashboard")}
            className="bg-primary text-primary-foreground px-8 py-4 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            Start Free <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Hero product preview */}
        <div className="max-w-[900px] mx-auto mt-10 sm:mt-16 relative z-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="bg-card border border-border/80 rounded-xl overflow-hidden" style={{ boxShadow: "0 4px 32px -8px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
              </div>
              <span className="text-[9px] text-muted-foreground/50 tracking-wider uppercase">Example Output</span>
              <div />
            </div>
            <div className="p-4 sm:p-8">
              {/* Elevator pitch */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-foreground/70">Elevator Pitch</span>
                <span className="text-[10px] text-emerald font-semibold px-1.5 py-0.5 bg-emerald/10 border border-emerald/20 rounded-md">Ready to Send</span>
              </div>
              <p className="text-[13px] text-foreground/80 leading-relaxed mt-4">
                Sales teams waste 15 hours a week on meeting coordination. Relay automates the entire scheduling workflow, from availability to follow-up, so reps spend time selling instead of scheduling. We're live with 40 teams, growing 34% quarter over quarter, with 128% net revenue retention.
              </p>
              <div className="mt-4 bg-amber-50 border border-amber-200/60 rounded-lg p-3 flex items-start gap-3">
                <div className="text-amber-600 mt-0.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-foreground/80">Consider adding a specific customer win to make the traction claim more concrete.</p>
                </div>
              </div>

              {/* Slide framework */}
              <div className="border-t border-border/60 mt-6 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-foreground/70">Slide Framework</span>
                  <span className="text-[10px] text-emerald font-semibold px-1.5 py-0.5 bg-emerald/10 border border-emerald/20 rounded-md">Ready</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px]">
                  {[
                    { label: "Cover Slide", title: "Relay Pre-Seed Pitch" },
                    { label: "Key Metrics", title: "Traction & Unit Economics" },
                    { label: "Landscape", title: "Competitive Position" },
                  ].map((slide) => (
                    <div key={slide.label} className="bg-secondary/70 border border-border/60 rounded-xl overflow-hidden sm:[aspect-ratio:16/10]">
                      <div className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4">
                        <div>
                          <p className="text-[8px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">{slide.label}</p>
                          <p className="text-[13px] font-semibold text-foreground mt-2">{slide.title}</p>
                        </div>
                        <div className="space-y-1 select-none opacity-20">
                          <div className="h-1.5 bg-foreground/20 rounded-md w-[70%]" />
                          <div className="h-1.5 bg-foreground/20 rounded-md w-[50%]" />
                        </div>
                      </div>
                    </div>
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
      <section className="px-4 sm:px-6 py-8 sm:py-10 border-y border-border/50">
        <div className="max-w-[680px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-10 sm:gap-y-3">
          {PROOF.map((p) => (
            <div key={p.text} className="flex items-center gap-2.5">
              <p.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-foreground/70 text-sm">{p.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Start free. Scale when ready.</h2>
          </div>
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)}
              className={`relative w-11 h-6 rounded-full border transition-colors ${annual ? "bg-primary/20 border-primary/30" : "bg-card border-border"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${annual ? "left-[22px] bg-primary" : "left-0.5 bg-foreground"}`} />
            </button>
            <span className={`text-sm ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual <span className="text-xs text-primary ml-1">Save 20%</span>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md md:max-w-none mx-auto w-full">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`bg-card border rounded-xl p-8 flex flex-col transition-all hover:-translate-y-0.5 ${
                plan.highlighted ? "border-primary/30" : "border-border hover:border-muted-foreground/20"
              }`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-4">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-foreground">{getPrice(plan)}</span>
                  {plan.tierId && <span className="text-sm text-muted-foreground">/mo</span>}
                </div>
                {plan.tierId && annual && (
                  <p className="text-[11px] text-primary mb-2">Billed ${TIERS[plan.tierId].annualYearlyPrice}/year</p>
                )}
                <p className="text-sm text-foreground/70 mb-8">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-foreground/85 flex items-start gap-2.5">
                      <Check className="h-3.5 w-3.5 text-emerald mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate("/auth?signup=true&next=/dashboard")}
                  className={`w-full py-3 text-sm font-medium rounded-lg transition-opacity ${
                    plan.highlighted ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border text-foreground hover:border-muted-foreground/30"
                  }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 sm:px-6 py-14 sm:py-20 border-t border-border/50">
        <div className="max-w-[700px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Frequently asked questions</p>
          </div>
          <Accordion type="single" collapsible className="space-y-1.5">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/60 rounded-lg px-5 bg-card/50">
                <AccordionTrigger className="text-sm text-foreground/90 hover:no-underline py-4 text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/70 leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-center mt-6">
            <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground/80 transition-colors inline-flex items-center gap-1.5">
              More questions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}