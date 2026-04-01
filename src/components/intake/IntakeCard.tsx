import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import type { IntakePurpose, OutputDeliverable, IntakeStage, IntakeSelections } from "@/types/rhetoric";
import { INTENT_OUTPUTS } from "@/types/rhetoric";

const PURPOSES: { value: IntakePurpose; label: string }[] = [
  { value: "fundraising", label: "Fundraising" },
  { value: "sales", label: "Sales" },
  { value: "board_meeting", label: "Board Meeting" },
  { value: "strategy", label: "Strategy" },
];

const STAGES: { value: IntakeStage; label: string }[] = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

function detectFromInput(input: string): IntakeSelections {
  // Board meeting requires STRONG, explicit signals.
  const boardSignals = [
    /board of directors/i,
    /board meeting/i,
    /preparing (?:a |my |the |an )?board update/i,
    /writing (?:a |my |the |an )?board update/i,
    /\bboard update for (?:the |our )?board/i,
    /board deck/i,
    /board presentation/i,
    /reporting to (?:my |the )?board/i,
    /presenting to (?:my |the )?board/i,
    /preparing for (?:a |my |the )?board/i,
    /upcoming board/i,
    /next board/i,
  ];

  const strategySignals = [
    /strategic plan/i,
    /strategy memo/i,
    /strategic memo/i,
    /go.to.market strategy/i,
    /strategic initiative/i,
    /annual plan/i,
    /\bokr\b/i,
  ];

  const salesSignals = [
    /sales deck/i,
    /sales pitch/i,
    /sales presentation/i,
    /sales call/i,
    /sell(?:ing)? (?:our|my|the) /i,
    /pitch(?:ing)? (?:to )?(?:clients|customers|prospects|companies|brands)/i,
    /client presentation/i,
    /proposal for/i,
    /close (?:the |a )?deal/i,
    /prospecting/i,
    /outbound sales/i,
    /service offering/i,
    /consulting pitch/i,
    /\brfp\b/i,
    /pitch(?:ing)? (?:our|my) services/i,
    /win(?:ning)? (?:the |a )?(?:client|account|contract|deal)/i,
    /business development/i,
    /(?:our|my) (?:agency|firm|consultancy|practice) /i,
    /prospective clients/i,
    /discovery call/i,
    /book a (?:\d+-minute )?(?:call|meeting|demo)/i,
    /engagement model/i,
    /not (?:a |an )?(?:fundrais|investor|pitch deck)/i,
    /for (?:prospective |potential )?(?:clients|customers|buyers|prospects)/i,
    /(?:three|3|two|2) (?:engagement|service|pricing) (?:model|tier|option|plan)/i,
    /done.for.you/i,
    /client(?:s)? per month/i,
    /measurable ROI/i,
  ];

  // Count signal matches per purpose
  const boardScore = boardSignals.filter(re => re.test(input)).length;
  const strategyScore = strategySignals.filter(re => re.test(input)).length;
  const salesScore = salesSignals.filter(re => re.test(input)).length;

  const fundraisingKeywords = [
    /rais(ing|e)/i, /fundrais/i, /investor/i, /pre.?seed/i, /seed round/i,
    /series\s*[abcde]/i, /\bsafe\b/i, /valuation/i, /pitch deck/i,
    /pitch email/i, /\bcapital\b/i, /\bventure\b/i, /\bvc\b/i,
  ];
  const fundraisingScore = fundraisingKeywords.filter(re => re.test(input)).length;

  let purpose: IntakePurpose;
  if (salesScore > 0 && salesScore >= fundraisingScore && salesScore >= boardScore && salesScore >= strategyScore) {
    purpose = "sales";
  } else if (fundraisingScore > 0 && fundraisingScore >= boardScore) {
    purpose = "fundraising";
  } else if (boardScore > strategyScore && boardScore > 0) {
    purpose = "board_meeting";
  } else if (strategyScore > 0) {
    purpose = "strategy";
  } else {
    purpose = "fundraising";
  }

  const outputs: OutputDeliverable[] = INTENT_OUTPUTS[purpose]
    .filter(o => o.preSelected)
    .map(o => o.value);

  const lower = input.toLowerCase();
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
  defaultPurpose?: IntakePurpose;
}

export function IntakeCard({ rawInput, onGenerate, onCancel, defaultPurpose }: Props) {
  const [selections, setSelections] = useState<IntakeSelections>(() => {
    const detected = detectFromInput(rawInput);
    if (defaultPurpose) {
      const preSelected = INTENT_OUTPUTS[defaultPurpose]
        .filter(o => o.preSelected)
        .map(o => o.value);
      return { ...detected, purpose: defaultPurpose, outputs: preSelected };
    }
    return detected;
  });

  useEffect(() => {
    const detected = detectFromInput(rawInput);
    if (defaultPurpose) {
      const preSelected = INTENT_OUTPUTS[defaultPurpose]
        .filter(o => o.preSelected)
        .map(o => o.value);
      setSelections({ ...detected, purpose: defaultPurpose, outputs: preSelected });
    } else {
      setSelections(detected);
    }
  }, [rawInput, defaultPurpose]);

  const handlePurposeChange = (purpose: IntakePurpose) => {
    const preSelected = INTENT_OUTPUTS[purpose]
      .filter(o => o.preSelected)
      .map(o => o.value);
    setSelections(prev => ({ ...prev, purpose, outputs: preSelected }));
  };

  const toggleOutput = (val: OutputDeliverable) => {
    setSelections(prev => ({
      ...prev,
      outputs: prev.outputs.includes(val)
        ? prev.outputs.filter(o => o !== val)
        : [...prev.outputs, val],
    }));
  };

  const intentOutputs = INTENT_OUTPUTS[selections.purpose];

  return (
    <div className="animate-fade-in card-gradient border border-border rounded-lg p-6 space-y-5">
      {/* Row 1: Purpose */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2.5">
          What are you preparing for?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PURPOSES.map(p => (
            <button
              key={p.value}
              onClick={() => handlePurposeChange(p.value)}
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

      {/* Row 2: Contextual Outputs */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2.5">
          Select your outputs
        </p>
        <p className="text-[10px] text-muted-foreground/60 mb-2">
          Core Narrative is always generated as the foundation for all outputs.
        </p>
        <div className="grid grid-cols-3 gap-2 transition-all duration-300" key={selections.purpose}>
          {intentOutputs.map(o => {
            const checked = selections.outputs.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => toggleOutput(o.value)}
                className={`text-xs px-3.5 py-2 rounded-full border transition-all font-medium flex items-center gap-1.5 animate-fade-in ${
                  checked
                    ? "border-electric/40 text-foreground bg-electric/10"
                    : "border-border bg-card/60 text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block w-3 h-3 rounded-sm border transition-colors flex-shrink-0 ${
                    checked ? "bg-electric border-electric" : "border-muted-foreground/40"
                  }`}
                >
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

      {/* Row 3: Stage (fundraising only) */}
      {selections.purpose === "fundraising" && (
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
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="text-xs px-4 py-2.5 rounded-lg font-medium text-secondary-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onGenerate(selections)}
          disabled={selections.outputs.length === 0}
          className="py-2.5 px-6 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center gap-2 glow-blue"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate
        </button>
      </div>
    </div>
  );
}