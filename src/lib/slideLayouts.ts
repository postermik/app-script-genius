export const SLIDE = { W: 10, H: 5.625, MARGIN_L: 0.6, MARGIN_R: 0.6, MARGIN_T: 0.25, MARGIN_B: 0.35 } as const;
export const CONTENT_W = SLIDE.W - SLIDE.MARGIN_L - SLIDE.MARGIN_R;
export const CHAR_LIMITS = { HEADLINE_MAX: 100, SUBHEADLINE_MAX: 120, BULLET_MAX: 140, CLOSING_MAX: 100, CATEGORY_MAX: 20 } as const;
export const HEADLINE_STEPS = [{ maxChars: 40, fontSize: 22 },{ maxChars: 60, fontSize: 20 },{ maxChars: 80, fontSize: 18 },{ maxChars: 100, fontSize: 16 }];
export function getHeadlineFontSize(text: string): number { for (const s of HEADLINE_STEPS) { if (text.length <= s.maxChars) return s.fontSize; } return 14; }
export function truncate(text: string, max: number): string { if (!text || text.length <= max) return text; const t = text.substring(0, max); const sp = t.lastIndexOf(" "); return (sp > max * 0.7 ? t.substring(0, sp) : t) + "..."; }
export function estimateHeight(text: string, fontSize: number, widthIn: number = CONTENT_W): number { const lines = Math.ceil(text.length / Math.round(60 * (widthIn / CONTENT_W))); return lines * ((fontSize / 72) * 1.35); }

export type LayoutType = "bullets" | "statement" | "data-cards" | "concentric" | "matrix" | "flywheel" | "icon-columns" | "team" | "staircase";

export function resolveLayout(recommendation?: string, selectedLayout?: string, categoryLabel?: string, _dataPoints?: string[]): LayoutType {
  if (selectedLayout && ["bullets","statement","data-cards","concentric","matrix","flywheel","icon-columns","team","staircase"].includes(selectedLayout)) return selectedLayout as LayoutType;
  const cat = (categoryLabel || "").toLowerCase().trim();
  if (cat === "market") return "concentric";
  if (cat === "competition" || cat === "competitive landscape") return "matrix";
  if (cat === "go-to-market" || cat === "gtm") return "flywheel";
  if (cat === "financials" || cat === "financial plan") return "staircase";
  return "bullets";
}

export interface LayoutDefinition { type: LayoutType; label: string; }
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  { type: "bullets", label: "Bullets" },{ type: "statement", label: "Statement" },{ type: "data-cards", label: "Data Cards" },
  { type: "concentric", label: "Concentric" },{ type: "matrix", label: "Matrix" },{ type: "flywheel", label: "Flywheel" },
  { type: "icon-columns", label: "Columns" },{ type: "team", label: "Team" },{ type: "staircase", label: "Staircase" },
];