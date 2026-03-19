import { useEffect } from "react";

const FAQS = [
  {
    q: "What is Rhetoric?",
    a: "Rhetoric is an AI-powered narrative builder for founders and operators. You paste in your raw thinking: notes, bullet points, a rough thesis. Rhetoric structures it into an investor-grade pitch narrative, board update, or strategy memo. It focuses on argument, not aesthetics.",
  },
  {
    q: "Who is it for?",
    a: "Founders raising capital, preparing board decks, or aligning a team around strategy. If you need to make a case that holds up in serious rooms, Rhetoric is built for you.",
  },
  {
    q: "What do I paste in to start?",
    a: "Anything that represents your current thinking: a paragraph about what your company does, bullet-point notes from a brainstorm, a rough draft of your thesis. Rhetoric works best when you bring the substance, even if it's messy.",
  },
  {
    q: "What do I get out at the end?",
    a: "A complete material system: core narrative, elevator pitch, slide framework, investor Q&A, pitch emails, and investment memo. The AI Guide identifies gaps in your story and helps you strengthen each section with research and suggestions.",
  },
  {
    q: "How is this different from ChatGPT or a generic deck template?",
    a: "ChatGPT gives you text. Templates give you layout. Neither gives you argument structure. Rhetoric pressure-tests your thesis, identifies narrative gaps, researches competitors and market sizing for you, and builds the story arc that investors actually follow. It's opinionated by design.",
  },
  {
    q: "Does it design slides or structure the story?",
    a: "It structures the story. Rhetoric is not a slide design tool, it's a thinking tool. You get the narrative logic, slide-by-slide framework, and the language. You bring that into your preferred design tool or export to PowerPoint.",
  },
  {
    q: "Can it export to PowerPoint and Google Slides?",
    a: "Pro users can export to PowerPoint (.pptx). You can then import that file into Google Slides. Direct Google Slides integration is on the roadmap.",
  },
  {
    q: "Can I use my brand guidelines?",
    a: "Not yet in the current version. Brand-aware exports (colors, fonts, logos) are planned for Enterprise. Today, the focus is on narrative quality: the argument, not the chrome.",
  },
  {
    q: "What about confidentiality and data?",
    a: "Your inputs are encrypted in transit and at rest. We never use your data to train AI models. Projects are stored in your account and deletable at any time. We process your content to generate outputs. That's it.",
  },
  {
    q: "Can I collaborate with my team?",
    a: "Team collaboration is available on the Enterprise plan. On Hobby and Pro, projects are single-user.",
  },
  {
    q: "What does Pro include?",
    a: "Unlimited projects, unlimited refinements, all output modes (fundraising, board, strategy), PowerPoint export, investor discovery with AI matching, pipeline tracker, and priority support.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from your account settings. You'll retain access through the end of your current billing period.",
  },
];

export default function FAQ() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex-1 px-6 pt-24 pb-20">
      <div className="max-w-[720px] mx-auto">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Support</p>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-muted-foreground mb-16 max-w-[560px]">
          Everything you need to know about Rhetoric.
        </p>
        <div className="space-y-10">
          {FAQS.map((faq, i) => (
            <div key={i} className="border-b border-border/40 pb-8 last:border-0">
              <h3 className="text-[15px] font-semibold text-foreground mb-3">{faq.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}