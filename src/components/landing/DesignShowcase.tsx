import { useEffect, useRef, useState } from "react";

/* ── Dot field background (unique from hero constellation) ── */
function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const dots: { x: number; y: number; r: number; phase: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
      dots.length = 0;
      const spacing = 40;
      for (let x = 0; x < canvas.offsetWidth; x += spacing) {
        for (let y = 0; y < canvas.offsetHeight; y += spacing) {
          dots.push({ x, y, r: 0.6 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2 });
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      dots.forEach((d) => {
        const alpha = 0.08 + Math.sin(t * 0.001 + d.phase) * 0.04;
        ctx.fillStyle = `hsla(217, 91%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ── Slide 1: KPI Traction ── */
function KPISlide() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const points = [28, 24, 30, 22, 18, 20, 14, 16, 10, 8, 12, 6];
  const w = 200, h = 50;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${p}`)
    .join(" ");

  return (
    <div ref={ref} className="slide-card group">
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/30 p-6 flex flex-col justify-between">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />

        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-electric/[0.08] blur-3xl" />

        <div className="relative z-10">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60 mb-1">Annual Recurring Revenue</p>
          <p className={`text-4xl font-bold text-foreground tracking-tight transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            $1.8M
          </p>
        </div>

        <div className="relative z-10 flex items-end justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground/50">QoQ</p>
              <p className={`text-sm font-semibold text-emerald transition-all duration-700 delay-200 ${visible ? "opacity-100" : "opacity-0"}`}>+34%</p>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground/50">NRR</p>
              <p className={`text-sm font-semibold text-foreground/80 transition-all duration-700 delay-300 ${visible ? "opacity-100" : "opacity-0"}`}>128%</p>
            </div>
          </div>

          <svg width={w / 2} height={h / 2} viewBox={`0 0 ${w} ${h}`} className={`text-electric transition-all duration-1000 delay-500 ${visible ? "opacity-40" : "opacity-0"}`}>
            <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <SlideLabel type="Headline + KPI" subtitle="Series A Traction" />
    </div>
  );
}

/* ── Slide 2: Pull Quote ── */
function QuoteSlide() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="slide-card group">
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-card via-secondary/20 to-card p-6 flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 20px, hsl(var(--foreground)) 20px, hsl(var(--foreground)) 21px)"
        }} />

        <span className={`text-7xl font-serif leading-none text-electric/15 mb-2 transition-all duration-700 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          &ldquo;
        </span>
        <p className={`text-[13px] font-medium text-foreground/90 leading-relaxed max-w-[85%] italic transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          The bottleneck in drug development isn&apos;t science. It&apos;s patient access.
        </p>
      </div>
      <SlideLabel type="Pull Quote" subtitle="Core Insight Slide" />
    </div>
  );
}

/* ── Slide 3: Framework Matrix ── */
function FrameworkSlide() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="slide-card group">
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/20 p-5 flex flex-col">
        <p className={`text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/50 mb-auto transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          Competitive Positioning
        </p>

        <div className={`relative flex-1 flex items-center justify-center transition-all duration-700 delay-150 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="absolute left-1/2 top-[12%] bottom-[12%] w-px bg-border/60" />
          <div className="absolute top-1/2 left-[8%] right-[8%] h-px bg-border/60" />

          <span className="absolute top-[6%] left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground/40 tracking-wider uppercase">Differentiation</span>
          <span className="absolute bottom-[4%] left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground/30 tracking-wider uppercase">Commodity</span>
          <span className="absolute left-[2%] top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground/30 tracking-wider uppercase rotate-[-90deg] origin-center">Niche</span>
          <span className="absolute right-[2%] top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground/40 tracking-wider uppercase rotate-90 origin-center">Scale</span>

          <div className="absolute top-[12%] right-[8%] w-[42%] h-[38%] bg-electric/[0.06] rounded-sm" />

          <div className="absolute top-[28%] left-[22%] w-2 h-2 rounded-full bg-muted-foreground/20" />
          <div className="absolute top-[55%] right-[28%] w-2 h-2 rounded-full bg-muted-foreground/20" />
          <div className="absolute bottom-[25%] left-[35%] w-2 h-2 rounded-full bg-muted-foreground/20" />

          <div className={`absolute top-[22%] right-[22%] transition-all duration-700 delay-400 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
            <div className="w-3 h-3 rounded-full bg-electric shadow-[0_0_12px_2px_hsl(217_91%_60%/0.4)]" />
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-semibold text-electric whitespace-nowrap">You</span>
          </div>
        </div>
      </div>
      <SlideLabel type="Framework" subtitle="Competitive Positioning Matrix" />
    </div>
  );
}

/* ── Shared slide label ── */
function SlideLabel({ type, subtitle }: { type: string; subtitle: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground/70">{type}</p>
      <p className="text-[11px] text-muted-foreground/40 mt-0.5">{subtitle}</p>
    </div>
  );
}

/* ── Main Section ── */
export function DesignShowcase() {
  return (
    <section className="relative px-6 py-28 overflow-hidden">
      <DotField />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-electric/[0.03] blur-[100px] pointer-events-none" />

      <div className="max-w-[1100px] mx-auto relative z-10">
        <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-electric/70 mb-4">Design-Aware Output</p>
        <h2 className="text-4xl font-bold text-foreground mb-20 tracking-tight">Every slide has visual intent.</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <KPISlide />
          <QuoteSlide />
          <FrameworkSlide />
        </div>
      </div>
    </section>
  );
}
