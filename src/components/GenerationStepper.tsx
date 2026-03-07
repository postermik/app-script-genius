import { useEffect, useState, useRef } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
  Mic, Layout, Target, CheckCircle, HelpCircle, Mail, FileText, Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OutputDeliverable } from "@/types/rhetoric";
import { OUTPUT_SPEED_ORDER } from "@/lib/outputOrder";

interface OutputStep {
  key: string;
  label: string;
  icon: LucideIcon;
  trigger: string | null;
}

const OUTPUT_STEP_MAP: Record<OutputDeliverable, OutputStep> = {
  elevator_pitch: { key: "elevator_pitch", label: "Elevator pitch", icon: Mic, trigger: '"pitchScript"' },
  pitch_email: { key: "pitch_email", label: "Pitch emails", icon: Mail, trigger: '"pitchScript"' },
  investor_qa: { key: "investor_qa", label: "Investor Q&A", icon: HelpCircle, trigger: '"score"' },
  investment_memo: { key: "investment_memo", label: "Investment memo", icon: FileText, trigger: '"narrativeStructure"' },
  slide_framework: { key: "slide_framework", label: "Slide framework", icon: Layout, trigger: '"deckFramework"' },
};

const CORE_STEPS: OutputStep[] = [
  { key: "_analyzing", label: "Analyzing", icon: Search, trigger: null },
  { key: "_scoring", label: "Scoring", icon: Target, trigger: '"score"' },
];

function buildSteps(selectedOutputs: OutputDeliverable[]): OutputStep[] {
  const sorted = [...selectedOutputs].sort(
    (a, b) => OUTPUT_SPEED_ORDER.indexOf(a) - OUTPUT_SPEED_ORDER.indexOf(b)
  );
  return [
    CORE_STEPS[0], // analyzing
    ...sorted.map(o => OUTPUT_STEP_MAP[o]),
    CORE_STEPS[1], // scoring
    { key: "_done", label: "Done", icon: CheckCircle, trigger: null },
  ];
}

export function GenerationStepper() {
  const { isStreaming, streamingText, isGenerating, stopGenerating, intakeSelections } = useDecksmith();
  const selectedOutputs = intakeSelections?.outputs || ["slide_framework"];

  const [steps] = useState<OutputStep[]>(() => buildSteps(selectedOutputs));
  const [targetStepIndex, setTargetStepIndex] = useState(0);
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
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

  // Detect step triggers from stream
  useEffect(() => {
    if (!isStreaming || !streamingText) return;
    let highest = 0;
    for (let i = 1; i < steps.length - 1; i++) {
      const trigger = steps[i].trigger;
      if (trigger && streamingText.includes(trigger)) {
        highest = i;
      }
    }
    if (highest > 0) setTargetStepIndex(prev => Math.max(prev, highest));
  }, [streamingText, isStreaming, steps]);

  // Pacing: increment displayedStepIndex toward targetStepIndex with 3s delay
  useEffect(() => {
    if (generationDone) return;
    if (displayedStepIndex < targetStepIndex) {
      const timer = setTimeout(() => {
        setDisplayedStepIndex(prev => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [displayedStepIndex, targetStepIndex, generationDone]);

  // When streaming ends, jump to Done
  useEffect(() => {
    if (!isStreaming && isGenerating && streamingText.length > 0) {
      setGenerationDone(true);
      setDisplayedStepIndex(steps.length - 1);
    }
  }, [isStreaming, isGenerating, streamingText, steps.length]);

  // Show completed + active steps. "Done" only when generationDone.
  const visibleSteps = steps.filter((step, index) => {
    if (step.key === "_done") return generationDone;
    return index <= displayedStepIndex;
  });

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="space-y-0.5">
        {visibleSteps.map((step) => {
          const realIndex = steps.indexOf(step);
          const isComplete = displayedStepIndex > realIndex;
          const isActive = displayedStepIndex === realIndex;
          const StepIcon = step.icon;
          const isDoneStep = step.key === "_done";

          return (
            <div
              key={step.key}
              className="flex items-center gap-2 py-1 animate-fade-in"
            >
              <div className={`
                flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-all duration-500
                ${isComplete || isDoneStep ? "bg-emerald-500/20 text-emerald-400" : ""}
                ${isActive && !isDoneStep ? "bg-primary/15 text-primary" : ""}
              `}>
                {isComplete || isDoneStep ? (
                  <CheckCircle className="w-2.5 h-2.5" />
                ) : (
                  <StepIcon className={`w-2.5 h-2.5 ${isActive ? "animate-pulse" : ""}`} />
                )}
              </div>
              <span className={`
                text-[11px] leading-tight transition-all duration-500
                ${isComplete || isDoneStep ? "text-emerald-400/80" : ""}
                ${isActive && !isDoneStep ? "text-primary font-medium" : ""}
                ${!isComplete && !isActive && !isDoneStep ? "text-muted-foreground" : ""}
              `}>
                {step.label}
              </span>
              {isActive && !isDoneStep && isStreaming && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          );
        })}

        {isStreaming && !generationDone && secondsOnStep >= 15 && (
          <p className="text-[10px] text-muted-foreground/50 pl-7">
            {secondsOnStep >= 35 ? "Almost done…" : "Still working…"}
          </p>
        )}

        {isStreaming && !generationDone && (
          <button
            onClick={stopGenerating}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded-sm px-2 py-0.5 hover:border-muted-foreground/50 transition-colors ml-7"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
