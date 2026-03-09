import { useState, useEffect } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import {
  Mic, Layout, Target, CheckCircle, HelpCircle, Mail, FileText, Search, BookOpen, BarChart3, Lightbulb, Compass,
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
  pitch_email: { key: "pitch_email", label: "Pitch emails", icon: Mail },
  investor_qa: { key: "investor_qa", label: "Investor Q&A", icon: HelpCircle },
  investment_memo: { key: "investment_memo", label: "Investment memo", icon: FileText },
  slide_framework: { key: "slide_framework", label: "Slide framework", icon: Layout },
  board_memo: { key: "board_memo", label: "Board memo", icon: BookOpen },
  key_metrics_summary: { key: "key_metrics_summary", label: "Key metrics", icon: BarChart3 },
  strategic_memo: { key: "strategic_memo", label: "Strategic memo", icon: Lightbulb },
};

export function GenerationStepper() {
  const { isGenerating, isGeneratingSlides, intakeSelections, coreNarrative, outputData } = useDecksmith();
  const [collapsed, setCollapsed] = useState(false);

  // ── All derivations are inline — no useMemo, no stale closures ──

  // 1. Which outputs are selected?
  const fromIntake = intakeSelections?.outputs;
  let selectedOutputs: string[];
  if (fromIntake && fromIntake.length > 0) {
    selectedOutputs = fromIntake;
  } else {
    const fromData = Object.keys(outputData).filter(
      k => !k.endsWith("_error") && !k.endsWith("_rawResponse") && OUTPUT_STEP_MAP[k]
    );
    selectedOutputs = fromData.length > 0 ? fromData : ["slide_framework"];
  }

  // 2. Which outputs are complete? (check actual data presence)
  const completedKeys = new Set<string>();
  const hasCoreNarrative = !!(coreNarrative?.sections?.length);
  if (hasCoreNarrative) {
    completedKeys.add("core_narrative");
    completedKeys.add("_analyzing");
  }
  const outputDataKeys = Object.keys(outputData);
  for (let i = 0; i < outputDataKeys.length; i++) {
    const key = outputDataKeys[i];
    if (!key.endsWith("_error") && !key.endsWith("_rawResponse") && outputData[key]) {
      completedKeys.add(key);
    }
  }
  const stillRunning = isGenerating || isGeneratingSlides;
  if (hasCoreNarrative && !stillRunning) {
    completedKeys.add("_scoring");
  }

  // 3. Build step list
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

  // 4. Derived booleans
  const allDone = !stillRunning && completedKeys.has("_scoring");

  // Find first non-complete step
  let activeStepKey: string | null = null;
  for (const step of steps) {
    const done = step.key === "_analyzing" ? completedKeys.has("core_narrative") : completedKeys.has(step.key);
    if (!done) { activeStepKey = step.key; break; }
  }

  // Auto-collapse after completion
  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(() => setCollapsed(true), 3000);
      return () => clearTimeout(timer);
    }
    setCollapsed(false);
  }, [allDone]);

  // Debug — remove after confirming fix
  console.log("[Stepper] outputData keys:", outputDataKeys, "completedKeys:", Array.from(completedKeys), "stillRunning:", stillRunning);

  if (collapsed) return null;

  return (
    <div className={`flex flex-col transition-opacity duration-500 ${allDone ? "opacity-60" : "animate-fade-in"}`}>
      <div className="space-y-0.5">
        {steps.map((step) => {
          const complete = step.key === "_analyzing" ? completedKeys.has("core_narrative") : completedKeys.has(step.key);
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
