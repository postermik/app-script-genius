import { OutputCard } from "@/components/OutputCard";
import { MessageSquare, Sparkles, Quote } from "lucide-react";

interface Section {
  key: string;
  path: string;
  label: string;
  content: string;
}

interface Props {
  sections: Section[];
  outputData: any;
}

function generateInvestorQuestions(data: any): { question: string; talkingPoint: string }[] {
  const questions: { question: string; talkingPoint: string }[] = [];
  const d = (data?.supporting || data?.data || data) || {};

  // Based on narrative content, generate relevant questions
  if (d.marketLogic || d.narrativeStructure?.worldToday) {
    questions.push({
      question: "How large is your addressable market, and how do you segment it?",
      talkingPoint: "Reference your market logic and TAM analysis. Be specific about who pays and why."
    });
  }
  if (d.narrativeStructure?.whyThisWins || d.thesis?.content) {
    questions.push({
      question: "What's your defensibility against incumbents and well-funded competitors?",
      talkingPoint: "Lead with your moat — whether it's data, network effects, proprietary tech, or speed of execution."
    });
  }
  if (d.narrativeStructure?.newModel) {
    questions.push({
      question: "How do you acquire your first 1,000 users?",
      talkingPoint: "Describe your go-to-market wedge. Be specific about channels, not vague about 'virality'."
    });
  }
  questions.push({
    question: "Why are you the right team to build this?",
    talkingPoint: "Highlight unique domain expertise, previous exits, or unfair advantages your team brings."
  });
  if (d.risks) {
    questions.push({
      question: "What's the biggest risk to this business, and how do you mitigate it?",
      talkingPoint: "Investors respect founders who name risks upfront. Show you've thought through mitigation strategies."
    });
  }
  questions.push({
    question: "What does your unit economics look like at scale?",
    talkingPoint: "Show a path to profitability with CAC, LTV, and margin projections. Even estimates demonstrate rigor."
  });
  if (d.whyNow) {
    questions.push({
      question: "Why is now the right time for this company to exist?",
      talkingPoint: "Tie to macro trends, regulatory changes, or technology shifts that create the window of opportunity."
    });
  }

  return questions.slice(0, 7);
}

function extractKeyPhrases(data: any): string[] {
  const phrases: string[] = [];
  const d = (data?.supporting || data?.data || data) || {};

  // Extract punchy one-liners from the content
  if (d.thesis?.coreInsight) {
    phrases.push(d.thesis.coreInsight);
  }
  
  // Look for short impactful sentences in the thesis
  const thesisContent = d.thesis?.content || "";
  const sentences = thesisContent.split(/[.!]/).filter((s: string) => s.trim().length > 20 && s.trim().length < 100);
  if (sentences.length > 0) {
    phrases.push(sentences[0].trim() + ".");
  }

  // Pull from narrative structure
  if (d.narrativeStructure?.whyThisWins) {
    const winSentences = d.narrativeStructure.whyThisWins.split(/[.!]/).filter((s: string) => s.trim().length > 15 && s.trim().length < 100);
    if (winSentences.length > 0) phrases.push(winSentences[0].trim() + ".");
  }

  if (d.whyNow) {
    const nowSentences = d.whyNow.split(/[.!]/).filter((s: string) => s.trim().length > 15 && s.trim().length < 80);
    if (nowSentences.length > 0) phrases.push(nowSentences[0].trim() + ".");
  }

  // Deduplicate and limit
  return [...new Set(phrases)].slice(0, 5);
}

export function PitchPrepTab({ sections, outputData }: Props) {
  const pitchSection = sections.find(s => s.key === "pitch-script");
  const questions = generateInvestorQuestions(outputData);
  const keyPhrases = extractKeyPhrases(outputData);

  return (
    <div className="space-y-10">
      {/* Primary: 60-second pitch */}
      {pitchSection && (
        <OutputCard
          label="60-Second Pitch Script"
          content={pitchSection.content}
          path={pitchSection.path}
          sectionKey={pitchSection.key}
        />
      )}

      {/* Key Phrases */}
      {keyPhrases.length > 0 && (
        <div className="rounded-sm border border-electric/20 bg-electric/[0.04] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Quote className="h-4 w-4 text-electric" />
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Key Phrases to Memorize</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">These one-liners from your narrative are worth committing to memory for conversations and pitches.</p>
          <div className="space-y-3">
            {keyPhrases.map((phrase, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-sm bg-background/60 border border-border">
                <Sparkles className="h-3.5 w-3.5 text-electric shrink-0 mt-1" />
                <p className="text-sm text-foreground/90 leading-relaxed italic">"{phrase}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investor Questions */}
      {questions.length > 0 && (
        <div className="rounded-sm border border-border card-gradient p-6">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="h-4 w-4 text-electric" />
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Common Investor Questions</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Likely questions based on your narrative. Prepare answers for these before any pitch meeting.</p>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="rounded-sm border border-border bg-muted/30 overflow-hidden">
                <div className="px-5 py-3 border-b border-border/50 bg-accent/20">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="text-xs text-electric font-bold">Q{i + 1}</span>
                    {q.question}
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="text-xs text-electric/70 font-medium uppercase tracking-wider mr-2">Talking point:</span>
                    {q.talkingPoint}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
