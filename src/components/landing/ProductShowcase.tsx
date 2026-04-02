import { useEffect, useRef, useState } from "react";
import { Sparkles, AlertTriangle, FileText, BarChart3, Mail } from "lucide-react";

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
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-secondary/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[9px] text-muted-foreground/50 tracking-wider uppercase">Built-in Consultant</span>
        <div />
      </div>
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
        <div className="bg-secondary/60 rounded-lg p-3 flex items-start gap-2.5">
          <Sparkles className="h-3.5 w-3.5 text-electric shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground/70 leading-relaxed">
            "Name your competitors. Investors will ask. Frame it as 'here's why existing solutions fall short' to control the narrative."
          </p>
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
    { name: "First Round Capital", match: 84, stage: "Seed", sector: "B2B SaaS" },
  ];
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-secondary/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[9px] text-muted-foreground/50 tracking-wider uppercase">Find Your Investors</span>
        <div />
      </div>
      <div className="divide-y divide-border">
        {investors.map((inv) => (
          <div key={inv.name} className="px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-foreground/90 font-medium">{inv.name}</p>
              <p className="text-[11px] text-muted-foreground">{inv.stage} · {inv.sector}</p>
            </div>
            <span className="text-[11px] font-medium text-electric">{inv.match}% match</span>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 flex gap-2.5 border-t border-border">
        <button className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          View contact info
        </button>
        <button className="flex-1 border border-border text-foreground text-xs font-medium py-2.5 rounded-lg hover:border-muted-foreground/30 transition-colors">
          Export list
        </button>
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
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-secondary/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[9px] text-muted-foreground/50 tracking-wider uppercase">Every Format</span>
        <div />
      </div>
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

/* ── Keep It Sharp (post-raise retention) ── */
function RetentionPreview() {
  const modes = [
    { icon: FileText, title: "Board Updates", desc: "Monthly updates powered by your latest metrics and strategy" },
    { icon: BarChart3, title: "Sales Decks", desc: "Customer-facing materials built from your core narrative" },
    { icon: Mail, title: "Strategy Memos", desc: "Internal docs that keep your team aligned on the vision" },
  ];
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-secondary/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[9px] text-muted-foreground/50 tracking-wider uppercase">Beyond the Raise</span>
        <div />
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-2.5">
          {modes.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-secondary/60 rounded-lg p-4 text-center hover:-translate-y-0.5 transition-transform">
              <Icon className="h-5 w-5 text-electric mx-auto mb-2.5" />
              <p className="text-[11px] font-semibold text-foreground/90 mb-1">{title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-secondary/60 rounded-lg p-3 flex items-start gap-2.5 mt-4">
          <Sparkles className="h-3.5 w-3.5 text-electric shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground/70 leading-relaxed">
            Your narrative evolves. Rhetoric remembers your story and adapts every output as things change.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Step Row ── */
function StepRow({
  number,
  title,
  description,
  children,
  reverse = false,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <AnimatedEntry>
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${reverse ? "md:[direction:rtl]" : ""}`}>
        <div className={reverse ? "md:[direction:ltr]" : ""}>
          <span className="font-display text-[56px] leading-none text-border/80 select-none">{number}</span>
          <h3 className="font-display text-2xl sm:text-[28px] font-medium text-foreground tracking-tight mt-2 mb-3">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[420px]">{description}</p>
        </div>
        <div className={reverse ? "md:[direction:ltr]" : ""}>{children}</div>
      </div>
    </AnimatedEntry>
  );
}

/* ── Main Showcase ── */
export function ProductShowcase() {
  return (
    <section className="px-4 sm:px-6 pt-8 sm:pt-16 pb-14 sm:pb-24 overflow-hidden">
      <div className="max-w-[1060px] mx-auto">
        {/* Section header */}
        <AnimatedEntry className="text-center mb-16 sm:mb-20">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-3">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-foreground tracking-tight">Raise, then run.</h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-[480px] mx-auto leading-relaxed">
            Rhetoric guides you from raw idea to closed round, then stays with you as your company grows.
          </p>
        </AnimatedEntry>

        <div className="space-y-16 sm:space-y-24">
          {/* 01 — Build your narrative */}
          <StepRow
            number="01"
            title="Build your narrative"
            description="Paste in your rough notes, a previous deck, or just talk about your company. Rhetoric analyzes your story, identifies gaps investors will probe, and builds a structured narrative across every section of your pitch."
          >
            <ConsultantPreview />
          </StepRow>

          {/* 02 — Find your investors */}
          <StepRow
            number="02"
            title="Find your investors"
            description="Rhetoric matches you to investors based on your stage, sector, geography, and check size. See match scores, access contact info, and build a targeted outreach list without spreadsheet wrangling."
            reverse
          >
            <InvestorPreview />
          </StepRow>

          {/* 03 — Export everything */}
          <StepRow
            number="03"
            title="Export everything"
            description="One narrative, every format. Rhetoric generates pitch decks, investor memos, board updates, and cold emails from a single source of truth. Edit inline, then export to PPTX, DOCX, or PDF in one click."
          >
            <FormatChartCard />
          </StepRow>

          {/* 04 — Keep it sharp */}
          <StepRow
            number="04"
            title="Keep it sharp"
            description="After you raise, the work continues. Use Rhetoric for board updates, strategy memos, and sales materials that stay connected to what you've already built. When it's time to raise again, everything is already current."
            reverse
          >
            <RetentionPreview />
          </StepRow>
        </div>
      </div>
    </section>
  );
}