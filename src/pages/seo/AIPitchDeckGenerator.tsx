import { SEOPageLayout } from "@/components/seo/SEOPageLayout";

export default function AIPitchDeckGenerator() {
  return (
    <SEOPageLayout
      title="AI Pitch Deck Generator"
      description="Generate a complete pitch deck framework from a short description of your startup. Rhetoric builds the narrative structure, slide content, and talking points that investors actually respond to."
      headline="Generate your pitch deck with AI that understands fundraising."
      subheadline="Most AI deck tools give you templates. Rhetoric builds the argument. Describe your startup in a few sentences and get a complete slide framework, core narrative, and investor-ready materials."
      features={[
        "Complete slide framework with headlines, body content, and speaker notes",
        "Core narrative that ties every slide into a coherent story",
        "Elevator pitch calibrated to your stage and market",
        "Investor Q&A prep with the hard questions VCs actually ask",
        "Pitch email variants for cold outreach",
        "Export to PowerPoint (.pptx)",
      ]}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Not another slide template</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            The problem with AI pitch deck generators is that they start with layout. Cover slide, team slide, market slide. They fill in blanks with generic copy that sounds like every other deck in an investor's inbox.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed mt-3">
            Rhetoric starts with the argument. What is the problem? Why does it matter now? Why are you the right team? How big can this get? It builds the narrative logic first, then structures that logic into slides. The result is a deck that reads like you hired a $15K consultant, not like you prompted an AI.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">How it works</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Paste in a description of your startup. It can be rough: a paragraph, bullet points, notes from a brainstorm. Rhetoric analyzes your input, identifies the strongest narrative angles, and generates a complete material system in one session: core narrative, slide framework, elevator pitch, investor Q&A, and pitch emails.
          </p>
          <p className="text-sm text-foreground/70 leading-relaxed mt-3">
            The built-in consultant then reviews what was generated and identifies gaps. Missing competitive positioning? It researches alternatives for you. No market sizing? It pulls TAM/SAM/SOM estimates. Traction story needs numbers? It tells you exactly what to add. Every suggestion is specific to your narrative, not generic advice.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Built for pre-seed through Series A</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Rhetoric is opinionated about what investors at each stage care about. A pre-seed deck needs to sell the problem and the founder. A Series A deck needs to prove the model works and the market is large. The narrative engine adjusts its emphasis based on your stage, so the output is calibrated, not one-size-fits-all.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">What founders say</h2>
          <p className="text-sm text-foreground/70 leading-relaxed italic">
            "I spent three weeks trying to write my pitch deck with ChatGPT. Rhetoric gave me a better narrative structure in 10 minutes. The slide framework actually told a story instead of just filling in sections."
          </p>
        </div>
      </div>
    </SEOPageLayout>
  );
}