import { useEffect, useRef, useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";

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
    <div ref={ref} className={`transition-all duration-[600ms] ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[20px]"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Generation Experience ── */
function GenerationPreview() {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const STEPS = ["Analyzing your input", "Structuring argument", "Writing sections", "Reviewing quality"];

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let p = 0;
        const iv = setInterval(() => {
          p += 2; setProgress(Math.min(p, 100));
          if (p <= 25) setActiveStep(0); else if (p <= 55) setActiveStep(1); else if (p <= 80) setActiveStep(2); else setActiveStep(3);
          if (p >= 100) { clearInterval(iv); setTimeout(() => setAllDone(true), 1500); }
        }, 60);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-foreground/90">Generating...</span>
          <span className="text-[10px] font-bold text-electric tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-electric rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
        <div className="space-y-1.5 pt-1">
          {STEPS.map((step, i) => {
            const done = allDone ? true : i < activeStep;
            const active = !allDone && i === activeStep;
            if (!allDone && i > activeStep) return null;
            return (<p key={step} className={`text-[11px] transition-all duration-300 ${done ? "text-emerald" : active ? "text-foreground/70" : "text-muted-foreground"}`}>{done ? "\u2713" : "\u2192"} {step}</p>);
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Consultant Preview ── */
function ConsultantPreview() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const cards: { label: string; state: "covered" | "strengthen" | "missing"; hint?: string }[] = [
    { label: "Problem", state: "covered" },
    { label: "Market", state: "covered" },
    { label: "Traction", state: "strengthen", hint: "Add growth metrics" },
    { label: "Differentiation", state: "missing", hint: "Name your competitors" },
  ];

  return (
    <div ref={ref} className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[10px] font-medium text-electric uppercase tracking-wider mb-2">Getting Sharp</p>
          <p className="text-[11px] text-foreground/70 leading-relaxed">
            Strong problem framing with real cost data. Add competitive positioning and growth metrics to close the gaps investors will surface.
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < 6 ? "bg-electric" : "bg-muted"
            }`} style={{ transitionDelay: visible ? `${i * 80}ms` : "0ms", opacity: visible ? 1 : 0 }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {cards.map((card, i) => {
            const borderColor = card.state === "covered" ? "border-l-emerald" : card.state === "strengthen" ? "border-l-amber-500" : "border-l-red-400";
            const bgColor = card.state === "covered" ? "bg-emerald/[0.04]" : card.state === "strengthen" ? "bg-amber-50" : "bg-red-50";
            const badgeColor = card.state === "covered" ? "bg-emerald/10 text-emerald" : card.state === "strengthen" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
            const badgeLabel = card.state === "covered" ? "Covered" : card.state === "strengthen" ? "Strengthen" : "Missing";
            return (
              <div key={card.label}
                className={`rounded-lg border border-border border-l-2 ${borderColor} ${bgColor} p-2.5 transition-all duration-500`}
                style={{ opacity: visible ? 1 : 0, transitionDelay: `${(i + 3) * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-semibold text-foreground/90">{card.label}</span>
                  <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${badgeColor}`}>{badgeLabel}</span>
                </div>
                {card.hint && (
                  <p className={`text-[9px] flex items-center gap-1 mt-1 ${card.state === "missing" ? "text-red-500" : "text-amber-600"}`}>
                    {card.state === "missing" ? <AlertTriangle className="h-2.5 w-2.5 shrink-0" /> : <Sparkles className="h-2.5 w-2.5 shrink-0" />}
                    {card.hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Sparkline ── */
function RevenueSparkline() {
  const points = [20, 28, 25, 38, 42, 55, 60, 72, 68, 85, 95, 100];
  const w = 280, h = 80, px = 0, py = 4;
  const max = Math.max(...points); const min = Math.min(...points);
  const coords = points.map((v, i) => { const x = px + (i / (points.length - 1)) * (w - 2 * px); const y = py + (1 - (v - min) / (max - min)) * (h - 2 * py); return `${x},${y}`; });
  const line = `M${coords.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(155 60% 45%)" stopOpacity="0.2" /><stop offset="100%" stopColor="hsl(155 60% 45%)" stopOpacity="0" /></linearGradient></defs>
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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex w-full border-b border-border sm:overflow-visible overflow-x-auto">
        {TABS.map((tab) => (
          <span key={tab} className={`text-[10px] font-medium tracking-[0.08em] uppercase px-[14px] sm:px-[18px] py-[14px] whitespace-nowrap relative select-none ${tab === ACTIVE ? "text-foreground/90 bg-secondary/50" : "text-muted-foreground"}`}>
            {tab}{tab === ACTIVE && <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-electric" />}
          </span>
        ))}
      </div>
      <div className="bg-card p-6 flex flex-col justify-between relative overflow-hidden" style={{ minHeight: 220 }}>
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10">
          <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground">Annual Recurring Revenue</p>
          <p className="text-3xl font-bold text-foreground tracking-tight mt-1">$1.8M</p>
        </div>
        <div className="relative z-10 flex-1 my-4"><RevenueSparkline /></div>
        <div className="relative z-10 flex gap-8">
          <div><p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">QoQ</p><p className="text-base font-bold text-emerald">+34%</p></div>
          <div><p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">NRR</p><p className="text-base font-bold text-foreground">128%</p></div>
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
    { name: "Founders Fund", match: 87, stage: "Seed-A", sector: "Deep Tech" },
  ];
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="divide-y divide-border">
        {investors.map((inv) => (
          <div key={inv.name} className="px-5 py-3.5 flex items-center justify-between">
            <div><p className="text-[13px] text-foreground/90 font-medium">{inv.name}</p><p className="text-[11px] text-muted-foreground">{inv.stage} · {inv.sector}</p></div>
            <span className="text-[11px] font-medium text-electric">{inv.match}% match</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Showcase ── */
export function ProductShowcase() {
  return (
    <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-14 sm:pb-20 overflow-hidden">
      <div className="max-w-[1000px] mx-auto">
        <div className="md:w-[52%] md:ml-[5%]">
          <AnimatedEntry>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-4">From notes to materials</p>
            <GenerationPreview />
          </AnimatedEntry>
        </div>
        <div className="md:w-[52%] md:ml-[43%] md:mt-[60px] mt-10">
          <AnimatedEntry>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-4">Built-in consultant</p>
            <ConsultantPreview />
          </AnimatedEntry>
        </div>
        <div className="md:w-[52%] md:ml-[5%] md:mt-[60px] mt-10">
          <AnimatedEntry>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-4">Every format, ready to use</p>
            <FormatChartCard />
          </AnimatedEntry>
        </div>
        <div className="md:w-[52%] md:ml-[43%] md:mt-[60px] mt-10">
          <AnimatedEntry>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-4">Find your investors</p>
            <InvestorPreview />
          </AnimatedEntry>
        </div>
      </div>
    </section>
  );
}