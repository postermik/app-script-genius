import { BlogPostLayout } from "@/components/blog/BlogPostLayout";

export default function NarrativeVsDeckPost() {
  return (
    <BlogPostLayout
      title="Fundraising narrative vs pitch deck: which comes first?"
      description="Why starting with slides is backwards, and how building the narrative first makes every document stronger."
      date="March 2026"
      readTime="5 min read"
    >
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        When founders decide to raise, the first thing they usually do is open Google Slides. Cover slide, problem slide, solution slide, market slide. Fill in the blanks. Ship it.
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        This is backwards. And it's why most pitch decks feel generic, disjointed, and forgettable.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">The deck is a container, not the content</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        A pitch deck is a delivery format. It's how you present an argument visually. But the argument itself, the narrative, needs to exist before you start thinking about slides. A narrative is the logical structure of your fundraising story: what problem exists, why it matters now, why you're the right team, how big this can get, and what you need to get there.
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        When you start with the deck, you start with layout. You think about how many slides you need, what goes on each one, how to make it look good. You end up with a well-designed document that doesn't tell a coherent story. When you start with the narrative, you start with the argument. The deck flows naturally from there.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">The narrative is the source of truth</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Here's the practical problem with starting deck-first: you don't just need a deck. You need a memo for partners who prefer reading. You need a pitch email for cold outreach. You need Q&A prep for the meeting itself. You need an elevator pitch for the intro call. If each of these starts from scratch, they'll tell slightly different stories. Numbers won't match. Framing will shift. Your competitive positioning will be one thing in the email and another thing in the deck.
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        A narrative is the single source of truth that all these documents draw from. Build the narrative first, and the deck, memo, email, and Q&A all inherit the same argument structure, the same numbers, the same framing. Consistency across touchpoints is one of the clearest signals of a founder who has thought clearly about their business.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">What a narrative looks like in practice</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        A fundraising narrative is a structured document, usually 2-4 pages, that covers: the problem (with specific data), the solution (with clear differentiation), the market (with bottom-up sizing), the timing (why now), the traction (with real metrics), the team (with founder-market fit), and the ask (with use of funds). Each section builds on the one before it. The result reads like an investment thesis, not a marketing brochure.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">Why founders skip the narrative</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Because it's harder. Writing a narrative requires you to make decisions you might prefer to defer. What's your actual competitive advantage? How big is your market, really? Why should an investor believe you'll win? These are uncomfortable questions. A deck lets you sidestep them with nice visuals and vague copy. A narrative forces you to answer them directly.
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        That's exactly why you should do it. The founders who can articulate their thesis clearly, without slides to hide behind, are the ones who close rounds. The pitch deck becomes easy when the thinking is already done.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">The sequence that works</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Start with raw input: notes, bullet points, rough thinking about what your company does and why it matters. Structure that into a narrative with clear sections and a logical flow. Pressure-test the narrative for gaps: do you have traction data? Have you named competitors? Is your timing argument specific?
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Once the narrative is solid, generating the deck is mechanical. Each narrative section maps to a slide or set of slides. The headlines are already written. The talking points are already clear. The same narrative also generates your memo, your pitch emails, and your Q&A prep.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">Narrative first, always</h2>
      <p className="text-sm text-foreground/75 leading-relaxed">
        The pitch deck is not the hard part of fundraising. The hard part is building a clear, specific, defensible argument for why your company deserves capital. That's the narrative. Get it right, and every document you produce will be stronger. Skip it, and you'll spend weeks iterating on slides that don't tell a story.
      </p>
    </BlogPostLayout>
  );
}