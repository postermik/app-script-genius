import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const POSTS = [
  {
    slug: "what-investors-look-for-in-a-seed-memo",
    title: "What investors look for in a seed memo",
    description: "The six sections every seed-stage investment memo needs, and why most founders get the structure wrong.",
    date: "March 2026",
    readTime: "5 min read",
  },
  {
    slug: "how-to-write-a-pitch-email-to-vcs",
    title: "How to write a pitch email to VCs",
    description: "The cold outreach email that gets replies. What to include, what to cut, and why specificity beats polish.",
    date: "March 2026",
    readTime: "4 min read",
  },
  {
    slug: "fundraising-narrative-vs-pitch-deck",
    title: "Fundraising narrative vs pitch deck: which comes first?",
    description: "Why starting with slides is backwards, and how building the narrative first makes every document stronger.",
    date: "March 2026",
    readTime: "5 min read",
  },
];

export default function Blog() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Blog | Rhetoric";
  }, []);

  return (
    <div className="flex-1 px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-24">
      <div className="max-w-[680px] mx-auto">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
          Thinking about fundraising
        </h1>
        <p className="text-sm text-muted-foreground mb-14 max-w-[480px]">
          Practical advice on building narratives, raising capital, and communicating with investors.
        </p>
        <div className="space-y-0">
          {POSTS.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`}
              className="block border-b border-border/30 py-7 first:pt-0 group">
              <h2 className="text-[17px] font-semibold text-foreground group-hover:text-electric transition-colors mb-2">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground/70 leading-relaxed mb-3">
                {post.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/40">
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}