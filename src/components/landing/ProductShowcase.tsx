import { useEffect, useRef, useState } from "react";

/* ── Scroll-triggered fade-in ── */
function AnimatedEntry({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[600ms] ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[20px]"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Generation Experience (animated progress bar) ── */
function GenerationPreview() {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const STEPS = [
    "Analyzing your input",
    "Structuring argument",
    "Writing sections",
    "Reviewing quality",
  ];

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let p = 0;
        const iv = setInterval(() => {
          p += 2;
          setProgress(Math.min(p, 100));
          if (p <= 25) setActiveStep(0);
          else if (p <= 55) setActiveStep(1);
          else if (p <= 80) setActiveStep(2);
          else setActiveStep(3);
          if (p >= 100) {
            clearInterval(iv);
            // After a short delay, mark final step as done
            setTimeout(() => setAllDone(true), 1500);
          }
        }, 60);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-[hsl(222_47%_6%)] border border-[hsl(217_33%_15%)] rounded-[10px] overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium tracking-[0.12em] uppercase text-foreground/90">
            Generating narrative…
          </span>
          <span className="text-xs font-bold text-electric tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-electric rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="space-y-1.5 pt-1">
          {STEPS.map((step, i) => {
            const done = allDone ? true : i < activeStep;
            const active = !allDone && i === activeStep;
            if (!allDone && i > activeStep) return null;
            return (
              <p key={step} className={`text-xs transition-all duration-300 ${done ? "text-emerald" : active ? "text-foreground/70" : "text-muted-foreground"}`}>
                {done ? "✓" : "→"} {step}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Coaching Preview ── */
function ReadinessPreview() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const categories = [
    { label: "Clarity", score: 92 },
    { label: "Structure", score: 85 },
    { label: "Specificity", score: 78 },
    { label: "Persuasion", score: 70 },
  ];

  return (
    <div ref={ref} className="bg-[hsl(222_47%_6%)] border border-[hsl(217_33%_15%)] rounded-[10px] overflow-hidden">
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

/* ── Sparkline ── */
function RevenueSparkline() {
  const points = [20, 28, 25, 38, 42, 55, 60, 72, 68, 85, 95, 100];
  const w = 280, h = 80, px = 0, py = 4;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points.map((v, i) => {
    const x = px + (i / (points.length - 1)) * (w - 2 * px);
    const y = py + (1 - (v - min) / (max - min)) * (h - 2 * py);
    return `${x},${y}`;
  });
  const line = `M${coords.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(155 60% 45%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(155 60% 45%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={line} fill="none" stroke="hsl(155 60% 45%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Format Tabs + Chart ── */
function FormatChartCard() {
  const TABS = ["Memo", "Pitch Deck", "Board Update", "Investor Email"];
  const ACTIVE = "Pitch Deck";

  return (
    <div className="bg-[hsl(222_47%_6%)] border border-[hsl(217_33%_15%)] rounded-[10px] overflow-hidden">
      {/* Tab bar, static, non-interactive */}
      <div className="flex w-full border-b border-[hsl(217_33%_15%)] sm:overflow-visible overflow-x-auto">
        {TABS.map((tab) => (
          <span
            key={tab}
            className={`font-mono text-[10px] sm:text-[11px] font-medium tracking-[0.08em] uppercase px-[14px] sm:px-[18px] py-[14px] whitespace-nowrap relative select-none ${
              tab === ACTIVE
                ? "text-foreground/90 bg-[hsla(217,90%,54%,0.06)]"
                : "text-[hsl(215_20%_44%)]"
            }`}
          >
            {tab}
            {tab === ACTIVE && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-electric" />
            )}
          </span>
        ))}
      </div>
      {/* Chart content */}
      <div className="bg-gradient-to-br from-card via-card to-secondary/30 p-6 flex flex-col justify-between relative overflow-hidden" style={{ minHeight: 220 }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        <div className="relative z-10">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-foreground/70">Annual Recurring Revenue</p>
          <p className="text-3xl font-bold text-foreground tracking-tight mt-1">$1.8M</p>
        </div>
        <div className="relative z-10 flex-1 my-4">
          <RevenueSparkline />
        </div>
        <div className="relative z-10 flex gap-8">
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-foreground/50">QoQ</p>
            <p className="text-base font-bold text-emerald">+34%</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-foreground/50">NRR</p>
            <p className="text-base font-bold text-foreground">128%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Presentation-Ready Slides ── */
export function PresentationSlides() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px]">
      {/* Slide 1: Cover */}
      <AnimatedEntry delay={0}>
        <div className="bg-[hsl(222_47%_6%)] border border-[hsl(217_33%_15%)] rounded-[10px] overflow-hidden transition-all duration-200 hover:border-electric hover:-translate-y-[3px] sm:[aspect-ratio:16/10]">
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4">
            <div>
              <p className="font-mono text-[8px] font-semibold tracking-[0.15em] uppercase text-[hsl(215_20%_44%)]">Cover Slide</p>
              <p className="text-sm font-semibold text-foreground mt-2">Relay Pre-Seed Pitch</p>
            </div>
            <div>
              <div className="w-8 h-[2px] bg-electric mb-2" />
              <p className="text-[11px] text-[hsl(215_20%_44%)]">Relay · 2026</p>
              <p className="text-[9px] text-[hsl(215_20%_44%)]/70">Confidential</p>
            </div>
          </div>
        </div>
      </AnimatedEntry>

      {/* Slide 2: Key Metrics */}
      <AnimatedEntry delay={100}>
        <div className="bg-[hsl(222_47%_6%)] border border-[hsl(217_33%_15%)] rounded-[10px] overflow-hidden transition-all duration-200 hover:border-electric hover:-translate-y-[3px] sm:[aspect-ratio:16/10]">
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4">
            <div>
              <p className="font-mono text-[8px] font-semibold tracking-[0.15em] uppercase text-[hsl(215_20%_44%)]">Key Metrics</p>
              <p className="text-sm font-semibold text-foreground mt-2">Traction & Unit Economics</p>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="min-w-0">
                <p className="font-mono text-sm sm:text-base font-bold text-foreground truncate">$1.8M</p>
                <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[hsl(215_20%_44%)]">ARR</p>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-sm sm:text-base font-bold text-emerald truncate">+34%</p>
                <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[hsl(215_20%_44%)]">QoQ</p>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-sm sm:text-base font-bold text-foreground truncate">128%</p>
                <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[hsl(215_20%_44%)]">NRR</p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedEntry>

      {/* Slide 3: Competitive Landscape */}
      <AnimatedEntry delay={200}>
        <div className="bg-[hsl(222_47%_6%)] border border-[hsl(217_33%_15%)] rounded-[10px] overflow-hidden transition-all duration-200 hover:border-electric hover:-translate-y-[3px] sm:[aspect-ratio:16/10]">
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full gap-4">
            <div>
              <p className="font-mono text-[8px] font-semibold tracking-[0.15em] uppercase text-[hsl(215_20%_44%)]">Landscape</p>
              <p className="text-sm font-semibold text-foreground mt-2">Competitive Position</p>
            </div>
            <div className="relative w-full" style={{ height: 80 }}>
              <div className="absolute inset-0 border-l border-b border-[hsl(217_33%_15%)]">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/[0.03]" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-foreground/[0.03]" />
                <div className="absolute w-2 h-2 rounded-full bg-[hsl(215_20%_44%)]" style={{ left: "20%", top: "65%" }} />
                <div className="absolute w-2 h-2 rounded-full bg-[hsl(215_20%_44%)]" style={{ left: "35%", top: "45%" }} />
                <div className="absolute w-2 h-2 rounded-full bg-[hsl(215_20%_44%)]" style={{ left: "50%", top: "70%" }} />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-electric" style={{ left: "75%", top: "20%", boxShadow: "0 0 8px hsla(217, 90%, 54%, 0.4)" }} />
              </div>
            </div>
            <div className="flex justify-between">
              <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[hsl(215_20%_44%)]/70">Low automation</p>
              <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-[hsl(215_20%_44%)]/70">High automation</p>
            </div>
          </div>
        </div>
      </AnimatedEntry>
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
    <div className="bg-[hsl(222_47%_6%)] border border-[hsl(217_33%_15%)] rounded-[10px] overflow-hidden">
      <div className="divide-y divide-[hsl(217_33%_15%)]/50">
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
    <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-16 sm:pb-24 overflow-hidden">
      <div className="max-w-[1000px] mx-auto">
        {/* Panel 1: Left, Prompt to Output */}
        <div className="md:w-[52%] md:ml-[5%]">
          <AnimatedEntry>
            <p className="text-xs font-mono font-semibold tracking-[0.18em] uppercase text-electric mb-4">Prompt → Output</p>
            <GenerationPreview />
          </AnimatedEntry>
        </div>

        {/* Panel 2: Right, Built-in Coaching */}
        <div className="md:w-[52%] md:ml-[43%] md:mt-[60px] mt-10">
          <AnimatedEntry>
            <p className="text-xs font-mono font-semibold tracking-[0.18em] uppercase text-electric mb-4">Built-in Coaching</p>
            <ReadinessPreview />
          </AnimatedEntry>
        </div>

        {/* Panel 3: Left, Every Format */}
        <div className="md:w-[52%] md:ml-[5%] md:mt-[60px] mt-10">
          <AnimatedEntry>
            <p className="text-xs font-mono font-semibold tracking-[0.18em] uppercase text-electric mb-4">Every Format, Ready to Use</p>
            <FormatChartCard />
          </AnimatedEntry>
        </div>

        {/* Panel 4: Right, Investors */}
        <div className="md:w-[52%] md:ml-[43%] md:mt-[60px] mt-10">
          <AnimatedEntry>
            <p className="text-xs font-mono font-semibold tracking-[0.18em] uppercase text-electric mb-4">Find Your Investors</p>
            <InvestorPreview />
          </AnimatedEntry>
        </div>
      </div>
    </section>
  );
}
