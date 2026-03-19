import { BlogPostLayout } from "@/components/blog/BlogPostLayout";

export default function PitchEmailPost() {
  return (
    <BlogPostLayout
      title="How to write a pitch email to VCs"
      description="The cold outreach email that gets replies. What to include, what to cut, and why specificity beats polish."
      date="March 2026"
      readTime="4 min read"
    >
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        The average VC partner gets hundreds of cold emails a week. Most get deleted within seconds. The emails that get opened and replied to share three traits: they're short, they're specific, and they immediately communicate why this deal is worth 30 seconds of attention.
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Here's how to write one that works.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">Keep it under 150 words</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        This is non-negotiable. Your pitch email is not a pitch deck in paragraph form. It's a hook. The goal is to get a 15-minute call, not to close a round. Every word that doesn't serve that goal is a reason to stop reading.
      </p>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        A good structure: one sentence on the problem, one sentence on what you've built, one sentence on traction, one sentence on the ask. That's it. If you can't describe your company in four sentences, you haven't refined your narrative enough.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">Lead with a number</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        The fastest way to communicate that you're real is to lead with a specific number. "We're at $40K MRR growing 34% month over month" immediately signals traction. "$15K is what founders spend on pitch consultants" immediately signals the problem is real and expensive. Numbers create credibility in a way that adjectives never can. "Fast-growing" means nothing. "34% MoM" means everything.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">Don't bury the ask</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        State what you're raising, at what stage, in the first two sentences or the last one. "We're raising a $500K pre-seed" is clear. Investors who don't do pre-seed will self-select out, and that's a feature, not a bug. You don't want to get on a call with someone who only does Series B.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">The subject line is half the battle</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        The subject line determines whether your email gets opened. Keep it factual and specific. "[Company name] - [one specific metric or claim]" works well. "Relay - 40 teams, 34% QoQ growth, raising pre-seed" is better than "Exciting opportunity in sales automation." Never use "Quick question" or "Following up" for a cold email. The investor knows you're not following up on anything.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">Personalize the first line, not the whole email</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        If you can, add one sentence that shows you know the investor's portfolio. "I saw you led the round at [portfolio company], which faces a similar buyer persona" works. But don't spend three paragraphs on flattery. One line of context, then get to your story. The personalization shows you did your research. The pitch shows you're worth their time.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">Don't attach the deck</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Attachments reduce open rates (spam filters) and remove the investor's reason to reply. Instead, end with "Happy to send the deck if this is relevant to what you're looking at." This gives them an easy action: reply with "send it." That reply starts the conversation.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">The follow-up matters more than you think</h2>
      <p className="text-sm text-foreground/75 leading-relaxed mb-5">
        Most founders send one email and wait. The reality is that investors are busy and your email landed between 50 others. A follow-up 5-7 days later with a new data point ("Since my last email, we closed our 45th team") is not annoying. It's professional. Two follow-ups is the sweet spot. Three is the maximum.
      </p>

      <h2 className="text-lg font-bold text-foreground mt-8 mb-3">Your email should match your deck</h2>
      <p className="text-sm text-foreground/75 leading-relaxed">
        If your email says you're solving a $15K problem and your deck says it's a $10K problem, investors notice. The pitch email is often the first touchpoint, and if the story doesn't hold together across email, deck, and memo, that's a red flag. Build all your materials from the same core narrative and this problem goes away.
      </p>
    </BlogPostLayout>
  );
}