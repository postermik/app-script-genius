import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { PitchEmailVariant } from "@/types/rhetoric";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors">
      {copied ? <Check className="h-2.5 w-2.5 text-emerald" /> : <Copy className="h-2.5 w-2.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function highlightMergeFields(text: string) {
  return text.split(/(\{[^}]+\})/).map((part, i) => {
    if (part.startsWith("{") && part.endsWith("}")) {
      return (
        <span key={i} className="bg-electric/15 text-electric px-1 py-0.5 rounded text-[11px] font-mono">
          {part}
        </span>
      );
    }
    return part;
  });
}

interface Props {
  variants: PitchEmailVariant[];
}

export function PitchEmailView({ variants }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">
        Outreach Email Templates
      </p>
      {variants.map((variant, i) => (
        <div key={i} className="card-gradient rounded-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
              {variant.label}
            </span>
            <CopyButton text={`Subject: ${variant.subject}\n\n${variant.body}`} />
          </div>
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Subject</p>
            <p className="text-sm text-foreground font-medium">{highlightMergeFields(variant.subject)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Body</p>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {highlightMergeFields(variant.body)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
