import { useEffect, useState, useRef } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
  Mic, Layout, Target, CheckCircle, HelpCircle, Mail, FileText, Search, BookOpen, BarChart3, Lightbulb, Compass,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OutputDeliverable } from "@/types/rhetoric";
import { OUTPUT_SPEED_ORDER } from "@/lib/outputOrder";

interface OutputStep {
  key: string;
  label: string;
  icon: LucideIcon;
}

const OUTPUT_STEP_MAP: Record<OutputDeliverable, OutputStep> = {
  core_narrative: { key: "core_narrative", label: "Core Narrative", icon: Compass },
  elevator_pitch: { key: "elevator_pitch", label: "Elevator pitch", icon: Mic },
  pitch_email: { key: "pitch_email", label: "Pitch emails", icon: Mail },
  investor_qa: { key: "investor_qa", label: "Investor Q&A", icon: HelpCircle },
  investment_memo: { key: "investment_memo", label: "Investment memo", icon: FileText },
  slide_framework: { key: "slide_framework", label: "Slide framework", icon: Layout },
  board_memo: { key: "board_memo", label: "Board memo", icon: BookOpen },
  key_metrics_summary: { key: "key_metrics_summary", label: "Key metrics", icon: BarChart3 },
  strategic_memo: { key: "strategic_memo", label: "Strategic memo", icon: Lightbulb },
};

function buildSteps(selectedOutputs: OutputDeliverable[]): OutputStep[] {
  // Core narrative is always first
  const steps: OutputStep[] = [
    { key: "_analyzing", label: "Analyzing", icon: Search },
    OUTPUT_STEP_MAP.core_narrative,
  ];
  
  // Add selected outputs sorted by speed
  const sorted = [...selectedOutputs]
    .filter(o => o !== "core_narrative")
    .sort((a, b) => OUTPUT_SPEED_ORDER.indexOf(a) - OUTPUT_SPEED_ORDER.indexOf(b));
  
  sorted.forEach(o => {
    if (OUTPUT_STEP_MAP[o]) steps.push(OUTPUT_STEP_MAP[o]);
  });
  
  steps.push({ key: "_scoring", label: "Scoring", icon: Target });
  steps.push({ key: "_done", label: "Done", icon: CheckCircle });
  
  return steps;
}

export function GenerationStepper() {
  const { isStreaming, streamingText, isGenerating, stopGenerating, intakeSelections, completedOutputs } = useDecksmith();
  const selectedOutputs = intakeSelections?.outputs || ["slide_framework"];

  const [steps] = useState<OutputStep[]>(() => buildSteps(selectedOutputs));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);

  // Advance stepper based on completed outputs
  useEffect(() => {
    if (!isGenerating) return;
    
    let highest = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.key === "_analyzing" && streamingText.length > 100) highest = Math.max(highest, 1);
      if (step.key === "core_narrative" && completedOutputs.has("core_narrative")) highest = Math.max(highest, i + 1);
      if (completedOutputs.has(step.key as OutputDeliverable)) highest = Math.max(highest, i + 1);
      if (step.key === "_scoring" && completedOutputs.has("_scoring" as any)) highest = Math.max(highest, i + 1);
    }
    setCurrentStepIndex(prev => Math.max(prev, highest));
  }, [completedOutputs, streamingText, isGenerating, steps]);

  // When generation ends, jump to done
  useEffect(() => {
    if (!isGenerating && generationDone === false && currentStepIndex > 0) {
      setGenerationDone(true);
      setCurrentStepIndex(steps.length - 1);
    }
  }, [isGenerating]);

  const visibleSteps = steps.filter((step, index) => {
    if (step.key === "_done") return generationDone;
    return index <= currentStepIndex;
  });

  return (
    <div className="flex flex-col animate-fade-in">
      <div className="space-y-0.5">
        {visibleSteps.map((step) => {
          const realIndex = steps.indexOf(step);
          const isComplete = currentStepIndex > realIndex;
          const isActive = currentStepIndex === realIndex;
          const StepIcon = step.icon;
          const isDoneStep = step.key === "_done";

          return (
            <div key={step.key} className="flex items-center gap-2 py-0.5 animate-fade-in">
              <div className={`
                flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all duration-500
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
                text-[10px] leading-tight transition-all duration-500
                ${isComplete || isDoneStep ? "text-emerald-400/80" : ""}
                ${isActive && !isDoneStep ? "text-primary font-medium" : ""}
                ${!isComplete && !isActive && !isDoneStep ? "text-muted-foreground" : ""}
              `}>
                {step.label}
              </span>
              {isActive && !isDoneStep && isGenerating && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          );
        })}

        {isGenerating && !generationDone && (
          <button
            onClick={stopGenerating}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded-sm px-2 py-0.5 hover:border-muted-foreground/50 transition-colors ml-6"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
