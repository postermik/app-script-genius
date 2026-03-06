import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import type { IntakePurpose, OutputDeliverable, IntakeStage, IntakeSelections } from "@/types/rhetoric";

const PURPOSES: { value: IntakePurpose; label: string }[] = [
  { value: "investor_pitch", label: "Investor Pitch" },
  { value: "board_update", label: "Board Update" },
  { value: "strategy_memo", label: "Strategy Memo" },
  { value: "team_alignment", label: "Team Alignment" },
  { value: "general_narrative", label: "General Narrative" },
];

const OUTPUTS: { value: OutputDeliverable; label: string }[] = [
  { value: "slide_framework", label: "Slide Framework" },
  { value: "elevator_pitch", label: "Elevator Pitch" },
  { value: "investor_qa", label: "Investor Q&A Prep" },
  { value: "pitch_email", label: "Pitch Email Template" },
  { value: "investment_memo", label: "Investment Memo" },
];

const STAGES: { value: IntakeStage; label: string }[] = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

function detectFromInput(input: string): IntakeSelections {
  const lower = input.toLowerCase();

  // Purpose detection
  let purpose: IntakePurpose = "general_narrative";
  if (/fundrais|raise|investor|pitch|round|capital|vc|venture/.test(lower)) purpose = "investor_pitch";
  else if (/board|director/.test(lower)) purpose = "board_update";
  else if (/strateg/.test(lower)) purpose = "strategy_memo";
  else if (/team|alignment|internal|all.hands/.test(lower)) purpose = "team_alignment";

  // Output detection
  const outputs: OutputDeliverable[] = ["slide_framework"];
  if (purpose === "investor_pitch") {
    outputs.push("elevator_pitch", "investor_qa");
  }

  // Stage detection
  let stage: IntakeStage = "seed";
  if (/pre.?seed/.test(lower)) stage = "pre_seed";
  else if (/series\s*b/i.test(lower)) stage = "series_b";
  else if (/series\s*a/i.test(lower)) stage = "series_a";
  else if (/growth|late.stage/.test(lower)) stage = "growth";

  return { purpose, outputs, stage };
}

interface Props {
  rawInput: string;
  onGenerate: (selections: IntakeSelections) => void;
  onCancel: () => void;
}

export function IntakeCard({ rawInput, onGenerate, onCancel }: Props) {
  const [selections, setSelections] = useState<IntakeSelections>(() => detectFromInput(rawInput));

  useEffect(() => {
    setSelections(detectFromInput(rawInput));
  }, [rawInput]);

  const toggleOutput = (val: OutputDeliverable) => {
    setSelections(prev => ({
      ...prev,
      outputs: prev.outputs.includes(val)
        ? prev.outputs.filter(o => o !== val)
        : [...prev.outputs, val],
    }));
  };

  return (
    <div className="animate-fade-in card-gradient border border-border rounded-sm p-6 space-y-5">
      {/* Row 1: Purpose */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2.5">
          What are you preparing for?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PURPOSES.map(p => (
            <button
              key={p.value}
              onClick={() => setSelections(prev => ({ ...prev, purpose: p.value }))}
              className={`text-xs px-3.5 py-2 rounded-full border transition-all font-medium ${
                selections.purpose === p.value
                  ? "border-electric/40 text-foreground bg-electric/10 shadow-sm shadow-electric/5"
                  : "border-border bg-card/60 text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Outputs */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2.5">
          Select your outputs
        </p>
        <div className="flex flex-wrap gap-2">
          {OUTPUTS.map(o => {
            const checked = selections.outputs.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggleOutput(o.value)}
                className={`text-xs px-3.5 py-2 rounded-full border transition-all font-medium flex items-center gap-1.5 ${
                  checked
                    ? "border-electric/40 text-foreground bg-electric/10"
                    : "border-border bg-card/60 text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <span className={`inline-block w-3 h-3 rounded-sm border transition-colors flex-shrink-0 ${
                  checked ? "bg-electric border-electric" : "border-muted-foreground/40"
                }`}>
                  {checked && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-primary-foreground">
                      <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Stage */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2.5">
          Stage
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map(s => (
            <button
              key={s.value}
              onClick={() => setSelections(prev => ({ ...prev, stage: s.value }))}
              className={`text-xs px-3.5 py-2 rounded-full border transition-all font-medium ${
                selections.stage === s.value
                  ? "border-electric/40 text-foreground bg-electric/10 shadow-sm shadow-electric/5"
                  : "border-border bg-card/60 text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="text-xs px-4 py-2.5 rounded-sm font-medium text-secondary-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onGenerate(selections)}
          disabled={selections.outputs.length === 0}
          className="py-2.5 px-6 bg-primary text-primary-foreground font-medium text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-2 glow-blue"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate
        </button>
      </div>
    </div>
  );
}
