import { useEffect, useRef, useState } from "react";

/* ── Scroll-triggered fade-in ── */
function AnimatedEntry({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
      className={`transition-all duration-[600ms] ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[30px]"} ${className}`}
    >
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
          <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={line} fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
            <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${t === "Dark" ? "border-electric/40 text-electric" : "border-border text-foreground/50"}`}>{t}</span>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-card via-card to-secondary/30 p-6 flex flex-col justify-between relative overflow-hidden" style={{ minHeight: 220 }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        <div className="relative z-10">
          <p className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>Annual Recurring Revenue</p>
          <p className="text-3xl font-bold text-white tracking-tight mt-1">$1.8M</p>
        </div>
        <div className="relative z-10 flex-1 my-4">
          <RevenueSparkline />
        </div>
        <div className="relative z-10 flex gap-8">
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>QoQ</p>
            <p className="text-base font-bold" style={{ color: "#4ADE80" }}>+34%</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>NRR</p>
            <p className="text-base font-bold text-white">128%</p>
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
      <div className="divide-y divide-border/50">
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

/* ── Diagonal connector line (SVG) ── */
function DiagonalConnector({ direction }: { direction: "left-to-right" | "right-to-left" }) {
  const isLR = direction === "left-to-right";
  return (
    <div className="hidden md:block relative h-5 w-full pointer-events-none" aria-hidden>
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <line
          x1={isLR ? "30%" : "70%"}
          y1="0"
          x2={isLR ? "50%" : "50%"}
          y2="100%"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="6 4"
        />
      </svg>
    </div>
  );
}

/* ── Main Showcase ── */
export function ProductShowcase() {
  return (
    <section className="px-6 py-24 overflow-hidden">
      <div className="max-w-[1000px] mx-auto">
        {/* Panel 1: Left */}
        <div className="md:w-[52%] md:ml-[5%]">
          <AnimatedEntry>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-electric mb-4">Prompt → Output</p>
            <GenerationPreview />
          </AnimatedEntry>
        </div>

        <DiagonalConnector direction="left-to-right" />

        {/* Panel 2: Right, offset down */}
        <div className="md:w-[52%] md:ml-[43%] md:mt-[40px] mt-8">
          <AnimatedEntry>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-electric mb-4">Coaching & Scoring</p>
            <ReadinessPreview />
          </AnimatedEntry>
        </div>

        <DiagonalConnector direction="right-to-left" />

        {/* Panel 3: Left */}
        <div className="md:w-[52%] md:ml-[5%] md:-mt-4 mt-8">
          <AnimatedEntry>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-electric mb-4">Design-Aware Slides</p>
            <SlidePreviewCard />
          </AnimatedEntry>
        </div>

        <DiagonalConnector direction="left-to-right" />

        {/* Panel 4: Right, offset down */}
        <div className="md:w-[52%] md:ml-[43%] md:mt-[40px] mt-8">
          <AnimatedEntry>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-electric mb-4">Find Your Investors</p>
            <InvestorPreview />
          </AnimatedEntry>
        </div>
      </div>
    </section>
  );
}
