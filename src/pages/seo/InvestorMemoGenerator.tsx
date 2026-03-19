import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

export default function InvestorMemoGenerator() {
  return (
    <SEOPageLayout
      title="Investor Memo Generator"
      description="Generate a structured investment memo from your startup description. Rhetoric builds the thesis, market analysis, competitive positioning, and risk framework that serious investors expect."
      headline="Generate investment memos that read like they were written by your lead investor."
      subheadline="Investment memos require a different voice than pitch decks. They need to be analytical, balanced, and structured around a thesis. Rhetoric generates memos that frame your company the way an investor would present it to their partners."
      features={[
        "Structured thesis with bull and bear case",
        "Market analysis with TAM/SAM/SOM framing",
        "Competitive landscape with positioning rationale",
        "Risk framework with mitigation strategies",
        "Financial summary and use of funds breakdown",
        "Formatted for LP-ready presentation",
      ]}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">The memo is often more important than the deck</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            When a partner at a VC firm wants to bring your deal to their Monday meeting, they don't present your pitch deck. They write a memo. It summarizes the opportunity, the risks, the market, and why the fund should care. If you give them a head start on that memo, you dramatically increase your chances of getting to a term sheet.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed mt-3">
            Rhetoric generates memos in the format investors actually use internally. The structure follows the standard: thesis, market, product, team, traction, competition, risks, terms. But the content is specific to your company, built from the same narrative engine that powers the rest of your fundraising materials.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Different from a pitch deck on purpose</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            A pitch deck sells. A memo analyzes. Rhetoric understands this distinction. The memo generator uses a more measured, analytical tone. It acknowledges risks instead of glossing over them. It frames the competitive landscape honestly. This is what makes it useful. Investors trust materials that show self-awareness, not just optimism.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">One input, consistent outputs</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            You describe your startup once. Rhetoric generates the memo, the pitch deck, the elevator pitch, and the investor Q&A from the same core narrative. Everything is consistent because everything comes from the same argument. No more version control nightmares where your memo says one thing and your deck says another.
          </p>
        </div>
      </div>
    </SEOPageLayout>
  );
}