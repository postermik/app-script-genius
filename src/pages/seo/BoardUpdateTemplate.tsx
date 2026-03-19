import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

export default function BoardUpdateTemplate() {
  return (
    <SEOPageLayout
      title="Board Update Template for Startups"
      description="Generate structured board updates from your current metrics and priorities. Rhetoric builds quarterly updates with the sections your board actually cares about: metrics, risks, asks, and milestones."
      headline="Board updates that get read, not skimmed."
      subheadline="Most board updates are either too long or too vague. Rhetoric generates structured updates with the right level of detail: clear metrics, honest risks, specific asks, and a forward-looking plan."
      features={[
        "Quarterly metrics dashboard with context",
        "Risk identification with mitigation plans",
        "Specific board asks (not just FYIs)",
        "Milestone tracking against last quarter's plan",
        "Strategic context for every number",
        "Formatted for email or presentation",
      ]}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Board updates are a different skill than fundraising</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            A pitch deck sells the vision. A board update reports on reality. Too many founders treat board updates as mini pitch decks: all optimism, no substance. Experienced board members see through this immediately. The best board updates are direct, structured, and honest about what's working and what isn't.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed mt-3">
            Rhetoric's board update mode generates structured updates that balance transparency with strategic framing. Metrics are presented with context, not just numbers. Risks are paired with mitigation strategies. Asks are specific enough for board members to act on.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">The sections your board expects</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            A good board update covers a consistent set of topics: key metrics vs. plan, product progress, go-to-market update, team changes, cash position and runway, risks and mitigation, and specific asks. Rhetoric structures your update around these sections, pre-populated with the right framing for each. You fill in the numbers and context; the structure and narrative flow are handled.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Beyond fundraising</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Rhetoric isn't just for raising capital. Board updates, strategy memos, and team communications all require the same core skill: structuring an argument clearly. Whether you're reporting to investors, aligning your executive team, or preparing for a board meeting, Rhetoric helps you build the narrative that gets the room on the same page.
          </p>
        </div>
      </div>
    </SEOPageLayout>
  );
}