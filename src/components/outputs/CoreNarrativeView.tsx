import { useState, useEffect, useRef } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { CoreNarrativeData } from "@/types/rhetoric";

interface Props {
  data: CoreNarrativeData;
  onRefineSection?: (index: number) => void;
  refiningIndex?: number | null;
  isStreaming?: boolean;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors">
      {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function CoreNarrativeView({ data, onRefineSection, refiningIndex, isStreaming }: Props) {
  const fullText = data.sections.map(s => `## ${s.heading}\n\n${s.content}`).join("\n\n---\n\n");
  const prevCountRef = useRef(data.sections.length);

  // Scroll window to bottom when a new section appears during streaming.
  // The page scrolls on window — no custom scroll container.
  useEffect(() => {
    if (!isStreaming) return;
    if (data.sections.length > prevCountRef.current) {
      prevCountRef.current = data.sections.length;
      // Wait one frame for the new section to render, then scroll
      requestAnimationFrame(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      });
    }
  }, [data.sections.length, isStreaming]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric">
          Core Narrative
        </p>
        <CopyButton text={fullText} label="Copy All" />
      </div>

      <div className="card-gradient rounded-sm border border-border divide-y divide-border">
        {data.sections.map((section, i) => (
          <div key={i} className="p-5">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-electric">
                {section.heading}
              </h3>
              {onRefineSection && (
                <button
                  onClick={() => onRefineSection(i)}
                  disabled={refiningIndex === i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${refiningIndex === i ? "animate-spin" : ""}`} />
                  {refiningIndex === i ? "Refining…" : "Refine"}
                </button>
              )}
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
