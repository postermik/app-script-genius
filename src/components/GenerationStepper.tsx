import { useEffect, useState } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
  Brain, Lightbulb, FileText, Mic, Layout,
  TrendingUp, Target, CheckCircle,
} from "lucide-react";

const GENERATION_STEPS = [
  { key: "analyzing", label: "Analyzing your input", trigger: null, icon: Brain },
  { key: "thesis", label: "Building investment thesis", trigger: '"thesis"', icon: Lightbulb },
  { key: "narrative", label: "Structuring narrative arc", trigger: '"narrativeStructure"', icon: FileText },
  { key: "pitch", label: "Writing pitch script", trigger: '"pitchScript"', icon: Mic },
  { key: "deck", label: "Generating deck slides", trigger: '"deckFramework"', icon: Layout },
  { key: "market", label: "Analyzing market logic", trigger: '"marketLogic"', icon: TrendingUp },
  { key: "scoring", label: "Scoring capital readiness", trigger: '"score"', icon: Target },
  { key: "complete", label: "Complete", trigger: null, icon: CheckCircle },
];

export function GenerationStepper() {
  const { isStreaming, streamingText, isGenerating } = useDecksmith();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  // Reset on new generation
  useEffect(() => {
    if (isGenerating) {
      setCurrentStepIndex(0);
      setElapsedSeconds(0);
      setShowComplete(false);
    }
  }, [isGenerating]);

  // Detect steps from streaming text
  useEffect(() => {
    if (!isStreaming) return;
    let highest = 0;
    for (let i = 1; i < GENERATION_STEPS.length - 1; i++) {
      const trigger = GENERATION_STEPS[i].trigger;
      if (trigger && streamingText.includes(trigger)) {
        highest = i;
      }
    }
    setCurrentStepIndex(highest);
  }, [streamingText, isStreaming]);

  // Mark complete when streaming finishes but still generating (parsing phase)
  useEffect(() => {
    if (!isStreaming && isGenerating && streamingText.length > 0) {
      setCurrentStepIndex(GENERATION_STEPS.length - 1);
      setShowComplete(true);
    }
  }, [isStreaming, isGenerating, streamingText]);

  // Elapsed timer
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="border border-border rounded-sm p-6 card-gradient animate-fade-in">
      <div className="w-full max-w-md mx-auto py-4">
        <div className="space-y-2.5">
          {GENERATION_STEPS.map((step, index) => {
            const isActive = currentStepIndex === index && !showComplete;
            const isComplete = currentStepIndex > index || showComplete;
            const isPending = !isActive && !isComplete;
            const StepIcon = step.icon;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-3 transition-all duration-500 ${isPending ? "opacity-40" : "opacity-100"}`}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500
                  ${isComplete ? "bg-green-500/20 text-green-400" : ""}
                  ${isActive ? "bg-primary/20 text-primary animate-pulse" : ""}
                  ${isPending ? "bg-muted text-muted-foreground" : ""}
                `}>
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <span className={`
                  text-sm transition-all duration-500
                  ${isComplete ? "text-green-400" : ""}
                  ${isActive ? "text-primary font-medium" : ""}
                  ${isPending ? "text-muted-foreground" : ""}
                `}>
                  {step.label}
                  {isActive && <span className="ml-1.5 animate-pulse">...</span>}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-6 text-xs text-muted-foreground">
          <span>{elapsedSeconds}s elapsed</span>
          {isStreaming && (
            <span className="flex items-center gap-1.5">
              <span className="animate-pulse w-1.5 h-1.5 bg-primary rounded-full" />
              {streamingText.length.toLocaleString()} chars
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
