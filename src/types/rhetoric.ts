import type { DeckSlide, NarrativeScore } from "./narrative";

export interface DeliverableSection {
  heading: string;
  content: string;
  suggestion?: string | null;
}

export interface Deliverable {
  type: "deck" | "memo" | "document" | "email";
  // deck
  deckFramework?: DeckSlide[];
  suggestions?: string[];
  // memo / email / document
  to?: string;
  from?: string;
  subject?: string;
  sections?: DeliverableSection[];
  // document (board update)
  boardDeckOutline?: DeckSlide[];
}

export interface AnalysisData {
  summary: string;
  slideBySlide?: Array<{ originalSlide: string; assessment: string; suggestion: string }>;
  commonQuestions?: Array<{ question: string; suggestedAnswer: string }>;
  keyPhrases?: string[];
}

export interface SupportingData {
  thesis?: any;
  narrativeStructure?: any;
  pitchScript?: string;
  marketLogic?: string[];
  risks?: string;
  whyNow?: string;
}

export interface RhetoricScore {
  overall: number;
  components: Record<string, number>;
  strengths: string[];
  gaps: string[];
  improvements: string[];
}

export interface RhetoricOutput {
  intent: "create" | "evaluate";
  mode: string;
  title: string;
  deliverable: Deliverable;
  analysis?: AnalysisData;
  supporting?: SupportingData;
  score: RhetoricScore;
}

// ── Intake types ──

export type IntakePurpose = "investor_pitch" | "board_update" | "strategy_memo" | "team_alignment" | "general_narrative";
export type OutputDeliverable = "slide_framework" | "elevator_pitch" | "investor_qa" | "pitch_email" | "investment_memo";
export type IntakeStage = "pre_seed" | "seed" | "series_a" | "series_b" | "growth";

export interface IntakeSelections {
  purpose: IntakePurpose;
  outputs: OutputDeliverable[];
  stage: IntakeStage;
}

// ── Elevator pitch data ──
export interface ElevatorPitchData {
  thirtySecond: string;
  sixtySecond: string;
}

// ── Investor Q&A data ──
export interface InvestorQAItem {
  question: string;
  answer: string;
}

// ── Pitch email variant ──
export interface PitchEmailVariant {
  label: string;
  subject: string;
  body: string;
}

// ── Investment memo sections ──
export interface InvestmentMemoData {
  sections: { heading: string; content: string }[];
}

// Helper to determine intent from any output shape
export function getOutputIntent(output: any): "create" | "evaluate" {
  if (output?.intent) return output.intent;
  if (output?.detected_intent === "evaluate") return "evaluate";
  return "create";
}

// Helper to get deliverable from new or old format
export function getDeliverable(output: any): Deliverable | null {
  if (output?.deliverable) return output.deliverable;
  if (output?.data) {
    const d = output.data;
    const mode = output.mode;
    if (mode === "fundraising") {
      if (d.deckFramework?.length) return { type: "deck", deckFramework: d.deckFramework };
      // No slides generated (skipSlides) — return null, deliverables are synthesized per-tab
      return null;
    }
    if (mode === "board_update") {
      return { type: "document", sections: [], boardDeckOutline: d.boardDeckOutline };
    }
    if (mode === "investor_update") {
      return { type: "email", subject: d.headline, sections: [
        { heading: "Progress", content: d.progress || "" },
        { heading: "Metrics", content: d.metrics || "" },
        { heading: "Challenges", content: d.challenges || "" },
        { heading: "Next Milestones", content: d.nextMilestones || "" },
        { heading: "The Ask", content: d.askUpdate || "" },
      ].filter(s => s.content) };
    }
    if (mode === "strategy") {
      return { type: "memo", subject: d.thesis ? "Strategic Thesis" : undefined, sections: [
        { heading: "Thesis", content: d.thesis || "" },
        { heading: "Positioning", content: d.positioning || "" },
        { heading: "Market Analysis", content: d.marketAnalysis || "" },
        { heading: "Competitive Framework", content: d.competitiveFramework || "" },
      ].filter(s => s.content) };
    }
    if (mode === "product_vision") {
      return { type: "document", sections: [
        { heading: "Vision", content: d.vision || "" },
        { heading: "User Problem", content: d.userProblem || "" },
        { heading: "Solution Framework", content: d.solutionFramework || "" },
        { heading: "Roadmap", content: d.roadmapNarrative || "" },
      ].filter(s => s.content) };
    }
    if (d.deckFramework?.length) return { type: "deck", deckFramework: d.deckFramework };
  }
  return null;
}

// Helper to get score from new or old format
export function getScore(output: any): RhetoricScore | null {
  if (output?.score) return output.score;
  return null;
}

// Helper to get analysis (evaluate only)
export function getAnalysis(output: any): AnalysisData | null {
  return output?.analysis || null;
}

// Sidebar tab type (simplified)
export type OutputTabKey = "outputs" | "score" | "analysis";
