export const SLIDE = { W: 10, H: 5.625, MARGIN_L: 0.6, MARGIN_R: 0.6, MARGIN_T: 0.25, MARGIN_B: 0.35 } as const;
export const CONTENT_W = SLIDE.W - SLIDE.MARGIN_L - SLIDE.MARGIN_R;
export const CHAR_LIMITS = { HEADLINE_MAX: 100, SUBHEADLINE_MAX: 120, BULLET_MAX: 140, CLOSING_MAX: 100, CATEGORY_MAX: 20 } as const;
export const HEADLINE_STEPS = [{ maxChars: 40, fontSize: 28 },{ maxChars: 60, fontSize: 24 },{ maxChars: 80, fontSize: 22 },{ maxChars: 100, fontSize: 18 }];
export function getHeadlineFontSize(text: string): number { for (const s of HEADLINE_STEPS) { if (text.length <= s.maxChars) return s.fontSize; } return 16; }
export function truncate(text: string, max: number): string { if (!text || text.length <= max) return text; const t = text.substring(0, max); const sp = t.lastIndexOf(" "); return (sp > max * 0.7 ? t.substring(0, sp) : t) + "..."; }
export function estimateHeight(text: string, fontSize: number, widthIn: number = CONTENT_W): number { const lines = Math.ceil(text.length / Math.round(60 * (widthIn / CONTENT_W))); return lines * ((fontSize / 72) * 1.35); }

export type LayoutType =
  | "bullets" | "bullets-two-column" | "bullets-accent" | "bullets-numbered"
  | "statement"
  | "data-cards"
  | "concentric"
  | "matrix"
  | "flywheel"
  | "icon-columns"
  | "team"
  | "staircase";

export function resolveLayout(recommendation?: string, selectedLayout?: string, categoryLabel?: string, _dataPoints?: string[], slideIndex?: number, totalSlides?: number): LayoutType {
  // 1. User manually picked a layout from the dropdown? Use it.
  const ALL_TYPES: LayoutType[] = ["bullets","bullets-two-column","bullets-accent","bullets-numbered","statement","data-cards","concentric","matrix","flywheel","icon-columns","team","staircase"];
  if (selectedLayout && ALL_TYPES.includes(selectedLayout as LayoutType)) return selectedLayout as LayoutType;
  // 2. AI recommended a layout? Use it (map old names to current types).
  if (recommendation) {
    const map: Record<string, LayoutType> = {
      "bullets": "bullets",
      "bullets-two-column": "bullets-two-column",
      "bullets-accent": "bullets-accent",
      "bullets-numbered": "bullets-numbered",
      "full-bleed-statement": "statement", "statement": "statement",
      "data-cards": "data-cards", "concentric-circles": "concentric", "concentric": "concentric",
      "competitive-matrix": "matrix", "matrix": "matrix",
      "flywheel": "flywheel", "timeline": "flywheel",
      "staircase": "staircase", "milestones": "staircase",
      "3-column-with-icons": "icon-columns", "icon-columns": "icon-columns",
      "team-grid": "team", "team": "team",
      "split-layout": "bullets",
    };
    const mapped = map[recommendation];
    if (mapped) return mapped;
  }
  // 3. Position-aware fallback: first and last slide default to statement, everything else bullets.
  if (slideIndex === 0) return "statement";
  if (totalSlides != null && totalSlides > 0 && slideIndex === totalSlides - 1) return "statement";
  return "bullets";
}

export interface LayoutDefinition { type: LayoutType; label: string; parent?: LayoutType; }
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  { type: "bullets", label: "Bullets" },
  { type: "bullets-two-column", label: "Two Column", parent: "bullets" },
  { type: "bullets-accent", label: "Accent Bar", parent: "bullets" },
  { type: "bullets-numbered", label: "Numbered", parent: "bullets" },
  { type: "statement", label: "Statement" },
  { type: "data-cards", label: "Data Cards" },
  { type: "concentric", label: "Concentric" },
  { type: "matrix", label: "Matrix" },
  { type: "flywheel", label: "Flywheel" },
  { type: "icon-columns", label: "Columns" },
  { type: "team", label: "Team" },
  { type: "staircase", label: "Staircase" },
];