import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

export default function PitchEmailTemplate() {
  return (
    <SEOPageLayout
      title="Pitch Email Template for Investors"
      description="Generate personalized cold outreach emails to investors based on your actual fundraising narrative. Not generic templates. Rhetoric builds pitch emails that reference your specific traction, market, and ask."
      headline="Pitch emails that sound like you wrote them, not an AI."
      subheadline="Generic pitch email templates get ignored. Investors can spot a mass blast from the subject line. Rhetoric generates outreach emails built from your actual narrative, with the specificity that gets replies."
      features={[
        "Multiple email variants (cold intro, warm intro, follow-up)",
        "Each email references your real traction and market data",
        "Calibrated to your stage and raise amount",
        "Concise by default (investors skim, not read)",
        "Built from the same narrative as your deck and memo",
        "Edit inline and export",
      ]}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Why most pitch emails fail</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            The average VC gets hundreds of cold emails a week. The ones that get opened share three traits: they're short, they're specific, and they immediately communicate why this deal is worth 30 seconds of attention. Generic templates with "[insert traction metric here]" placeholders don't achieve any of these.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed mt-3">
            Rhetoric's pitch emails are generated from your actual narrative. If your core story is about solving a $15K problem for founders, that number shows up in the email. If you're growing 34% quarter over quarter, that's the hook. The emails are specific because they're built from specific content, not filled in from a template.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Multiple variants, one narrative</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Rhetoric generates multiple email variants from the same core narrative. A cold intro that leads with the problem. A warm intro that leads with traction. A follow-up that adds a new data point. Each one is different enough to test, but consistent enough that your story holds together regardless of which email an investor reads first.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Part of a complete system</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            The pitch email is often the first touchpoint. If an investor replies and asks for your deck, the deck should tell the same story the email promised. If they ask for a memo, the memo should elaborate on the same thesis. Rhetoric generates all of these from one input, so everything is aligned. Your email, deck, memo, and Q&A prep all come from the same narrative engine.
          </p>
        </div>
      </div>
    </SEOPageLayout>
  );
}