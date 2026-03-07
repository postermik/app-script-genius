import type { OutputDeliverable } from "@/types/rhetoric";

/** Ordered fastest-to-slowest for generation and display */
export const OUTPUT_SPEED_ORDER: OutputDeliverable[] = [
  "elevator_pitch",
  "pitch_email",
  "investor_qa",
  "investment_memo",
  "slide_framework",
];

export const OUTPUT_LABELS: Record<OutputDeliverable, string> = {
  elevator_pitch: "Elevator Pitch",
  pitch_email: "Pitch Emails",
  investor_qa: "Investor Q&A",
  investment_memo: "Investment Memo",
  slide_framework: "Slide Framework",
};

/** Sort an array of outputs by speed order */
export function sortBySpeed(outputs: OutputDeliverable[]): OutputDeliverable[] {
  return [...outputs].sort(
    (a, b) => OUTPUT_SPEED_ORDER.indexOf(a) - OUTPUT_SPEED_ORDER.indexOf(b)
  );
}
