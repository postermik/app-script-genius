import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileDown, Presentation, File, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";
import type { DeckTheme } from "@/components/SlidePreview";
import { exportPptx } from "@/lib/exportPptx";

interface Props {
  output: any;
  isPro: boolean;
  deliverable: Deliverable | null;
  excludedSlides: Set<number>;
  slideOrder: number[];
  deckTheme: DeckTheme;
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

  const deliverableType = deliverable?.type || "deck";

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

  const handleCopyToClipboard = () => {
    setOpen(false);
    if (!deliverable) return;
    const parts: string[] = [];
    if (deliverable.to) parts.push(`To: ${deliverable.to}`);
    if (deliverable.from) parts.push(`From: ${deliverable.from}`);
    if (deliverable.subject) parts.push(`Subject: ${deliverable.subject}`);
    if (parts.length) parts.push("");
    deliverable.sections?.forEach(s => {
      parts.push(s.heading);
      parts.push(s.content);
      parts.push("");
    });
    navigator.clipboard.writeText(parts.join("\n"));
    toast.success("Copied to clipboard.");
  };

  const handleExportText = () => {
    setOpen(false);
    if (!deliverable) return;
    const parts: string[] = [];
    if (deliverable.to) parts.push(`To: ${deliverable.to}`);
    if (deliverable.from) parts.push(`From: ${deliverable.from}`);
    if (deliverable.subject) parts.push(`Subject: ${deliverable.subject}`);
    if (parts.length) parts.push("");
    deliverable.sections?.forEach(s => {
      parts.push(s.heading);
      parts.push(s.content);
      parts.push("");
    });
    const text = parts.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(output as any).title || "Rhetoric_Export"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as text file.");
  };

  const menuItems = (() => {
    if (deliverableType === "deck") {
      return [
        { icon: Presentation, label: "PowerPoint (.pptx)", onClick: handleExportPptx, pro: true },
        { icon: FileDown, label: "PDF (Print)", onClick: () => { setOpen(false); toast.info("PDF export coming soon."); }, pro: true },
      ];
    }
    if (deliverableType === "email") {
      return [
        { icon: Copy, label: "Copy to Clipboard", onClick: handleCopyToClipboard },
      ];
    }
    // memo or document
    return [
      { icon: Copy, label: "Copy to Clipboard", onClick: handleCopyToClipboard },
      { icon: FileText, label: "Export as Text", onClick: handleExportText },
    ];
  })();

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
              {(item as any).pro && !isPro && <span className="ml-auto text-[10px] text-electric">Pro</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
