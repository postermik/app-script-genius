import { useEffect, useState, useRef } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
  Search, Lightbulb, FileText, Mic, Layout, Target, CheckCircle,
  BarChart3, AlertTriangle, TrendingUp, Crosshair, Grid3X3,
  Eye, AlertCircle, PuzzleIcon, Map, Type, HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StepDef = { key: string; label: string; trigger: string | null; icon: string };

const STEP_SETS: Record<string, StepDef[]> = {
  fundraising: [
    { key: "analyzing", label: "Analyzing your company", trigger: null, icon: "Search" },
    { key: "thesis", label: "Building investment thesis", trigger: '"thesis"', icon: "Lightbulb" },
    { key: "narrative", label: "Structuring narrative arc", trigger: '"narrativeStructure"', icon: "FileText" },
    { key: "pitch", label: "Writing pitch script", trigger: '"pitchScript"', icon: "Mic" },
    { key: "deck", label: "Generating deck slides", trigger: '"deckFramework"', icon: "Layout" },
    { key: "scoring", label: "Scoring capital readiness", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  board_update: [
    { key: "analyzing", label: "Analyzing your update", trigger: null, icon: "Search" },
    { key: "summary", label: "Drafting executive summary", trigger: '"executiveSummary"', icon: "FileText" },
    { key: "metrics", label: "Structuring metrics narrative", trigger: '"metricsNarrative"', icon: "BarChart3" },
    { key: "risks", label: "Assessing risks and priorities", trigger: '"risksFocus"', icon: "AlertTriangle" },
    { key: "deck", label: "Building board deck outline", trigger: '"boardDeckOutline"', icon: "Layout" },
    { key: "scoring", label: "Evaluating completeness", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  strategy: [
    { key: "analyzing", label: "Analyzing your positioning", trigger: null, icon: "Search" },
    { key: "thesis", label: "Forming strategic thesis", trigger: '"thesis"', icon: "Lightbulb" },
    { key: "positioning", label: "Mapping competitive positioning", trigger: '"positioning"', icon: "Crosshair" },
    { key: "market", label: "Evaluating market dynamics", trigger: '"marketAnalysis"', icon: "TrendingUp" },
    { key: "framework", label: "Building competitive framework", trigger: '"competitiveFramework"', icon: "Grid3X3" },
    { key: "scoring", label: "Scoring strategic clarity", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  product_vision: [
    { key: "analyzing", label: "Understanding your product", trigger: null, icon: "Search" },
    { key: "vision", label: "Articulating the vision", trigger: '"vision"', icon: "Eye" },
    { key: "problem", label: "Defining user problem", trigger: '"userProblem"', icon: "AlertCircle" },
    { key: "solution", label: "Structuring solution framework", trigger: '"solutionFramework"', icon: "PuzzleIcon" },
    { key: "roadmap", label: "Building roadmap narrative", trigger: '"roadmapNarrative"', icon: "Map" },
    { key: "scoring", label: "Evaluating product clarity", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  investor_update: [
    { key: "analyzing", label: "Analyzing your progress", trigger: null, icon: "Search" },
    { key: "headline", label: "Crafting the headline", trigger: '"headline"', icon: "Type" },
    { key: "progress", label: "Summarizing progress", trigger: '"progress"', icon: "TrendingUp" },
    { key: "metrics", label: "Structuring key metrics", trigger: '"metrics"', icon: "BarChart3" },
    { key: "challenges", label: "Framing challenges honestly", trigger: '"challenges"', icon: "AlertTriangle" },
    { key: "scoring", label: "Scoring update quality", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  evaluate: [
    { key: "analyzing", label: "Reading your deck", trigger: null, icon: "Search" },
    { key: "thesis", label: "Extracting investment thesis", trigger: '"thesis"', icon: "Lightbulb" },
    { key: "narrative", label: "Mapping narrative structure", trigger: '"narrativeArc"', icon: "FileText" },
    { key: "deck", label: "Rebuilding deck framework", trigger: '"deckFramework"', icon: "Layout" },
    { key: "questions", label: "Anticipating investor questions", trigger: '"commonQuestions"', icon: "HelpCircle" },
    { key: "scoring", label: "Scoring your deck", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
};

const iconMap: Record<string, LucideIcon> = {
  Search, Lightbulb, FileText, Mic, Layout, Target, CheckCircle,
  BarChart3, AlertTriangle, TrendingUp, Crosshair, Grid3X3,
  Eye, AlertCircle, PuzzleIcon, Map, Type, HelpCircle,
};

const INITIAL_STEPS: StepDef[] = [
  { key: "analyzing", label: "Analyzing your input", trigger: null, icon: "Search" },
];

function getStepsForContext(selectedMode: string, isEvaluation: boolean): StepDef[] {
  if (isEvaluation) return STEP_SETS.evaluate;
  if (selectedMode && selectedMode !== "auto" && STEP_SETS[selectedMode]) return STEP_SETS[selectedMode];
  return INITIAL_STEPS;
}

export function GenerationStepper() {
  const { isStreaming, streamingText, isGenerating, selectedMode, isEvaluation, stopGenerating } = useDecksmith();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<StepDef[]>(() => getStepsForContext(selectedMode, isEvaluation));
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [secondsOnStep, setSecondsOnStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset stepStartTime when currentStepIndex changes
  useEffect(() => {
    setStepStartTime(Date.now());
    setSecondsOnStep(0);
  }, [currentStepIndex]);

  // Tick every second to update secondsOnStep while streaming
  useEffect(() => {
    if (isStreaming) {
      timerRef.current = setInterval(() => {
        setSecondsOnStep(Math.floor((Date.now() - stepStartTime) / 1000));
      }, 1000);
    } else {
      setSecondsOnStep(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStreaming, stepStartTime]);

  // Set steps when generation starts
  useEffect(() => {
    if (isGenerating) {
      setSteps(getStepsForContext(selectedMode, isEvaluation));
      setCurrentStepIndex(0);
    }
  }, [isGenerating, selectedMode, isEvaluation]);

  useEffect(() => {
    if (!isStreaming || !streamingText) return;

    // Auto-detect mode from streaming text (only when still on initial single step)
    const modeMatches = [
      { mode: "fundraising", patterns: ['"mode": "fundraising"', '"mode":"fundraising"'] },
      { mode: "board_update", patterns: ['"mode": "board_update"', '"mode":"board_update"'] },
      { mode: "strategy", patterns: ['"mode": "strategy"', '"mode":"strategy"'] },
      { mode: "product_vision", patterns: ['"mode": "product_vision"', '"mode":"product_vision"'] },
      { mode: "investor_update", patterns: ['"mode": "investor_update"', '"mode":"investor_update"'] },
    ];

    let detectedNewSteps = false;
    for (const { mode, patterns } of modeMatches) {
      if (patterns.some(p => streamingText.includes(p)) && STEP_SETS[mode]) {
        setSteps(prev => {
          if (prev === INITIAL_STEPS || prev !== STEP_SETS[mode]) {
            detectedNewSteps = true;
            return STEP_SETS[mode];
          }
          return prev;
        });
        break;
      }
    }

    // If we just switched from INITIAL_STEPS, start at index 1 (analyzing already done)
    if (detectedNewSteps && steps === INITIAL_STEPS) {
      setCurrentStepIndex(1);
      return;
    }

    // Detect step progress (skip if still on initial steps)
    if (steps === INITIAL_STEPS) return;

    let highest = 0;
    for (let i = 1; i < steps.length - 1; i++) {
      const trigger = steps[i].trigger;
      if (trigger && streamingText.includes(trigger)) {
        highest = i;
      }
    }
    if (highest > 0) setCurrentStepIndex(highest);
  }, [streamingText, isStreaming, steps]);

  // Mark complete when streaming finishes but still generating (parsing phase)
  useEffect(() => {
    if (!isStreaming && isGenerating && streamingText.length > 0) {
      setCurrentStepIndex(steps.length - 1);
    }
  }, [isStreaming, isGenerating, streamingText, steps.length]);

  return (
    <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isComplete = currentStepIndex > index;
          const isActive = currentStepIndex === index;
          const isPending = currentStepIndex < index;
          const StepIcon = iconMap[step.icon] || Search;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 transition-all duration-500 ease-out ${isPending ? "opacity-30" : "opacity-100"}`}
            >
              <div className={`
                flex items-center justify-center w-7 h-7 rounded-full transition-all duration-500
                ${isComplete ? "bg-emerald-500/20 text-emerald-400" : ""}
                ${isActive ? "bg-primary/20 text-primary" : ""}
                ${isPending ? "bg-muted/50 text-muted-foreground" : ""}
              `}>
                {isComplete ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <StepIcon className={`w-3.5 h-3.5 ${isActive ? "animate-pulse" : ""}`} />
                )}
              </div>
              <span className={`
                text-base transition-all duration-500
                ${isComplete ? "text-emerald-400/80" : ""}
                ${isActive ? "text-primary font-medium" : ""}
                ${isPending ? "text-muted-foreground" : ""}
              `}>
                {step.label}
                {isActive && isStreaming && secondsOnStep >= 8 && (
                  <span className="text-sm font-normal text-muted-foreground/60 ml-0.5">
                    {secondsOnStep >= 20 ? "— almost there" : "— this is the longest step"}
                  </span>
                )}
              </span>
              {isActive && isStreaming && (
                <div className="flex items-center gap-1 ml-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          );
        })}
        {/* Stop button below last step */}
        {isStreaming && currentStepIndex < steps.length - 1 && (
          <button
            onClick={stopGenerating}
            className="text-sm text-muted-foreground/70 hover:text-foreground border border-border rounded-md px-3 py-1.5 hover:border-muted-foreground transition-colors ml-10 mt-4"
          >
            Stop generating
          </button>
        )}
      </div>
    </div>
  );
}
