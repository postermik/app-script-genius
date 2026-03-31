import { useState, useEffect, useRef } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import { toast } from "sonner";
import {
  Mic, Layout, Target, CheckCircle, HelpCircle, Mail, FileText,
  BookOpen, BarChart3, Lightbulb, Compass, ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { INTENT_OUTPUTS } from "@/types/rhetoric";
import type { IntakePurpose } from "@/types/rhetoric";

// stepper v3

interface OutputStep {
  key: string;
  label: string;
  icon: LucideIcon;
}

const OUTPUT_STEP_MAP: Record<string, OutputStep> = {
  core_narrative:     { key: "core_narrative",     label: "Core Narrative",   icon: Compass   },
  elevator_pitch:     { key: "elevator_pitch",     label: "Elevator pitch",   icon: Mic       },
  investor_qa:        { key: "investor_qa",        label: "Investor Q&A",     icon: HelpCircle},
  pitch_email:        { key: "pitch_email",        label: "Pitch emails",     icon: Mail      },
  investment_memo:    { key: "investment_memo",    label: "Investment memo",  icon: FileText  },
  slide_framework:    { key: "slide_framework",    label: "Slide framework",  icon: Layout    },
  board_memo:         { key: "board_memo",         label: "Board memo",       icon: BookOpen  },
  key_metrics_summary:{ key: "key_metrics_summary",label: "Key metrics",      icon: BarChart3 },
  strategic_memo:     { key: "strategic_memo",     label: "Strategic memo",   icon: Lightbulb },
};

// Get purpose-aware label for a given output key
function getStepLabel(key: string, purpose?: IntakePurpose): string {
  if (purpose) {
    const match = INTENT_OUTPUTS[purpose]?.find(o => o.value === key);
    if (match) return match.label;
  }
  return OUTPUT_STEP_MAP[key]?.label || key.replace(/_/g, " ");
}

// Get purpose-aware step
function getStep(key: string, purpose?: IntakePurpose): OutputStep {
  const base = OUTPUT_STEP_MAP[key] || { key, label: key.replace(/_/g, " "), icon: Target };
  return { ...base, label: getStepLabel(key, purpose) };
}

export function GenerationStepper() {
  const { isGenerating, isGeneratingSlides, intakeSelections, completedOutputs, isGeneratingOutputs } = useDecksmith();
  const [collapsed, setCollapsed] = useState(false);

  const completedKeys = new Set<string>(completedOutputs);
  const purpose = intakeSelections?.purpose;

  const fromIntake = intakeSelections?.outputs;
  const selectedOutputs: string[] = fromIntake && fromIntake.length > 0 ? fromIntake : ["slide_framework"];

  const steps: OutputStep[] = [getStep("core_narrative", purpose)];
  for (const o of selectedOutputs) {
    if (o !== "core_narrative" && OUTPUT_STEP_MAP[o]) steps.push(getStep(o, purpose));
  }
  steps.push({ key: "_scoring", label: "Scoring", icon: Target });

  const stillRunning = isGenerating || isGeneratingSlides || isGeneratingOutputs;
  const allDone = !stillRunning && completedKeys.has("_scoring");

  // Track previously completed keys to detect new completions
  const prevCompletedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only fire toasts during active generation, not on project restore
    if (!stillRunning) {
      prevCompletedRef.current = new Set(completedKeys);
      return;
    }

    const prev = prevCompletedRef.current;
    const newKeys = [...completedKeys].filter(k => !prev.has(k));

    for (const key of newKeys) {
      const label = key === "_scoring" ? "Scoring complete" : `${getStepLabel(key, purpose)} done`;
      if (key === "core_narrative") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          toast.success(label, { duration: 3000 });
        }, 400);
      } else {
        toast.success(label, { duration: 3000 });
      }
    }

    prevCompletedRef.current = new Set(completedKeys);
  }, [completedOutputs]);

  // Reset prevCompletedRef when a new generation starts
  useEffect(() => {
    if (isGenerating) {
      prevCompletedRef.current = new Set();
      setCollapsed(false);
    }
  }, [isGenerating]);

  // Auto-collapse when done
  useEffect(() => {
    if (allDone) setCollapsed(true);
  }, [allDone]);

  const getActiveStepKey = (): string | null => {
    if (!stillRunning) return null;
    for (const step of steps) {
      if (!completedKeys.has(step.key)) return step.key;
    }
    return null;
  };

  const activeStepKey = getActiveStepKey();

  return (
    <div className={`flex flex-col transition-opacity duration-500 ${allDone ? "opacity-60" : "animate-fade-in"}`}>
      {/* Summary row when all done */}
      {allDone && (
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex items-center gap-2 py-1 mb-1 w-full text-left group"
        >
          <div className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-2.5 h-2.5" />
          </div>
          <span className="text-[10px] leading-tight text-emerald-400/80 font-medium flex-1">All outputs ready</span>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} />
        </button>
      )}

      {/* Step list */}
      {!collapsed && (
        <div className="space-y-0.5">
          {steps.map((step) => {
            const complete = completedKeys.has(step.key);
            const isActive = !complete && step.key === activeStepKey;
            const isPending = !complete && !isActive;
            const StepIcon = step.icon;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${isPending ? "opacity-40" : "animate-fade-in"}`}
              >
                <div className={`
                  flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all duration-300
                  ${complete ? "bg-emerald-500/20 text-emerald-400" : ""}
                  ${isActive  ? "bg-primary/15 text-primary" : ""}
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
                  ${isActive  ? "text-primary font-medium" : ""}
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