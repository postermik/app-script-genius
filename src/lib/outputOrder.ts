import type { OutputDeliverable } from "@/types/rhetoric";

/** Ordered fastest-to-slowest for generation and display */
export const OUTPUT_SPEED_ORDER: OutputDeliverable[] = [
  "core_narrative",
  "elevator_pitch",
  "investor_qa",
  "pitch_email",
  "investment_memo",
  "slide_framework",
  "board_memo",
  "key_metrics_summary",
  "strategic_memo",
];

export const OUTPUT_LABELS: Record<OutputDeliverable, string> = {
  core_narrative: "Core Narrative",
  elevator_pitch: "Elevator Pitch",
  pitch_email: "Pitch Emails",
  investor_qa: "Investor Q&A",
  investment_memo: "Investment Memo",
  slide_framework: "Slide Framework",
  board_memo: "Board Memo",
  key_metrics_summary: "Key Metrics",
  strategic_memo: "Strategic Memo",
};

/** Sort an array of outputs by speed order */
export function sortBySpeed(outputs: OutputDeliverable[]): OutputDeliverable[] {
  return [...outputs].sort(
    (a, b) => OUTPUT_SPEED_ORDER.indexOf(a) - OUTPUT_SPEED_ORDER.indexOf(b)
  );
}
