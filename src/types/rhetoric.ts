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
  
  // Check both data and supporting for deck framework
  const d = output?.data || {};
  const s = output?.supporting || {};
  const mode = output?.mode;
  
  // Try to find deckFramework from any location
  const deckFramework = d.deckFramework || s.deckFramework || output?.deckFramework;
  
  if (mode === "fundraising") {
    if (deckFramework?.length) return { type: "deck", deckFramework };
    return null;
  }
  if (mode === "board_update") {
    const boardOutline = d.boardDeckOutline || s.boardDeckOutline;
    return { type: "document", sections: [], boardDeckOutline: boardOutline };
  }
  if (mode === "investor_update") {
    return { type: "email", subject: d.headline || s.headline, sections: [
      { heading: "Progress", content: d.progress || s.progress || "" },
      { heading: "Metrics", content: d.metrics || s.metrics || "" },
      { heading: "Challenges", content: d.challenges || s.challenges || "" },
      { heading: "Next Milestones", content: d.nextMilestones || s.nextMilestones || "" },
      { heading: "The Ask", content: d.askUpdate || s.askUpdate || "" },
    ].filter(sec => sec.content) };
  }
  if (mode === "strategy") {
    return { type: "memo", subject: (d.thesis || s.thesis) ? "Strategic Thesis" : undefined, sections: [
      { heading: "Thesis", content: d.thesis || s.thesis || "" },
      { heading: "Positioning", content: d.positioning || s.positioning || "" },
      { heading: "Market Analysis", content: d.marketAnalysis || s.marketAnalysis || "" },
      { heading: "Competitive Framework", content: d.competitiveFramework || s.competitiveFramework || "" },
    ].filter(sec => sec.content) };
  }
  if (mode === "product_vision") {
    return { type: "document", sections: [
      { heading: "Vision", content: d.vision || s.vision || "" },
      { heading: "User Problem", content: d.userProblem || s.userProblem || "" },
      { heading: "Solution Framework", content: d.solutionFramework || s.solutionFramework || "" },
      { heading: "Roadmap", content: d.roadmapNarrative || s.roadmapNarrative || "" },
    ].filter(sec => sec.content) };
  }
  if (deckFramework?.length) return { type: "deck", deckFramework };
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
