import type { NarrativeOutputData } from "@/types/narrative";
import type { DeckTheme } from "@/components/SlidePreview";

interface ExportOptions {
  output: NarrativeOutputData;
  isPro: boolean;
  excludedSlides: Set<number>;
  slideOrder: number[];
  deckTheme: DeckTheme;
}

function getThemeColors(theme: DeckTheme) {
  if (theme.scheme === "light") {
    return { BG: "ffffff", FG: "1a1a2e", MUTED: "6b7280", ACCENT: "3b82f6", ACCENT_DIM: "dbeafe" };
  }
  if (theme.scheme === "custom") {
    const strip = (hex: string) => hex.replace("#", "");
    return {
      BG: strip(theme.secondary || "#0b0f14"),
      FG: theme.secondary && parseInt(theme.secondary.replace("#", ""), 16) > 0x888888 ? "1a1a2e" : "dce0e8",
      MUTED: "9ca3af",
      ACCENT: strip(theme.primary || "#3b82f6"),
      ACCENT_DIM: strip(theme.accent || "#1e3a5f"),
    };
  }
  return { BG: "0b0f14", FG: "dce0e8", MUTED: "6b7280", ACCENT: "3b82f6", ACCENT_DIM: "1e3a5f" };
}

/** Map a slide headline to the best matching narrative content */
function resolveSlideBody(headline: string, d: any): string {
  const h = headline.toLowerCase();

  // Thesis / Investment thesis
  if (h.includes("thesis") || h.includes("investment"))
    return typeof d.thesis === "object" ? [d.thesis.content, d.thesis.coreInsight ? `Core Insight: ${d.thesis.coreInsight}` : ""].filter(Boolean).join("\n\n") : (d.thesis || "");

  // Problem / Pain
  if (h.includes("problem") || h.includes("pain")) {
    const parts = [
      d.narrativeStructure?.worldToday,
      d.narrativeStructure?.breakingPoint,
      d.userProblem,
    ].filter(Boolean);
    return parts.join("\n\n") || "";
  }

  // Solution / Product / Model
  if (h.includes("solution") || h.includes("product") || h.includes("model")) {
    const parts = [d.narrativeStructure?.newModel, d.solutionFramework].filter(Boolean);
    return parts.join("\n\n") || "";
  }

  // Market / Opportunity / TAM
  if (h.includes("market") || h.includes("opportunity") || h.includes("tam") || h.includes("sam"))
    return Array.isArray(d.marketLogic) ? d.marketLogic.join("\n\n") : (d.marketLogic || d.marketAnalysis || "");

  // Moat / Competitive / Differentiation / Why this wins
  if (h.includes("why") || h.includes("differentiat") || h.includes("competitive") || h.includes("moat"))
    return d.narrativeStructure?.whyThisWins || d.competitiveFramework || "";

  // Traction / Metrics / KPI
  if (h.includes("metric") || h.includes("traction") || h.includes("kpi"))
    return d.metricsNarrative || d.metrics || d.progress || "";

  // Business model / Revenue / Pricing
  if (h.includes("business model") || h.includes("revenue") || h.includes("pricing") || h.includes("monetiz"))
    return d.businessModel || d.revenueModel || d.pricing || "";

  // Vision / Future
  if (h.includes("vision") || h.includes("future"))
    return d.narrativeStructure?.theFuture || d.vision || "";

  // Risk
  if (h.includes("risk"))
    return d.risks || d.risksFocus || d.challenges || "";

  // Roadmap / Milestone
  if (h.includes("roadmap") || h.includes("milestone"))
    return d.roadmapNarrative || d.nextMilestones || "";

  // Ask / Funding / Raise
  if (h.includes("ask") || h.includes("funding") || h.includes("raise"))
    return d.askUpdate || "";

  // Why now
  if (h.includes("why now"))
    return d.whyNow || "";

  // Team
  if (h.includes("team"))
    return d.team || "";

  // Summary / Executive
  if (h.includes("summary") || h.includes("executive"))
    return d.executiveSummary || "";

  // Positioning
  if (h.includes("positioning"))
    return d.positioning || "";

  // Progress / Update
  if (h.includes("progress") || h.includes("update"))
    return d.progress || "";

  // Challenges
  if (h.includes("challeng"))
    return d.challenges || "";

  return "";
}

function headlineFontSize(text: string): number {
  return text.length > 60 ? 28 : 32;
}

export async function exportPptx({ output, isPro, excludedSlides, slideOrder, deckTheme }: ExportOptions) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const title = (output as any).title || "Narrative Deck";
  pptx.author = "Rhetoric";
  pptx.title = title;
  pptx.layout = "LAYOUT_16x9";

  const colors = getThemeColors(deckTheme);
  const { BG, FG, MUTED, ACCENT, ACCENT_DIM } = colors;

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // ── Single title slide ──
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BG };
  titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.04, fill: { color: ACCENT } });
  titleSlide.addText(title, { x: 0.8, y: 1.8, w: 8.4, h: 1.2, fontSize: 36, fontFace: "Arial", bold: true, color: FG, align: "center", valign: "middle" });
  titleSlide.addText(output.mode.replace(/_/g, " ").toUpperCase(), { x: 0.8, y: 3.2, w: 8.4, fontSize: 14, fontFace: "Arial", color: ACCENT, align: "center", charSpacing: 4 });
  titleSlide.addText(today, { x: 0.8, y: 3.8, w: 8.4, fontSize: 12, fontFace: "Arial", color: MUTED, align: "center" });
  if (!isPro) titleSlide.addText("Generated by Rhetoric", { x: 0.8, y: 5, w: 8.4, fontSize: 10, fontFace: "Arial", color: MUTED, align: "center" });

  // ── Content slides ──
  const d = output.data as any;
  const framework = d.deckFramework || d.boardDeckOutline || [];
  const orderedIndices = slideOrder.length > 0 ? slideOrder : framework.map((_: any, i: number) => i);
  const activeIndices = orderedIndices.filter((i: number) => !excludedSlides.has(i));

  for (const originalIdx of activeIndices) {
    const raw = framework[originalIdx];
    if (!raw) continue;
    const headline = typeof raw === "string" ? raw : (raw.headline || "");
    const body = resolveSlideBody(headline, d);

    const slide = pptx.addSlide();
    slide.background = { color: BG };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.04, fill: { color: ACCENT } });

    // Consistent layout: headline at top, divider, body below
    const hSize = headlineFontSize(headline);
    slide.addText(headline, {
      x: 0.6, y: 0.4, w: 8.8, h: 0.8,
      fontSize: hSize, fontFace: "Arial", bold: true, color: FG, align: "left", valign: "top",
    });

    // Divider
    slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.1, w: 2, h: 0.03, fill: { color: ACCENT } });

    if (!body?.trim()) {
      // No content available - skip body
      if (!isPro) slide.addText("Generated by Rhetoric", { x: 0.6, y: 5.1, w: 3, fontSize: 8, fontFace: "Arial", color: MUTED, align: "left" });
      continue;
    }

    const lines = body.split("\n").filter((l: string) => l.trim());
    const isBulletContent = lines.length >= 3 && lines.every((l: string) => l.length < 200);

    if (isBulletContent) {
      const bulletRows = lines.slice(0, 10).map((line: string) => ({
        text: line.replace(/^[-•*]\s*/, ""),
        options: {
          fontSize: 14, fontFace: "Arial", color: FG,
          bullet: { code: "2022", color: ACCENT },
          lineSpacingMultiple: 1.5, paraSpaceAfter: 6,
        },
      }));
      slide.addText(bulletRows as any, { x: 0.6, y: 1.4, w: 8.8, h: 3.6, valign: "top" });
    } else {
      slide.addText(body.slice(0, 1200), {
        x: 0.6, y: 1.4, w: 8.8, h: 3.6,
        fontSize: 14, fontFace: "Arial", color: FG,
        lineSpacingMultiple: 1.4, valign: "top", align: "left",
      });
    }

    if (!isPro) slide.addText("Generated by Rhetoric", { x: 0.6, y: 5.1, w: 3, fontSize: 8, fontFace: "Arial", color: MUTED, align: "left" });
  }

  await pptx.writeFile({ fileName: `${title.replace(/[^a-zA-Z0-9 ]/g, "")}.pptx` });
}
