/**
 * slideLayouts.ts - 1:1 mapping from AI layoutRecommendation to renderer.
 * No collapsing. Each recommendation gets its own visual.
 */

export const SLIDE = { W: 10, H: 5.625, MARGIN_L: 0.75, MARGIN_R: 0.75, MARGIN_T: 0.25, MARGIN_B: 0.4 } as const;
export const CONTENT_W = SLIDE.W - SLIDE.MARGIN_L - SLIDE.MARGIN_R;

const CHARS_PER_LINE: Record<number, number> = { 28:44, 24:53, 22:58, 20:63, 18:67, 16:75, 14:82, 13:88, 12:95, 11:105 };

export function estimateLines(text: string, fontSize: number, widthIn: number = CONTENT_W): number {
  const cpl = Math.round((CHARS_PER_LINE[fontSize] || 60) * (widthIn / CONTENT_W));
  return Math.ceil(text.length / cpl);
}
export function estimateHeight(text: string, fontSize: number, widthIn: number = CONTENT_W): number {
  return estimateLines(text, fontSize, widthIn) * ((fontSize / 72) * 1.35);
}

export const CHAR_LIMITS = {
  HEADLINE_MAX: 100, SUBHEADLINE_MAX: 120, BULLET_MAX: 130, CLOSING_MAX: 100, CATEGORY_MAX: 20,
} as const;

export const HEADLINE_STEPS = [
  { maxChars: 40, fontSize: 24 },
  { maxChars: 60, fontSize: 22 },
  { maxChars: 80, fontSize: 20 },
  { maxChars: 100, fontSize: 18 },
];

export function getHeadlineFontSize(text: string): number {
  for (const s of HEADLINE_STEPS) { if (text.length <= s.maxChars) return s.fontSize; }
  return 16;
}

export function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text;
  const t = text.substring(0, max);
  const sp = t.lastIndexOf(" ");
  return (sp > max * 0.7 ? t.substring(0, sp) : t) + "...";
}

// 1:1 mapping from AI recommendation to renderer key
export type LayoutType =
  | "bullets" | "statement" | "data-cards" | "concentric"
  | "matrix" | "timeline" | "icon-columns" | "team" | "staircase";

const LAYOUT_MAP: Record<string, LayoutType> = {
  "full-bleed-statement": "statement",
  "data-cards": "data-cards",
  "concentric-circles": "concentric",
  "competitive-matrix": "matrix",
  "table": "matrix",
  "timeline": "timeline",
  "3-column-with-icons": "icon-columns",
  "team-grid": "team",
  "staircase-chart": "staircase",
  "split-layout": "bullets",
  "flywheel": "icon-columns",
};

export function resolveLayout(recommendation?: string, selectedLayout?: string): LayoutType {
  if (selectedLayout && Object.values(LAYOUT_MAP).includes(selectedLayout as LayoutType)) return selectedLayout as LayoutType;
  if (recommendation && LAYOUT_MAP[recommendation]) return LAYOUT_MAP[recommendation];
  return "bullets";
}

export interface LayoutDefinition { type: LayoutType; label: string; description: string; }

export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  { type: "bullets", label: "Bullets", description: "Headline with supporting points" },
  { type: "statement", label: "Statement", description: "Hero headline, no bullets" },
  { type: "data-cards", label: "Data Cards", description: "Stat callouts with numbers" },
  { type: "concentric", label: "Concentric", description: "Nested rings (TAM/SAM/SOM)" },
  { type: "matrix", label: "Matrix", description: "2x2 comparison grid" },
  { type: "timeline", label: "Timeline", description: "Connected steps" },
  { type: "icon-columns", label: "Icon Columns", description: "Columns with icons" },
  { type: "team", label: "Team", description: "Name and role cards" },
  { type: "staircase", label: "Staircase", description: "Ascending growth steps" },
];