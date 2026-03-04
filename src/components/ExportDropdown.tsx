import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Copy, Presentation, FileDown, Code } from "lucide-react";
import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";
import type { DeckTheme } from "@/components/SlidePreview";
import { exportPptx } from "@/lib/exportPptx";
import { exportDocx } from "@/lib/exportDocx";
import { buildPlainText, copyAsHtml } from "@/lib/exportClipboard";

interface Props {
  output: any;
  isPro: boolean;
  deliverable: Deliverable | null;
  excludedSlides: Set<number>;
  slideOrder: number[];
  deckTheme: DeckTheme;
}

const ICONS: Record<string, typeof Copy> = {
  pptx: Presentation,
  docx: FileDown,
  copy_text: Copy,
  copy_html: Code,
};

function getOptions(type: string) {
  switch (type) {
    case "deck":
      return [
        { label: "PowerPoint (.pptx)", action: "pptx", pro: true },
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

export function ExportDropdown({ output, isPro, deliverable, excludedSlides, slideOrder, deckTheme }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const type = deliverable?.type || "deck";
  const options = getOptions(type);

  const handleExport = async (action: string) => {
    setOpen(false);
    if (!deliverable) return;

    try {
      switch (action) {
        case "pptx":
          if (!isPro) { toast.error("Export is available on Pro."); return; }
          await exportPptx({ output, isPro, excludedSlides, slideOrder, deckTheme });
          toast.success("Downloaded as PowerPoint.");
          break;
        case "docx":
          if (!isPro) { toast.error("Export is available on Pro."); return; }
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
                {(opt as any).pro && !isPro && <span className="ml-auto text-[10px] text-electric">Pro</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
