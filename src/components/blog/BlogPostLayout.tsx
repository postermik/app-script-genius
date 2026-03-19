import { useEffect } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface BlogPostProps {
  title: string;
  description: string;
  date: string;
  readTime: string;
  children: React.ReactNode;
}

export function BlogPostLayout({ title, description, date, readTime, children }: BlogPostProps) {
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
      <article className="px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-24">
        <div className="max-w-[680px] mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors mb-8">
            <ArrowLeft className="h-3 w-3" /> All posts
          </Link>
          <header className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-[1.2] tracking-tight mb-3">
              {title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
              <span>{date}</span>
              <span>·</span>
              <span>{readTime}</span>
            </div>
          </header>
          <div className="prose-rhetoric">
            {children}
          </div>
        </div>
      </article>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="max-w-[680px] mx-auto border-t border-border/40 pt-10">
          <p className="text-sm text-foreground/80 mb-1">Build your fundraising materials with Rhetoric.</p>
          <p className="text-xs text-muted-foreground/50 mb-5">Free to start. No credit card required.</p>
          <button onClick={() => navigate("/auth?signup=true&next=/dashboard")}
            className="bg-primary text-primary-foreground px-6 py-3 text-xs font-medium rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 glow-blue">
            Try it free <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}