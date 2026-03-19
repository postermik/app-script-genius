import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

export default function InvestorQAPrep() {
  return (
    <SEOPageLayout
      title="Investor Q&A Prep"
      description="Prepare for tough investor questions before they're asked. Rhetoric generates Q&A prep based on your actual narrative, surfacing the hard questions VCs will ask at your stage."
      headline="Know what investors will ask before you walk in the room."
      subheadline="The best founders don't wing investor meetings. They've rehearsed answers to the hardest questions. Rhetoric generates Q&A prep based on your actual pitch, not generic lists."
      features={[
        "Questions generated from your specific narrative gaps",
        "Stage-aware (pre-seed questions differ from Series A)",
        "Covers market, traction, competition, team, and terms",
        "Suggested answer frameworks for each question",
        "Identifies the weakest parts of your story before investors do",
        "Updates as your narrative strengthens",
      ]}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Generic Q&A lists miss the point</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            You can find "50 questions VCs ask" on any blog. The problem is that those lists are generic. They don't know your business. They don't know that your competitive positioning is weak, or that your use of funds is vague, or that your market sizing relies on a top-down TAM that investors will challenge.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed mt-3">
            Rhetoric's Q&A prep reads your actual narrative and identifies where investors will push back. If your traction section doesn't mention retention, it generates "What does your churn look like?" If you haven't named competitors, it generates "Who else is doing this and why will you win?" The questions are specific to your gaps, not pulled from a template.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Different stages, different questions</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            A pre-seed investor asks about the problem and the founder. A seed investor asks about early traction and market size. A Series A investor asks about unit economics and scaling. Rhetoric calibrates its Q&A prep to your stage, so you're rehearsing the questions that will actually come up in your meetings, not questions meant for a later-stage company.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Part of your complete material system</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Q&A prep is generated alongside your pitch deck, memo, elevator pitch, and outreach emails. Everything comes from the same core narrative. When you strengthen a section based on Q&A prep feedback, the improvement flows through to your deck and memo automatically.
          </p>
        </div>
      </div>
    </SEOPageLayout>
  );
}