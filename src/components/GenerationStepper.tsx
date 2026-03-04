import { useEffect, useState, useRef } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
  Search, Lightbulb, FileText, Mic, Layout, Target, CheckCircle,
  BarChart3, AlertTriangle, TrendingUp, Crosshair, Grid3X3,
  Eye, AlertCircle, PuzzleIcon, Map, Type, HelpCircle, PenTool, Mail, RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StepDef = { key: string; label: string; trigger: string | null; icon: string };

const STEP_SETS: Record<string, StepDef[]> = {
  fundraising: [
    { key: "analyzing", label: "Analyzing your company", trigger: null, icon: "Search" },
    { key: "thesis", label: "Building investment thesis", trigger: '"thesis"', icon: "Lightbulb" },
    { key: "narrative", label: "Structuring narrative", trigger: '"narrativeStructure"', icon: "FileText" },
    { key: "pitch", label: "Writing pitch script", trigger: '"pitchScript"', icon: "Mic" },
    { key: "deck", label: "Generating slides", trigger: '"deckFramework"', icon: "Layout" },
    { key: "scoring", label: "Reviewing quality", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  strategy: [
    { key: "analyzing", label: "Analyzing your input", trigger: null, icon: "Search" },
    { key: "structure", label: "Structuring argument", trigger: '"sections"', icon: "FileText" },
    { key: "writing", label: "Writing sections", trigger: '"content"', icon: "PenTool" },
    { key: "scoring", label: "Reviewing quality", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  board_update: [
    { key: "analyzing", label: "Analyzing your update", trigger: null, icon: "Search" },
    { key: "structure", label: "Structuring key themes", trigger: '"sections"', icon: "FileText" },
    { key: "writing", label: "Writing sections", trigger: '"content"', icon: "PenTool" },
    { key: "scoring", label: "Reviewing quality", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  investor_update: [
    { key: "analyzing", label: "Analyzing your update", trigger: null, icon: "Search" },
    { key: "headline", label: "Crafting headline", trigger: '"subject"', icon: "Type" },
    { key: "writing", label: "Writing the email", trigger: '"sections"', icon: "Mail" },
    { key: "scoring", label: "Reviewing quality", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  product_vision: [
    { key: "analyzing", label: "Understanding your product", trigger: null, icon: "Search" },
    { key: "structure", label: "Structuring vision", trigger: '"sections"', icon: "Eye" },
    { key: "writing", label: "Writing sections", trigger: '"content"', icon: "PenTool" },
    { key: "scoring", label: "Reviewing quality", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
  evaluate: [
    { key: "analyzing", label: "Reading your materials", trigger: null, icon: "Search" },
    { key: "assessing", label: "Assessing narrative", trigger: '"analysis"', icon: "FileText" },
    { key: "rebuilding", label: "Building recommendations", trigger: '"deckFramework"', icon: "RefreshCw" },
    { key: "scoring", label: "Scoring readiness", trigger: '"score"', icon: "Target" },
    { key: "complete", label: "Done", trigger: null, icon: "CheckCircle" },
  ],
};

const iconMap: Record<string, LucideIcon> = {
  Search, Lightbulb, FileText, Mic, Layout, Target, CheckCircle,
  BarChart3, AlertTriangle, TrendingUp, Crosshair, Grid3X3,
  Eye, AlertCircle, PuzzleIcon, Map, Type, HelpCircle, PenTool, Mail, RefreshCw,
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
  const [targetStepIndex, setTargetStepIndex] = useState(0);
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
  const [steps, setSteps] = useState<StepDef[]>(() => getStepsForContext(selectedMode, isEvaluation));
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [secondsOnStep, setSecondsOnStep] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset step timer when displayed step changes
  useEffect(() => {
    setStepStartTime(Date.now());
    setSecondsOnStep(0);
  }, [displayedStepIndex]);

  // Tick seconds on current step
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

  // Reset on new generation
  useEffect(() => {
    if (isGenerating) {
      setSteps(getStepsForContext(selectedMode, isEvaluation));
      setTargetStepIndex(0);
      setDisplayedStepIndex(0);
      setGenerationDone(false);
    }
  }, [isGenerating, selectedMode, isEvaluation]);

  // Detect mode and step triggers from stream
  useEffect(() => {
    if (!isStreaming || !streamingText) return;

    const modeMatches = [
      { mode: "fundraising", patterns: ['"mode": "fundraising"', '"mode":"fundraising"'] },
      { mode: "board_update", patterns: ['"mode": "board_update"', '"mode":"board_update"'] },
      { mode: "strategy", patterns: ['"mode": "strategy"', '"mode":"strategy"'] },
      { mode: "product_vision", patterns: ['"mode": "product_vision"', '"mode":"product_vision"'] },
      { mode: "investor_update", patterns: ['"mode": "investor_update"', '"mode":"investor_update"'] },
    ];

    for (const { mode, patterns } of modeMatches) {
      if (patterns.some(p => streamingText.includes(p)) && STEP_SETS[mode]) {
        setSteps(prev => {
          if (prev === INITIAL_STEPS || prev !== STEP_SETS[mode]) return STEP_SETS[mode];
          return prev;
        });
        break;
      }
    }

    if (steps === INITIAL_STEPS) return;

    let highest = 0;
    for (let i = 1; i < steps.length - 1; i++) {
      const trigger = steps[i].trigger;
      if (trigger && streamingText.includes(trigger)) {
        highest = i;
      }
    }
    if (highest > 0) setTargetStepIndex(prev => Math.max(prev, highest));
  }, [streamingText, isStreaming, steps]);

  // Pacing: increment displayedStepIndex toward targetStepIndex with 4s delay
  useEffect(() => {
    if (generationDone) return; // skip pacing once done
    if (displayedStepIndex < targetStepIndex) {
      const timer = setTimeout(() => {
        setDisplayedStepIndex(prev => prev + 1);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [displayedStepIndex, targetStepIndex, generationDone]);

  // When streaming ends, skip pacing and jump to Done
  useEffect(() => {
    if (!isStreaming && isGenerating && streamingText.length > 0) {
      setGenerationDone(true);
      setDisplayedStepIndex(steps.length - 1);
    }
  }, [isStreaming, isGenerating, streamingText, steps.length]);

  // Only show completed + active steps. "Done" only when generationDone.
  const visibleSteps = steps.filter((step, index) => {
    if (step.key === "complete") return generationDone;
    return index <= displayedStepIndex;
  });

  return (
    <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
      <div className="space-y-2">
        {visibleSteps.map((step) => {
          const realIndex = steps.indexOf(step);
          const isComplete = displayedStepIndex > realIndex;
          const isActive = displayedStepIndex === realIndex;
          const StepIcon = iconMap[step.icon] || Search;
          const isDoneStep = step.key === "complete";

          return (
            <div key={step.key}>
              <div className="flex items-center gap-3 animate-fade-in">
                <div className={`
                  flex items-center justify-center w-7 h-7 rounded-full transition-all duration-500
                  ${isComplete || isDoneStep ? "bg-emerald-500/20 text-emerald-400" : ""}
                  ${isActive && !isDoneStep ? "bg-primary/20 text-primary" : ""}
                `}>
                  {isComplete || isDoneStep ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <StepIcon className={`w-3.5 h-3.5 ${isActive ? "animate-pulse" : ""}`} />
                  )}
                </div>
                <span className={`
                  text-base transition-all duration-500
                  ${isComplete || isDoneStep ? "text-emerald-400/80" : ""}
                  ${isActive && !isDoneStep ? "text-primary font-medium" : ""}
                `}>
                  {step.label}
                  {isActive && !isComplete && !isDoneStep && isStreaming && secondsOnStep >= 15 && (
                    <span className="text-sm font-normal text-muted-foreground/60 ml-0.5">
                      {secondsOnStep >= 35 ? "— almost done" : "— still working"}
                    </span>
                  )}
                </span>
                {isActive && !isDoneStep && isStreaming && (
                  <div className="flex items-center gap-1 ml-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isStreaming && !generationDone && (
          <button
            onClick={stopGenerating}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 hover:border-muted-foreground transition-colors ml-10"
          >
            Stop generating
          </button>
        )}
      </div>
    </div>
  );
}
