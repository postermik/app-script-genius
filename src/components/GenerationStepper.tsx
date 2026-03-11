import { useState, useEffect } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
  Mic, Layout, Target, CheckCircle, HelpCircle, Mail, FileText, Search, BookOpen, BarChart3, Lightbulb, Compass, ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface OutputStep {
  key: string;
  label: string;
  icon: LucideIcon;
}

const OUTPUT_STEP_MAP: Record<string, OutputStep> = {
  core_narrative: { key: "core_narrative", label: "Core Narrative", icon: Compass },
  elevator_pitch: { key: "elevator_pitch", label: "Elevator pitch", icon: Mic },
  investor_qa: { key: "investor_qa", label: "Investor Q&A", icon: HelpCircle },
  pitch_email: { key: "pitch_email", label: "Pitch emails", icon: Mail },
  investment_memo: { key: "investment_memo", label: "Investment memo", icon: FileText },
  slide_framework: { key: "slide_framework", label: "Slide framework", icon: Layout },
  board_memo: { key: "board_memo", label: "Board memo", icon: BookOpen },
  key_metrics_summary: { key: "key_metrics_summary", label: "Key metrics", icon: BarChart3 },
  strategic_memo: { key: "strategic_memo", label: "Strategic memo", icon: Lightbulb },
};

export function GenerationStepper() {
  const { isGenerating, isGeneratingSlides, intakeSelections, completedOutputs } = useDecksmith();
  const [collapsed, setCollapsed] = useState(false);

  // Map context completedOutputs to stepper keys
  const completedKeys = new Set<string>(completedOutputs);
  if (completedOutputs.has("core_narrative")) completedKeys.add("_analyzing");

  // Build step list from intake selections
  const fromIntake = intakeSelections?.outputs;
  let selectedOutputs: string[];
  if (fromIntake && fromIntake.length > 0) {
    selectedOutputs = fromIntake;
  } else {
    selectedOutputs = ["slide_framework"];
  }

  const steps: OutputStep[] = [
    { key: "_analyzing", label: "Analyzing", icon: Search },
    OUTPUT_STEP_MAP.core_narrative,
  ];
  for (const o of selectedOutputs) {
    if (o !== "core_narrative" && OUTPUT_STEP_MAP[o]) {
      steps.push(OUTPUT_STEP_MAP[o]);
    }
  }
  steps.push({ key: "_scoring", label: "Scoring", icon: Target });

  const stillRunning = isGenerating || isGeneratingSlides;
  const allDone = !stillRunning && completedKeys.has("_scoring");

  // Reset collapsed when a new generation starts
  useEffect(() => {
    if (isGenerating) {
      setCollapsed(false);
    }
  }, [isGenerating]);

  // Default to collapsed when allDone becomes true
  useEffect(() => {
    if (allDone) {
      setCollapsed(true);
    }
  }, [allDone]);

  return (
    <div className={`flex flex-col transition-opacity duration-500 ${allDone ? "opacity-60" : "animate-fade-in"}`}>
      {/* Summary row when all done */}
      {allDone && (
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="flex items-center gap-2 py-1 mb-1 w-full text-left group"
        >
          <div className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-2.5 h-2.5" />
          </div>
          <span className="text-[10px] leading-tight text-emerald-400/80 font-medium flex-1">
            All outputs ready
          </span>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
        </button>
      )}

      {/* Step list — hidden when collapsed */}
      {!collapsed && (
        <div className="space-y-0.5">
          {steps.map((step) => {
            const complete = step.key === "_analyzing" ? completedKeys.has("core_narrative") : completedKeys.has(step.key);
            const completedStepKeys = steps.map(s => completedKeys.has(s.key));
            const lastCompletedIndex = completedStepKeys.lastIndexOf(true);
            const stepIndex = steps.indexOf(step);
            const isActive = !complete && stillRunning && stepIndex === lastCompletedIndex + 1;
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
        </div>
      )}
    </div>
  );
}
