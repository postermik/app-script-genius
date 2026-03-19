import { BlogPostLayout } from "@/components/blog/BlogPostLayout";

export default function SeedMemoPost() {
  return (
    <BlogPostLayout
      title="What investors look for in a seed memo"
      description="The six sections every seed-stage investment memo needs, and why most founders get the structure wrong."
      date="March 2026"
      readTime="5 min read"
    >
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Most founders think the pitch deck is the document that matters most. It's not. When a partner at a VC firm wants to bring your deal to the partnership meeting, they write a memo. Or they forward yours. If you give them a head start on that memo, you dramatically increase your chances of getting to a term sheet.
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        The seed memo is different from a Series A memo. At seed, you're not proving a model works. You're proving the problem is real, the founder is credible, and the opportunity is large enough to matter. Here's what investors actually look for.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">1. A thesis, not a summary</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        The first paragraph of a seed memo should read like a thesis statement, not an executive summary. It should make a claim about why this company will win. "Relay will own the scheduling workflow for sales teams because scheduling is the last major unautomated step in the sales process, and the timing is right because calendar APIs are finally reliable." That's a thesis. "Relay is a scheduling platform for sales teams" is not.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">2. Problem with specificity</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        At seed, investors are buying the problem more than the solution. The problem section needs to be specific enough that the reader thinks "yes, I've seen this." Generic pain points like "the market is fragmented" don't land. Specific ones do: "Sales reps at mid-market companies spend an average of 15 hours per week on meeting coordination, according to internal data from three design partners."
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Numbers help. But they need to feel earned, not googled. If you can cite your own customer interviews, pilot data, or design partner feedback, that carries far more weight than a Gartner stat.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">3. Market sizing that isn't lazy</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Every investor has seen the "TAM is $50B based on Grand View Research" slide. It means nothing. At seed, what matters is your serviceable market and how you calculated it. A bottom-up estimate that shows 150,000 companies in your ICP at $2K average contract value is far more credible than a top-down TAM pulled from a report.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">4. Why now, specifically</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        "Why now" is the most underappreciated section of a seed memo. If this problem has existed for years, why is now the right time to solve it? Technology shifts (LLMs, API maturity), market changes (regulation, buyer behavior), or structural shifts (remote work, economic pressure) all work. The answer needs to be specific and verifiable, not "AI is changing everything."
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">5. Founder-market fit over traction</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        At seed, most companies don't have meaningful traction. That's fine. What investors look for instead is founder-market fit: why is this specific founder uniquely positioned to solve this problem? Did they experience it firsthand? Do they have domain expertise? Have they built in this space before? The memo should make this case explicitly, not leave it for the reader to infer.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">6. Risks, stated honestly</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        The best seed memos include a risks section. Not because investors want to see pessimism, but because acknowledging risks signals self-awareness. "The primary risk is that enterprise sales cycles may be longer than our model assumes" is a hundred times better than pretending there are no risks. Investors will identify the risks whether you state them or not. Stating them first shows maturity.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">The memo is a thinking tool, not a marketing tool</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        The biggest mistake founders make with memos is treating them like pitch decks in paragraph form. A pitch deck sells. A memo analyzes. The tone should be measured, the claims should be balanced, and the structure should make it easy for a partner to extract the key points for their investment committee.
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed">
        If you're raising a seed round and you don't have a memo ready, you're leaving the most important document to the investor's interpretation of your deck. Build the memo. Build it before the deck. The deck will be better for it.
      </p>
    </BlogPostLayout>
  );
}