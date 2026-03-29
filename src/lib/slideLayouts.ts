/**
 * slideLayouts.ts - Shared constants, layout resolver with smart defaults.
 * Flywheel replaces timeline. Matrix is X/Y scatter.
 */
export const SLIDE = { W: 10, H: 5.625, MARGIN_L: 0.6, MARGIN_R: 0.6, MARGIN_T: 0.25, MARGIN_B: 0.35 } as const;
export const CONTENT_W = SLIDE.W - SLIDE.MARGIN_L - SLIDE.MARGIN_R;

export const CHAR_LIMITS = {
  HEADLINE_MAX: 100, SUBHEADLINE_MAX: 120, BULLET_MAX: 140, CLOSING_MAX: 100, CATEGORY_MAX: 20,
} as const;

export const HEADLINE_STEPS = [
  { maxChars: 40, fontSize: 22 },
  { maxChars: 60, fontSize: 20 },
  { maxChars: 80, fontSize: 18 },
  { maxChars: 100, fontSize: 16 },
];

export function getHeadlineFontSize(text: string): number {
  for (const s of HEADLINE_STEPS) { if (text.length <= s.maxChars) return s.fontSize; }
  return 14;
}

export function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text;
  const t = text.substring(0, max);
  const sp = t.lastIndexOf(" ");
  return (sp > max * 0.7 ? t.substring(0, sp) : t) + "...";
}

export function estimateHeight(text: string, fontSize: number, widthIn: number = CONTENT_W): number {
  const cpl = Math.round(60 * (widthIn / CONTENT_W));
  const lines = Math.ceil(text.length / cpl);
  return lines * ((fontSize / 72) * 1.35);
}

// Color hierarchy for dark theme
export const COLORS = {
  CATEGORY: "60a5fa",   // lighter blue for category labels
  HEADLINE: "e2e8f0",   // near-white for headlines
  BODY: "cbd5e1",       // light gray for body text
  SUBHEADLINE: "94a3b8", // muted for subheadlines
  CLOSING: "60a5fa",    // lighter blue for closing statements
  ON_ACCENT: "ffffff",  // white text on colored backgrounds
} as const;

export type LayoutType =
  | "bullets" | "statement" | "data-cards" | "concentric"
  | "matrix" | "flywheel" | "icon-columns" | "team" | "staircase";

// Smart resolver: only use fancy layouts when content clearly supports them
export function resolveLayout(recommendation?: string, selectedLayout?: string, categoryLabel?: string, dataPoints?: string[]): LayoutType {
  // If user manually selected a layout, honor it
  if (selectedLayout && isValidLayout(selectedLayout)) return selectedLayout as LayoutType;
  // Smart defaults based on category + content
  const cat = (categoryLabel || "").toLowerCase();
  const dp = dataPoints || [];
  if (cat.includes("market") && dp.length >= 3) return "concentric";
  if (cat.includes("compet")) return "matrix";
  if (cat.includes("go-to-market") || cat.includes("gtm")) return "flywheel";
  if (cat.includes("financial") || cat.includes("milestone")) return "staircase";
  if (cat.includes("team") || cat.includes("founder")) return "team";
  // Check AI recommendation, but only for specific matches
  const rec = recommendation || "";
  if (rec === "full-bleed-statement") return "statement";
  if (rec === "data-cards" && dp.length >= 2) return "data-cards";
  if (rec === "3-column-with-icons" && dp.length >= 2) return "icon-columns";
  // Default: bullets
  return "bullets";
}

function isValidLayout(l: string): boolean {
  return ["bullets","statement","data-cards","concentric","matrix","flywheel","icon-columns","team","staircase"].includes(l);
}

export interface LayoutDefinition { type: LayoutType; label: string; description: string; }
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  { type: "bullets", label: "Bullets", description: "Headline with supporting points" },
  { type: "statement", label: "Statement", description: "Hero headline, no bullets" },
  { type: "data-cards", label: "Data Cards", description: "Stat callouts with descriptions" },
  { type: "concentric", label: "Concentric", description: "Nested rings (TAM/SAM/SOM)" },
  { type: "matrix", label: "Matrix", description: "X/Y competitive positioning" },
  { type: "flywheel", label: "Flywheel", description: "Circular growth loop" },
  { type: "icon-columns", label: "Columns", description: "Columns with icons" },
  { type: "team", label: "Team", description: "Name and role cards" },
  { type: "staircase", label: "Staircase", description: "Ascending growth steps" },
];