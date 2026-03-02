export type OutputMode = "fundraising" | "board_update" | "strategy" | "product_vision" | "investor_update";

export type RefinementTone = "refine" | "sharper" | "visionary" | "analytical" | "condense" | "expand";

export type VoiceProfile = "auto" | "executive" | "investor" | "technical" | "visionary";

export type AudienceType = "general" | "investors" | "board" | "internal";

export type ReadinessLevel = "Developing" | "Solid" | "Investor-Ready" | "Board-Ready" | "Conference-Ready";

export interface ReadinessCheckItem {
  label: string;
  status: "done" | "warning" | "missing";
}

export interface ReadinessIndex {
  level: ReadinessLevel;
  checklist: ReadinessCheckItem[];
  missing: string[];
  strengths: string[];
  nextAction: string;
}

export interface NarrativeScore {
  overall: number;
  components: {
    clarity: number;
    marketFraming: number;
    differentiation: number;
    riskTransparency: number;
    persuasiveStructure: number;
  };
  strengths: string[];
  gaps: string[];
  improvements: string[];
}

export interface SlideMetadata {
  slideType: "headline" | "chart" | "quote" | "framework" | "roadmap" | "financial" | "split";
  visualDirection: "minimal" | "data-heavy" | "bold-headline" | "split-layout";
  visualDominant: string;
}

export interface DeckSlide {
  headline: string;
  metadata?: SlideMetadata;
}

export interface DeckControls {
  textDensity: number;
  visualWeight: number;
  tone: number;
}

export interface FundraisingOutput {
  thesis: { content: string; coreInsight: string };
  narrativeStructure: {
    worldToday: string;
    breakingPoint: string;
    newModel: string;
    whyThisWins: string;
    theFuture: string;
  };
  pitchScript: string;
  deckFramework: string[] | DeckSlide[];
  marketLogic: string[];
  risks: string;
  whyNow: string;
}

export interface BoardUpdateOutput {
  executiveSummary: string;
  metricsNarrative: string;
  risksFocus: string;
  boardDeckOutline: string[] | DeckSlide[];
}

export interface StrategyOutput {
  thesis: string;
  positioning: string;
  marketAnalysis: string;
  competitiveFramework: string;
}

export interface ProductVisionOutput {
  vision: string;
  userProblem: string;
  solutionFramework: string;
  roadmapNarrative: string;
}

export interface InvestorUpdateOutput {
  headline: string;
  progress: string;
  metrics: string;
  challenges: string;
  nextMilestones: string;
  askUpdate: string;
}

export type NarrativeOutputData =
  | { mode: "fundraising"; title?: string; data: FundraisingOutput; score?: NarrativeScore; readiness?: ReadinessIndex }
  | { mode: "board_update"; title?: string; data: BoardUpdateOutput; score?: NarrativeScore; readiness?: ReadinessIndex }
  | { mode: "strategy"; title?: string; data: StrategyOutput; score?: NarrativeScore; readiness?: ReadinessIndex }
  | { mode: "product_vision"; title?: string; data: ProductVisionOutput; score?: NarrativeScore; readiness?: ReadinessIndex }
  | { mode: "investor_update"; title?: string; data: InvestorUpdateOutput; score?: NarrativeScore; readiness?: ReadinessIndex };

export interface OutreachEntry {
  investorName: string;
  firm?: string;
  status: "not_contacted" | "contacted" | "warm_intro" | "meeting_scheduled" | "passed" | "invested";
  notes: string;
  updatedAt: string;
}

export interface ProjectVersion {
  id: string;
  version_number: number;
  summary: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  mode: string;
  raw_input: string;
  output_data: NarrativeOutputData | null;
  detected_intent?: string;
  current_thesis?: string;
  refinement_history: any[];
  outreach_tracker: OutreachEntry[];
  audience_variants?: Record<AudienceType, NarrativeOutputData>;
  created_at: string;
  updated_at: string;
}
