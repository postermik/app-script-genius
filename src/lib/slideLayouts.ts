/**
 * slideLayouts.ts
 *
 * Shared layout definitions for slide rendering.
 * Consumed by exportPptx.ts (PPTX rendering) and future SlideCanvas.tsx (HTML preview).
 *
 * Every layout defines:
 *  - element positions and sizes (in inches for PPTX, convertible to CSS)
 *  - character limits per element
 *  - font sizes with auto-step-down rules
 *  - shape definitions (visual elements to render)
 */

// ── Slide dimensions (16:9 at 10in x 5.625in) ──
export const SLIDE = {
  W: 10,
  H: 5.625,
  MARGIN_L: 0.75,
  MARGIN_R: 0.75,
  MARGIN_T: 0.25,
  MARGIN_B: 0.4,
} as const;

export const CONTENT_W = SLIDE.W - SLIDE.MARGIN_L - SLIDE.MARGIN_R; // 8.5in

// ── Font sizing with auto-step-down ──
// Approximate chars-per-line at a given pt size on CONTENT_W (8.5in, Arial)
const CHARS_PER_LINE: Record<number, number> = {
  36: 35,
  32: 40,
  28: 44,
  24: 53,
  22: 58,
  20: 63,
  18: 67,
  16: 75,
  14: 82,
  13: 88,
  12: 95,
  11: 105,
};

export function estimateLines(text: string, fontSize: number, widthIn: number = CONTENT_W): number {
  const cplFull = CHARS_PER_LINE[fontSize] || Math.round(widthIn / (fontSize * 0.012));
  const cpl = Math.round(cplFull * (widthIn / CONTENT_W));
  return Math.ceil(text.length / cpl);
}

export function estimateHeight(text: string, fontSize: number, widthIn: number = CONTENT_W): number {
  const lineHeightIn = (fontSize / 72) * 1.35; // 1.35x line height
  return estimateLines(text, fontSize, widthIn) * lineHeightIn;
}

// ── Character limits ──
export const CHAR_LIMITS = {
  HEADLINE_IDEAL: 60,       // prompt target
  HEADLINE_MAX: 100,        // hard truncate in export
  SUBHEADLINE_IDEAL: 80,    // prompt target
  SUBHEADLINE_MAX: 120,     // hard truncate
  BULLET_IDEAL: 90,         // prompt target
  BULLET_MAX: 130,          // hard truncate
  CLOSING_MAX: 100,         // hard truncate
  CATEGORY_MAX: 20,         // category labels are short
} as const;

// ── Font size step-down for headlines ──
export interface FontStep {
  maxChars: number;
  fontSize: number;
}

export const HEADLINE_STEPS: FontStep[] = [
  { maxChars: 50, fontSize: 28 },
  { maxChars: 70, fontSize: 24 },
  { maxChars: 90, fontSize: 22 },
  { maxChars: 120, fontSize: 20 },
];

export function getHeadlineFontSize(text: string): number {
  for (const step of HEADLINE_STEPS) {
    if (text.length <= step.maxChars) return step.fontSize;
  }
  return 18; // fallback for very long text
}

// ── Text truncation ──
export function truncate(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text;
  // Cut at last word boundary before limit
  const truncated = text.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxChars * 0.7 ? truncated.substring(0, lastSpace) : truncated) + "...";
}

// ── Layout type mapping ──
// Maps AI-generated layoutRecommendation values to renderer keys
export type LayoutType =
  | "bullets"
  | "statement"
  | "two-column"
  | "matrix"
  | "timeline"
  | "cards";

const LAYOUT_MAP: Record<string, LayoutType> = {
  "3-column-with-icons": "cards",
  "data-cards": "cards",
  "split-layout": "two-column",
  "concentric-circles": "cards",
  "flywheel": "two-column",
  "competitive-matrix": "matrix",
  "timeline": "timeline",
  "full-bleed-statement": "statement",
  "staircase-chart": "cards",
  "table": "matrix",
  "team-grid": "cards",
};

export function resolveLayout(recommendation?: string, selectedLayout?: string): LayoutType {
  // User override takes priority
  if (selectedLayout && isValidLayout(selectedLayout)) return selectedLayout as LayoutType;
  // Map AI recommendation
  if (recommendation && LAYOUT_MAP[recommendation]) return LAYOUT_MAP[recommendation];
  // Default
  return "bullets";
}

function isValidLayout(layout: string): layout is LayoutType {
  return ["bullets", "statement", "two-column", "matrix", "timeline", "cards"].includes(layout);
}

// ── Layout metadata for UI (used by future layout picker) ──
export interface LayoutDefinition {
  type: LayoutType;
  label: string;
  description: string;
  maxBullets: number;
  supportsDataPoints: boolean;
}

export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  { type: "bullets", label: "Bullet Points", description: "Headline with supporting bullets", maxBullets: 5, supportsDataPoints: false },
  { type: "statement", label: "Statement", description: "Full-bleed headline with no bullets", maxBullets: 0, supportsDataPoints: false },
  { type: "two-column", label: "Two Column", description: "Content left, visual area right", maxBullets: 4, supportsDataPoints: false },
  { type: "matrix", label: "Matrix", description: "2x2 comparison grid", maxBullets: 4, supportsDataPoints: false },
  { type: "timeline", label: "Timeline", description: "Horizontal connected steps", maxBullets: 5, supportsDataPoints: false },
  { type: "cards", label: "Cards", description: "Side-by-side info cards", maxBullets: 3, supportsDataPoints: true },
];