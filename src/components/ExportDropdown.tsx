import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileDown, Presentation, File, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { NarrativeOutputData } from "@/types/narrative";
import type { DeckTheme } from "@/components/SlidePreview";
import { exportPptx } from "@/lib/exportPptx";

interface Props {
  output: NarrativeOutputData;
  isPro: boolean;
  buildTabs: (output: NarrativeOutputData) => { key: string; label: string; sections: { key: string; path: string; label: string; content: string }[] }[];
  excludedSlides: Set<number>;
  slideOrder: number[];
  deckTheme: DeckTheme;
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

  const handleExportPptx = async () => {
    if (!isPro) { toast.error("Export is available on Pro."); return; }
    setOpen(false);
    try {
      await exportPptx({ output, isPro, excludedSlides, slideOrder, deckTheme });
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

  const hasDeck = (() => {
    const d = output.data as any;
    return !!(d.deckFramework?.length || d.boardDeckOutline?.length);
  })();

  const menuItems = [
    ...(hasDeck ? [{ icon: Presentation, label: "PowerPoint (.pptx)", onClick: handleExportPptx, pro: true }] : []),
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
