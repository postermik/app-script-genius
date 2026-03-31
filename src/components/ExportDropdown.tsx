import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Copy, Presentation, FileDown, Code, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";
import type { DeckTheme } from "@/components/SlidePreview";
import { exportPptx } from "@/lib/exportPptx";
import { exportPdf } from "@/lib/exportPdf";
import { exportDocx } from "@/lib/exportDocx";
import { buildPlainText, copyAsHtml } from "@/lib/exportClipboard";

interface Props {
  output: any;
  isPro: boolean;
  subscribed: boolean;
  deliverable: Deliverable | null;
  excludedSlides: Set<number>;
  slideOrder: number[];
  deckTheme: DeckTheme;
}

const ICONS: Record<string, typeof Copy> = {
  pptx: Presentation,
  pdf: FileText,
  docx: FileDown,
  copy_text: Copy,
  copy_html: Code,
};

function getOptions(type: string) {
  switch (type) {
    case "deck":
      return [
        { label: "PowerPoint (.pptx)", action: "pptx", pro: true },
        { label: "PDF (.pdf)", action: "pdf", pro: true },
        { label: "Copy slides as text", action: "copy_text" },
      ];
    case "memo":
    case "document":
      return [
        { label: "Word Document (.docx)", action: "docx", pro: true },
        { label: "Copy to clipboard", action: "copy_text" },
      ];
    case "email":
      return [
        { label: "Copy to clipboard", action: "copy_text" },
        { label: "Copy as HTML", action: "copy_html" },
      ];
    default:
      return [{ label: "Copy to clipboard", action: "copy_text" }];
  }
}

interface PlaceholderSlide {
  index: number;
  label: string;
  count: number;
}

export function ExportDropdown({ output, isPro, subscribed, deliverable, excludedSlides, slideOrder, deckTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [warning, setWarning] = useState<{ action: string; slides: PlaceholderSlide[] } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scan visible slides for [placeholder] text
  function scanPlaceholders(): PlaceholderSlide[] {
    const d = (output?.data || (output as any)?.supporting || {}) as any;
    const del = (output as any)?.deliverable || {};
    const fw = d?.deckFramework || del?.deckFramework || d?.boardDeckOutline || del?.boardDeckOutline || [];
    const ordered = slideOrder.length > 0 ? slideOrder : fw.map((_: any, i: number) => i);
    const active = ordered.filter((i: number) => !excludedSlides.has(i));

    const results: PlaceholderSlide[] = [];
    for (const idx of active) {
      const slide = fw[idx];
      if (!slide) continue;
      let count = 0;
      const check = (val: any) => {
        if (typeof val === "string" && /\[placeholder/i.test(val)) count++;
        if (Array.isArray(val)) val.forEach(v => { if (typeof v === "string" && /\[placeholder/i.test(v)) count++; });
      };
      check(slide.headline);
      check(slide.subheadline || slide.subheader);
      check(slide.bodyContent);
      check(slide.closingStatement);
      if (slide.milestones) slide.milestones.forEach((m: any) => { check(m.amount); check(m.bullets); });
      if (slide.cards) slide.cards.forEach((c: any) => { c.stats?.forEach((s: any) => { check(s.value); check(s.label); }); });
      if (slide.flywheelSteps) slide.flywheelSteps.forEach((s: any) => { check(s.label); check(s.description); });

      if (count > 0) {
        const label = (slide.categoryLabel || `Slide ${idx + 1}`).replace(/_/g, " ");
        results.push({ index: idx, label, count });
      }
    }
    return results;
  }

  // Execute the actual export
  const doExport = async (action: string) => {
    if (!deliverable) return;
    try {
      switch (action) {
        case "pptx":
          if (!subscribed) { toast.error("Upgrade to export files."); return; }
          await exportPptx({ output, isPro, excludedSlides, slideOrder, deckTheme });
          toast.success("Downloaded as PowerPoint.");
          break;
        case "pdf":
          if (!subscribed) { toast.error("Upgrade to export files."); return; }
          await exportPdf({ output, isPro, excludedSlides, slideOrder, deckTheme });
          toast.success("Downloaded as PDF.");
          break;
        case "docx":
          if (!subscribed) { toast.error("Upgrade to export files."); return; }
          await exportDocx({ title: output?.title || "Rhetoric Export", deliverable });
          toast.success("Downloaded as Word document.");
          break;
        case "copy_text":
          await navigator.clipboard.writeText(buildPlainText(deliverable));
          toast.success("Copied to clipboard.");
          break;
        case "copy_html":
          await copyAsHtml(deliverable);
          toast.success("Copied as formatted email.");
          break;
      }
    } catch {
      toast.error("Export failed.");
    }
  };

  const handleExport = async (action: string) => {
    setOpen(false);
    if (!deliverable) return;

    // Check for placeholders before file exports
    if (action === "pptx" || action === "pdf") {
      if (!subscribed) { toast.error("Upgrade to export files."); return; }
      const placeholders = scanPlaceholders();
      if (placeholders.length > 0) {
        setWarning({ action, slides: placeholders });
        return;
      }
    }

    await doExport(action);
  };

  const totalPlaceholders = warning ? warning.slides.reduce((sum, s) => sum + s.count, 0) : 0;
  const type = deliverable?.type || "deck";
  const options = getOptions(type);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="text-xs px-3 py-1.5 border border-border rounded-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
        <Download className="h-3 w-3" />Export<ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-56 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in py-1">
          {options.map((opt) => {
            const Icon = ICONS[opt.action] || Copy;
            return (
              <button key={opt.action} onClick={() => handleExport(opt.action)} className="w-full text-left text-xs px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 text-foreground">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {opt.label}
                {(opt as any).pro && !subscribed && <span className="ml-auto text-[10px] text-electric">Upgrade</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Placeholder warning dialog */}
      {warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setWarning(null)}>
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {totalPlaceholders} placeholder{totalPlaceholders > 1 ? "s" : ""} need your input
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  These slides have data Rhetoric couldn't fill from your description. Edit them in the slide preview before exporting, or export now and fill them in later.
                </p>
              </div>
            </div>

            <div className="p-4 max-h-48 overflow-y-auto">
              {warning.slides.map(s => (
                <div key={s.index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs font-medium text-foreground">{s.label}</span>
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg font-medium">
                    {s.count} placeholder{s.count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border flex gap-2">
              <button
                onClick={() => setWarning(null)}
                className="flex-1 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Edit slides first
              </button>
              <button
                onClick={() => { const action = warning.action; setWarning(null); doExport(action); }}
                className="flex-1 py-2 text-xs font-medium border border-border text-muted-foreground rounded-lg hover:text-foreground hover:border-muted-foreground/30 transition-all"
              >
                Export anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}