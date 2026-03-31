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

export type IntakePurpose = "fundraising" | "board_meeting" | "strategy" | "sales";
export type OutputDeliverable = 
  | "core_narrative"
  | "slide_framework" 
  | "elevator_pitch" 
  | "investor_qa" 
  | "pitch_email" 
  | "investment_memo"
  | "board_memo"
  | "key_metrics_summary"
  | "strategic_memo";
export type IntakeStage = "pre_seed" | "seed" | "series_a" | "series_b" | "growth";

export interface IntakeSelections {
  purpose: IntakePurpose;
  outputs: OutputDeliverable[];
  stage: IntakeStage;
}

// ── Core Narrative ──
export interface CoreNarrativeSection {
  heading: string;
  content: string;
}

export interface CoreNarrativeData {
  sections: CoreNarrativeSection[];
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

// ── Board Memo ──
export interface BoardMemoData {
  sections: { heading: string; content: string }[];
}

// ── Key Metrics Summary ──
export interface KeyMetricItem {
  name: string;
  value: string;
  trend: "up" | "down" | "flat";
  context: string;
}

export interface KeyMetricsSummaryData {
  categories: { category: string; metrics: KeyMetricItem[] }[];
}

// ── Strategic Memo ──
export interface StrategicMemoData {
  sections: { heading: string; content: string }[];
}

// ── Intent-based Core Narrative section headings ──
export const CORE_NARRATIVE_SECTIONS: Record<IntakePurpose, string[]> = {
  fundraising: ["Problem", "Solution", "Why Now", "Market", "Traction", "Vision"],
  board_meeting: ["Challenges", "Progress & Metrics", "Strategic Updates", "Market Position", "Key Asks", "Next Quarter Priorities"],
  strategy: ["Problem", "Current State", "Strategic Insight", "Market Landscape", "Action Plan", "Vision"],
  sales: ["Client Pain", "Solution", "Differentiators", "Proof Points", "Process", "Why Us"],
};

// ── Intent-based output options ──
export interface OutputOption {
  value: OutputDeliverable;
  label: string;
  preSelected: boolean;
}

export const INTENT_OUTPUTS: Record<IntakePurpose, OutputOption[]> = {
  fundraising: [
    { value: "slide_framework", label: "Slide Framework", preSelected: true },
    { value: "elevator_pitch", label: "Elevator Pitch", preSelected: true },
    { value: "investor_qa", label: "Investor Q&A Prep", preSelected: true },
    { value: "pitch_email", label: "Pitch Email", preSelected: false },
    { value: "investment_memo", label: "Investment Memo", preSelected: false },
  ],
  board_meeting: [
    { value: "slide_framework", label: "Slide Framework", preSelected: true },
    { value: "board_memo", label: "Board Memo", preSelected: true },
    { value: "key_metrics_summary", label: "Key Metrics Summary", preSelected: false },
  ],
  strategy: [
    { value: "strategic_memo", label: "Strategic Memo", preSelected: true },
    { value: "elevator_pitch", label: "Elevator Pitch", preSelected: false },
    { value: "slide_framework", label: "Slide Framework", preSelected: false },
  ],
  sales: [
    { value: "slide_framework", label: "Sales Deck", preSelected: true },
    { value: "elevator_pitch", label: "Elevator Pitch", preSelected: true },
    { value: "investor_qa", label: "Objection Handling", preSelected: true },
    { value: "pitch_email", label: "Follow-up Emails", preSelected: true },
    { value: "strategic_memo", label: "Competitive Brief", preSelected: false },
  ],
};

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
  
  if (mode === "fundraising" || mode === "sales") {
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