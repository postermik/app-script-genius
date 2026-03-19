import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

export default function FundraisingMaterials() {
  return (
    <SEOPageLayout
      title="Fundraising Materials for Startups"
      description="Generate a complete set of fundraising materials from one input: pitch deck, investment memo, elevator pitch, investor Q&A, and outreach emails. Built for founders raising pre-seed through Series A."
      headline="Every fundraising document you need, generated in one session."
      subheadline="Founders spend weeks assembling pitch decks, memos, emails, and Q&A prep from scratch. Rhetoric generates the full set from a single description of your startup, all narratively consistent."
      features={[
        "Core narrative that anchors every document",
        "Slide framework with headlines, content, and speaker notes",
        "Investment memo with thesis, market, risks, and terms",
        "Elevator pitch calibrated to your stage",
        "Investor Q&A with the questions VCs actually ask",
        "Cold outreach email variants",
        "Export to PowerPoint, Word, and PDF",
      ]}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">The problem with fundraising materials today</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Most founders build their fundraising materials one at a time. The deck comes first, usually after weeks of iteration. Then they realize they need a memo for partners who prefer to read. Then a pitch email to get the meeting. Then Q&A prep for the meeting itself. Each document starts from scratch, and by the time you have four or five materials, they tell slightly different stories.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed mt-3">
            Rhetoric solves this by generating everything from one core narrative. You describe your startup once. The engine builds a complete, consistent material system. Your deck, memo, email, and Q&A prep all tell the same story because they all come from the same source.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">What "narratively consistent" means in practice</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            When your pitch email says you're solving a $15K problem and your deck says it's a $10K problem, investors notice. When your memo frames you as a dev tools company and your elevator pitch says you're in enterprise SaaS, that's a red flag. Narrative consistency isn't just polish. It's a signal that you've thought clearly about your business.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed mt-3">
            Because Rhetoric generates all materials from the same core narrative, every number, every claim, every framing is consistent across documents. Edit one, and the change propagates. No more version control across five Google Docs.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Built for the way founders actually raise</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            You don't send your full deck to every investor. Some want a two-line email first. Some want a memo they can forward to partners. Some want to jump straight to a call and need Q&A prep. Rhetoric gives you the right material for every stage of the conversation, all ready before the first email goes out.
          </p>
        </div>
      </div>
    </SEOPageLayout>
  );
}