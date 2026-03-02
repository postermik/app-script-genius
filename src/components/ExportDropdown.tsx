import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileDown, Presentation, File, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { NarrativeOutputData } from "@/types/narrative";
import { buildTabs } from "@/components/OutputView";
import type { DeckTheme } from "@/components/SlidePreview";

interface Props {
  output: NarrativeOutputData;
  isPro: boolean;
  buildTabs: (output: NarrativeOutputData) => { key: string; label: string; sections: { key: string; path: string; label: string; content: string }[] }[];
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

export function ExportDropdown({ output, isPro, buildTabs: buildTabsProp, excludedSlides, slideOrder, deckTheme }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tabs = buildTabsProp(output);
  const d = output.data as any;

  const getDeckSlides = () => {
    const framework = d.deckFramework || d.boardDeckOutline || [];
    if (!framework || framework.length === 0) return [];

    // Use slide order and filter excluded
    const orderedIndices = slideOrder.length > 0 ? slideOrder : framework.map((_: any, i: number) => i);
    const activeIndices = orderedIndices.filter((i: number) => !excludedSlides.has(i));

    return activeIndices.map((originalIdx: number, exportIdx: number) => {
      const slide = framework[originalIdx];
      const headline = typeof slide === "string" ? slide : (slide.headline || "");
      const slideType = slide?.metadata?.slideType || (exportIdx === 0 ? "headline" : "split");
      const h = headline.toLowerCase();
      let body = "";

      if (h.includes("thesis") || h.includes("investment")) body = d.thesis?.content || d.thesis || "";
      else if (h.includes("market") || h.includes("opportunity")) body = Array.isArray(d.marketLogic) ? d.marketLogic.join("\n\n") : (d.marketLogic || d.marketAnalysis || "");
      else if (h.includes("problem") || h.includes("pain")) body = d.narrativeStructure?.worldToday || d.narrativeStructure?.breakingPoint || d.userProblem || "";
      else if (h.includes("solution") || h.includes("model") || h.includes("product")) body = d.narrativeStructure?.newModel || d.solutionFramework || "";
      else if (h.includes("why") || h.includes("differentiat") || h.includes("competitive") || h.includes("moat")) body = d.narrativeStructure?.whyThisWins || d.competitiveFramework || "";
      else if (h.includes("vision") || h.includes("future")) body = d.narrativeStructure?.theFuture || d.vision || "";
      else if (h.includes("risk")) body = d.risks || d.risksFocus || "";
      else if (h.includes("roadmap") || h.includes("milestone")) body = d.roadmapNarrative || d.nextMilestones || "";
      else if (h.includes("team")) body = "";
      else if (h.includes("ask") || h.includes("funding") || h.includes("raise")) body = d.askUpdate || "";
      else if (h.includes("metric") || h.includes("traction") || h.includes("kpi")) body = d.metricsNarrative || d.metrics || "";
      else if (h.includes("summary") || h.includes("executive")) body = d.executiveSummary || "";
      else if (h.includes("positioning")) body = d.positioning || "";
      else body = typeof slide === "object" ? (slide.body || slide.content || "") : "";

      return { headline, body, slideType, idx: exportIdx, totalSlides: activeIndices.length };
    });
  };

  const exportPptx = async () => {
    if (!isPro) { toast.error("Export is available on Pro."); return; }
    setOpen(false);
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.author = "Rhetoric";
      pptx.title = (output as any).title || "Narrative Deck";
      pptx.layout = "LAYOUT_16x9";

      const colors = getThemeColors(deckTheme);
      const { BG, FG, MUTED, ACCENT, ACCENT_DIM } = colors;

      // Title slide
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: BG };
      titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.04, fill: { color: ACCENT } });
      titleSlide.addText((output as any).title || "Narrative Deck", { x: 0.8, y: 2, w: 8.4, h: 1.5, fontSize: 44, fontFace: "Arial", bold: true, color: FG, align: "center" });
      titleSlide.addText(output.mode.replace(/_/g, " ").toUpperCase(), { x: 0.8, y: 3.6, w: 8.4, fontSize: 14, fontFace: "Arial", color: ACCENT, align: "center", charSpacing: 4 });
      if (!isPro) titleSlide.addText("Generated by Rhetoric", { x: 0.8, y: 5, w: 8.4, fontSize: 10, fontFace: "Arial", color: MUTED, align: "center" });

      const deckSlides = getDeckSlides();

      if (deckSlides.length === 0) {
        for (const tab of tabs) {
          for (const section of tab.sections) {
            if (!section.content?.trim()) continue;
            const slide = pptx.addSlide();
            slide.background = { color: BG };
            slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.04, fill: { color: ACCENT } });
            slide.addText(section.label, { x: 0.6, y: 0.7, w: 8.8, fontSize: 36, fontFace: "Arial", bold: true, color: FG });
            slide.addText(section.content, { x: 0.6, y: 1.6, w: 8.8, h: 3.6, fontSize: 14, fontFace: "Arial", color: FG, lineSpacingMultiple: 1.4, valign: "top" });
            if (!isPro) slide.addText("Generated by Rhetoric", { x: 7, y: 5.1, w: 2.8, fontSize: 8, fontFace: "Arial", color: MUTED, align: "right" });
          }
        }
      } else {
        const totalCount = deckSlides.length;
        for (const ds of deckSlides) {
          const slide = pptx.addSlide();
          slide.background = { color: BG };
          slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.04, fill: { color: ACCENT } });

          const lines = ds.body ? ds.body.split("\n").filter((l: string) => l.trim()) : [];
          const bodyText = lines.join("\n");
          const isBulletContent = lines.length >= 3 && lines.every((l: string) => l.length < 200);

          // Slide number
          slide.addText(`${ds.idx + 1} / ${totalCount}`, { x: 8.2, y: 5.1, w: 1.5, fontSize: 9, fontFace: "Arial", color: MUTED, align: "right" });
          if (!isPro) slide.addText("Generated by Rhetoric", { x: 0.3, y: 5.1, w: 3, fontSize: 8, fontFace: "Arial", color: MUTED, align: "left" });

          // Layout selection based on slideType metadata
          const st = ds.slideType?.toLowerCase() || "";

          if (st === "headline" || st === "quote") {
            // Big centered headline with optional subtitle
            slide.addText(ds.headline, { x: 0.8, y: 1.2, w: 8.4, h: 2.5, fontSize: 44, fontFace: "Arial", bold: true, color: FG, align: "center", valign: "middle" });
            if (bodyText) {
              slide.addShape(pptx.ShapeType.rect, { x: 3.5, y: 3.8, w: 3, h: 0.03, fill: { color: ACCENT } });
              slide.addText(bodyText.slice(0, 500), { x: 1.2, y: 4.0, w: 7.6, h: 1, fontSize: 13, fontFace: "Arial", color: FG, align: "center", lineSpacingMultiple: 1.4, valign: "top" });
            }
          } else if (st === "chart" || st === "financial") {
            // Data-focused: headline top, structured body with callout box
            slide.addText(ds.headline, { x: 0.6, y: 0.4, w: 8.8, h: 0.8, fontSize: 32, fontFace: "Arial", bold: true, color: FG });
            slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.4, w: 4, h: 3.2, fill: { color: ACCENT_DIM }, rectRadius: 0.05 });
            slide.addText("[ Data Visualization ]", { x: 0.8, y: 2.4, w: 3.6, h: 0.6, fontSize: 12, fontFace: "Arial", color: MUTED, align: "center", italic: true });
            if (bodyText) {
              slide.addText(bodyText.slice(0, 600), { x: 5.0, y: 1.4, w: 4.4, h: 3.4, fontSize: 13, fontFace: "Arial", color: FG, lineSpacingMultiple: 1.4, valign: "top" });
            }
          } else if (st === "framework" || st === "roadmap") {
            // Framework/roadmap: headline + structured bullets
            slide.addText(ds.headline, { x: 0.6, y: 0.4, w: 8.8, h: 0.8, fontSize: 36, fontFace: "Arial", bold: true, color: FG });
            slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.4, w: 2, h: 0.03, fill: { color: ACCENT } });
            if (lines.length >= 2) {
              const bulletRows = lines.slice(0, 8).map((line: string) => ({
                text: line.replace(/^[-•*]\s*/, ""),
                options: { fontSize: 14, fontFace: "Arial", color: FG, bullet: { code: "25B6", color: ACCENT }, lineSpacingMultiple: 1.6, paraSpaceAfter: 8 },
              }));
              slide.addText(bulletRows as any, { x: 0.8, y: 1.8, w: 8.4, h: 3.2, valign: "top" });
            } else if (bodyText) {
              slide.addText(bodyText, { x: 0.6, y: 1.8, w: 8.8, h: 3.2, fontSize: 14, fontFace: "Arial", color: FG, lineSpacingMultiple: 1.4, valign: "top" });
            }
          } else if ((st === "split" || isBulletContent) && lines.length > 1) {
            // Split layout
            slide.addText(ds.headline, { x: 0.6, y: 0.5, w: 3.8, h: 1.2, fontSize: 34, fontFace: "Arial", bold: true, color: FG, valign: "top" });
            slide.addShape(pptx.ShapeType.rect, { x: 4.7, y: 0.5, w: 0.02, h: 4.2, fill: { color: ACCENT_DIM } });
            if (isBulletContent) {
              const bulletRows = lines.slice(0, 8).map((line: string) => ({
                text: line.replace(/^[-•*]\s*/, ""),
                options: { fontSize: 13, fontFace: "Arial", color: FG, bullet: { code: "2022", color: ACCENT }, lineSpacingMultiple: 1.5, paraSpaceAfter: 6 },
              }));
              slide.addText(bulletRows as any, { x: 5.0, y: 0.5, w: 4.4, h: 4.4, valign: "top" });
            } else {
              slide.addText(bodyText, { x: 5.0, y: 0.5, w: 4.4, h: 4.4, fontSize: 14, fontFace: "Arial", color: FG, lineSpacingMultiple: 1.4, valign: "top" });
            }
          } else {
            // Default: headline-body
            slide.addText(ds.headline, { x: 0.6, y: 0.4, w: 8.8, h: 1.2, fontSize: 40, fontFace: "Arial", bold: true, color: FG, valign: "top" });
            slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.8, w: 2, h: 0.03, fill: { color: ACCENT } });
            if (bodyText) {
              slide.addText(bodyText.slice(0, 800), { x: 0.6, y: 2.2, w: 8.8, h: 2.8, fontSize: 15, fontFace: "Arial", color: FG, lineSpacingMultiple: 1.4, valign: "top" });
            }
          }
        }
      }

      await pptx.writeFile({ fileName: `${(output as any).title || "Rhetoric_Deck"}.pptx` });
      toast.success("Deck exported as PowerPoint.");
    } catch {
      toast.error("Export failed.");
    }
  };

  const exportPdf = async () => {
    if (!isPro) { toast.error("PDF export is available on Pro."); return; }
    setOpen(false);
    const content = tabs.map(tab => {
      const sectionContent = tab.sections.map(s => `### ${s.label}\n\n${s.content}`).join("\n\n---\n\n");
      return `## ${tab.label}\n\n${sectionContent}`;
    }).join("\n\n===\n\n");
    const win = window.open("", "_blank");
    if (!win) { toast.error("Please allow popups."); return; }
    win.document.write(`<html><head><title>${(output as any).title || "Rhetoric Export"}</title>
      <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#222;line-height:1.6}
      h2{border-bottom:2px solid #3b82f6;padding-bottom:8px;margin-top:32px}h3{color:#444;margin-top:20px}
      hr{border:none;border-top:1px solid #ddd;margin:24px 0}pre{white-space:pre-wrap}</style></head>
      <body><h1>${(output as any).title || "Narrative Export"}</h1><pre>${content}</pre></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
    toast.success("PDF export opened in new tab.");
  };

  const exportDocx = async () => {
    setOpen(false);
    const content = tabs.map(tab => {
      const sectionContent = tab.sections.map(s => `<h3>${s.label}</h3><p>${(s.content || "").replace(/\n/g, "<br/>")}</p>`).join("<hr/>");
      return `<h2>${tab.label}</h2>${sectionContent}`;
    }).join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${(output as any).title || "Export"}</title>
      <style>body{font-family:Arial,sans-serif;color:#222;line-height:1.6;max-width:700px;margin:40px auto}
      h1{font-size:24pt}h2{font-size:18pt;border-bottom:2px solid #3b82f6;padding-bottom:6px;margin-top:28px}
      h3{font-size:14pt;color:#444;margin-top:16px}hr{border:none;border-top:1px solid #ddd;margin:20px 0}
      p{font-size:11pt}</style></head>
      <body><h1>${(output as any).title || "Narrative Export"}</h1>${content}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(output as any).title || "Rhetoric_Export"}.doc`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Word document.");
  };

  const menuItems = [
    { icon: Presentation, label: "PowerPoint (.pptx)", onClick: exportPptx, pro: true },
    { icon: FileDown, label: "PDF (Print)", onClick: exportPdf, pro: true },
    { icon: FileText, label: "Word (.doc)", onClick: exportDocx, pro: false },
    { icon: File, label: "Google Slides", onClick: () => { setOpen(false); toast.info("Google Slides export coming soon."); }, soon: true },
    { icon: File, label: "Google Docs", onClick: () => { setOpen(false); toast.info("Google Docs export coming soon."); }, soon: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="text-xs px-3 py-1.5 border border-border rounded-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
        <Download className="h-3 w-3" />Export<ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 w-56 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-1">
          {menuItems.map((item) => (
            <button key={item.label} onClick={item.onClick} className="w-full text-left text-xs px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 text-foreground">
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {item.label}
              {item.soon && <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">Soon</span>}
              {item.pro && !isPro && <span className="ml-auto text-[10px] text-electric">Pro</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
