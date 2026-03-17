import { useState } from "react";
import { Copy, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { PitchEmailVariant } from "@/types/rhetoric";

function CopyIconButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors" title="Copy">
      {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
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
  onEditVariant?: (index: number, field: string, value: string) => void;
}

export function PitchEmailView({ variants, onEditVariant }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">
        Outreach Email Templates
      </p>
      {variants.map((variant, i) => (
        <div key={i} className="card-gradient rounded-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                {variant.label}
              </span>
              {savedIndex === i && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald font-medium animate-fade-in">
                  <Check className="h-3 w-3" /> Saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onEditVariant && (
                <button
                  onClick={() => {
                    if (editingIndex === i) {
                      setSavedIndex(i);
                      setEditingIndex(null);
                      setTimeout(() => setSavedIndex(null), 1500);
                    } else {
                      setEditingIndex(i);
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 w-[72px] justify-center rounded-sm text-[11px] font-medium border transition-colors ${
                    editingIndex === i
                      ? "border-electric text-electric bg-electric/10"
                      : "border-border text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  <Pencil className="h-2.5 w-2.5" />
                  {editingIndex === i ? "Done" : "Edit"}
                </button>
              )}
              <CopyIconButton text={`Subject: ${variant.subject}\n\n${variant.body}`} />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Subject</p>
            <p className={`text-sm text-foreground font-medium outline-none rounded-sm transition-all ${editingIndex === i ? "ring-1 ring-electric/30 px-2 py-1 -mx-2" : ""}`}
              contentEditable={editingIndex === i}
              suppressContentEditableWarning
              onBlur={(e) => onEditVariant?.(i, "subject", e.currentTarget.textContent || "")}
            >
              {highlightMergeFields(variant.subject)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-medium">Body</p>
            <p className={`text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap outline-none rounded-sm transition-all ${editingIndex === i ? "ring-1 ring-electric/30 px-3 py-2 -mx-3" : ""}`}
              contentEditable={editingIndex === i}
              suppressContentEditableWarning
              onBlur={(e) => onEditVariant?.(i, "body", e.currentTarget.textContent || "")}
            >
              {highlightMergeFields(variant.body)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}