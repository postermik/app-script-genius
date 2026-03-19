import { useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SEOPageProps {
  title: string;
  description: string;
  headline: string;
  subheadline: string;
  children: React.ReactNode;
  features?: string[];
}

export function SEOPageLayout({ title, description, headline, subheadline, children, features }: SEOPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${title} | Rhetoric`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);
  }, [title, description]);

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="max-w-[720px] mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-[1.1] tracking-tight mb-5">
            {headline}
          </h1>
          <p className="text-lg text-foreground/80 leading-relaxed mb-8 max-w-[600px]">
            {subheadline}
          </p>
          <button onClick={() => navigate("/auth?signup=true&next=/dashboard")}
            className="bg-primary text-primary-foreground px-7 py-3.5 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 glow-blue">
            Try it free <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Body content */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-[720px] mx-auto">
          {children}
        </div>
      </section>

      {/* Features list if provided */}
      {features && features.length > 0 && (
        <section className="px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="max-w-[720px] mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-6">What you get</h2>
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="text-sm text-foreground/80 flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-electric mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="max-w-[720px] mx-auto text-center">
          <p className="text-lg font-semibold text-foreground mb-3">Ready to start?</p>
          <p className="text-sm text-muted-foreground mb-6">Free to try. No credit card required.</p>
          <button onClick={() => navigate("/auth?signup=true&next=/dashboard")}
            className="bg-primary text-primary-foreground px-7 py-3.5 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 glow-blue">
            Start free <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}