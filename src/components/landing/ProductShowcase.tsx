import { useEffect, useRef, useState } from "react";

function AnimatedEntry({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

/* ── Generation Experience ── */
function GenerationPreview() {
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let p = 0;
        const iv = setInterval(() => {
          p += 2;
          setProgress(Math.min(p, 100));
          if (p >= 100) clearInterval(iv);
        }, 40);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-card/80 border border-border rounded-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Generating narrative…</span>
        <span className="text-xs text-electric font-medium">{progress}%</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-electric rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="space-y-2">
          {["Analyzing market positioning…", "Building investment thesis…", "Structuring slide framework…", "Generating pitch script…"].map((step, i) => (
            <p key={step} className={`text-xs transition-all duration-500 ${progress > i * 25 ? "text-foreground/85" : "text-muted-foreground/40"}`}>
              {progress > (i + 1) * 25 ? "✓" : progress > i * 25 ? "→" : "○"} {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Readiness Score ── */
function ReadinessPreview() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const categories = [
    { label: "Thesis Clarity", score: 92 },
    { label: "Market Sizing", score: 78 },
    { label: "Team Credibility", score: 85 },
    { label: "Traction Evidence", score: 70 },
  ];

  return (
    <div ref={ref} className="bg-card/80 border border-border rounded-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Readiness Coaching</span>
      </div>
      <div className="p-5 space-y-4">
        {categories.map((c, i) => (
          <div key={c.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-foreground/85">{c.label}</span>
              <span className={`text-xs font-medium transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"} ${c.score >= 85 ? "text-emerald" : c.score >= 75 ? "text-electric" : "text-yellow-400"}`} style={{ transitionDelay: `${i * 150}ms` }}>
                {c.score}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${c.score >= 85 ? "bg-emerald" : c.score >= 75 ? "bg-electric" : "bg-yellow-400"}`}
                style={{ width: visible ? `${c.score}%` : "0%", transitionDelay: `${i * 150}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slide Preview ── */
function SlidePreviewCard() {
  return (
    <div className="bg-card/80 border border-border rounded-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Slide Preview</span>
        <div className="flex gap-1.5">
          {["Dark", "Light", "Minimal"].map((t) => (
            <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${t === "Dark" ? "border-electric/40 text-electric" : "border-border text-muted-foreground/50"}`}>{t}</span>
          ))}
        </div>
      </div>
      <div className="aspect-[16/10] bg-gradient-to-br from-card via-card to-secondary/30 p-6 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        <div className="relative z-10">
          <p className="text-[9px] font-medium tracking-[0.12em] uppercase text-muted-foreground/60 mb-1">Annual Recurring Revenue</p>
          <p className="text-3xl font-bold text-white tracking-tight">$1.8M</p>
        </div>
        <div className="relative z-10 flex gap-6">
          <div>
            <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground/50">QoQ</p>
            <p className="text-sm font-semibold text-emerald">+34%</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground/50">NRR</p>
            <p className="text-sm font-semibold text-foreground/80">128%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Investor Discovery ── */
function InvestorPreview() {
  const investors = [
    { name: "Sequoia Capital", match: 94, stage: "Series A", sector: "AI / ML" },
    { name: "Andreessen Horowitz", match: 91, stage: "Series A-B", sector: "Enterprise SaaS" },
    { name: "Founders Fund", match: 87, stage: "Seed–A", sector: "Deep Tech" },
  ];

  return (
    <div className="bg-card/80 border border-border rounded-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Investor Discovery</span>
      </div>
      <div className="divide-y divide-border">
        {investors.map((inv) => (
          <div key={inv.name} className="px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/90 font-medium">{inv.name}</p>
              <p className="text-[11px] text-muted-foreground">{inv.stage} · {inv.sector}</p>
            </div>
            <span className="text-xs font-medium text-electric">{inv.match}% match</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Showcase ── */
export function ProductShowcase() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-[1000px] mx-auto space-y-24">
        {/* Row 1: Generation + Readiness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedEntry>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-electric mb-4">Prompt → Output</p>
            <GenerationPreview />
          </AnimatedEntry>
          <AnimatedEntry className="md:mt-12">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-electric mb-4">Coaching & Scoring</p>
            <ReadinessPreview />
          </AnimatedEntry>
        </div>

        {/* Row 2: Slides + Discovery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedEntry>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-electric mb-4">Design-Aware Slides</p>
            <SlidePreviewCard />
          </AnimatedEntry>
          <AnimatedEntry className="md:mt-12">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-electric mb-4">Find Your Investors</p>
            <InvestorPreview />
          </AnimatedEntry>
        </div>
      </div>
    </section>
  );
}
