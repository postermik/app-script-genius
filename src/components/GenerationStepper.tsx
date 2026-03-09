import { useMemo, useState, useEffect } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
  Mic, Layout, Target, CheckCircle, HelpCircle, Mail, FileText, Search, BookOpen, BarChart3, Lightbulb, Compass,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OutputDeliverable } from "@/types/rhetoric";

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

export function GenerationStepper() {
  const { isGenerating, isGeneratingSlides, generationOutputs, completedOutputs } = useDecksmith();
  const selectedOutputs = generationOutputs.length > 0 ? generationOutputs : ["slide_framework"] as OutputDeliverable[];
  const [collapsed, setCollapsed] = useState(false);

  const steps = useMemo(() => {
    const result: OutputStep[] = [
      { key: "_analyzing", label: "Analyzing", icon: Search },
      OUTPUT_STEP_MAP.core_narrative,
    ];
    selectedOutputs
      .filter(o => o !== "core_narrative")
      .forEach(o => { if (OUTPUT_STEP_MAP[o]) result.push(OUTPUT_STEP_MAP[o]); });
    result.push({ key: "_scoring", label: "Scoring", icon: Target });
    return result;
  }, [selectedOutputs.join(",")]);

  const stillRunning = isGenerating || isGeneratingSlides;

  const isStepComplete = (step: OutputStep): boolean => {
    if (step.key === "_analyzing") return completedOutputs.has("core_narrative");
    return completedOutputs.has(step.key);
  };

  const allDone = !stillRunning && completedOutputs.has("_scoring");

  // Auto-collapse 3s after all done
  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(() => setCollapsed(true), 3000);
      return () => clearTimeout(timer);
    }
    setCollapsed(false);
  }, [allDone]);

  // Find the first non-complete step to mark as active
  const activeStepKey = useMemo(() => {
    for (const step of steps) {
      if (!isStepComplete(step)) return step.key;
    }
    return null;
  }, [steps, completedOutputs]);

  console.log("[Stepper] completedOutputs:", Array.from(completedOutputs), "generationOutputs:", generationOutputs);

  if (collapsed) return null;

  return (
    <div className={`flex flex-col transition-opacity duration-500 ${allDone ? "opacity-60" : "animate-fade-in"}`}>
      <div className="space-y-0.5">
        {steps.map((step) => {
          const complete = isStepComplete(step);
          const isActive = step.key === activeStepKey && stillRunning;
          const isPending = !complete && !isActive;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${isPending ? "opacity-40" : "animate-fade-in"}`}>
              <div className={`
                flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all duration-300
                ${complete ? "bg-emerald-500/20 text-emerald-400" : ""}
                ${isActive ? "bg-primary/15 text-primary" : ""}
                ${isPending ? "bg-muted/30 text-muted-foreground" : ""}
              `}>
                {complete ? (
                  <CheckCircle className="w-2.5 h-2.5" />
                ) : (
                  <StepIcon className={`w-2.5 h-2.5 ${isActive ? "animate-pulse" : ""}`} />
                )}
              </div>
              <span className={`
                text-[10px] leading-tight transition-all duration-300
                ${complete ? "text-emerald-400/80" : ""}
                ${isActive ? "text-primary font-medium" : ""}
                ${isPending ? "text-muted-foreground" : ""}
              `}>
                {step.label}
              </span>
              {isActive && stillRunning && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>
          );
        })}

        {/* Final complete row */}
        {allDone && (
          <div className="flex items-center gap-2 py-0.5 animate-fade-in">
            <div className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-2.5 h-2.5" />
            </div>
            <span className="text-[10px] leading-tight text-emerald-400/80 font-medium">Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}
