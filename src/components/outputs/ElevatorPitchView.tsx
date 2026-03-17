import { useState } from "react";
import { Copy, Check, RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { ElevatorPitchData } from "@/types/rhetoric";

interface Props {
  data: ElevatorPitchData;
  onRefine?: () => void;
  isRefining?: boolean;
  onEdit?: (field: string, value: string) => void;
}

function CopyButton({ text }: { text: string }) {
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
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function ElevatorPitchView({ data, onRefine, isRefining, onEdit }: Props) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);

  const handleDone = (field: string) => {
    setSavedField(field);
    setEditingField(null);
    setTimeout(() => setSavedField(null), 1500);
  };

  const renderPitchSection = (label: string, field: string, text: string) => (
    <div className="card-gradient rounded-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-electric font-mono">
            {label}
          </p>
          {savedField === field && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald font-medium animate-fade-in">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              onClick={() => editingField === field ? handleDone(field) : setEditingField(field)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 w-[72px] justify-center rounded-sm text-[11px] font-medium border transition-colors ${
                editingField === field
                  ? "border-electric text-electric bg-electric/10"
                  : "border-border text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              <Pencil className="h-2.5 w-2.5" />
              {editingField === field ? "Done" : "Edit"}
            </button>
          )}
          <CopyButton text={text} />
        </div>
      </div>
      <p className={`text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap outline-none rounded-sm transition-all ${editingField === field ? "ring-1 ring-electric/30 px-3 py-2 -mx-3" : ""}`}
        contentEditable={editingField === field}
        suppressContentEditableWarning
        onBlur={(e) => onEdit?.(field, e.currentTarget.textContent || "")}
      >
        {text}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderPitchSection("30-Second Pitch", "thirtySecond", data.thirtySecond)}
      <div className="border-t border-border" />
      {renderPitchSection("60-Second Pitch", "sixtySecond", data.sixtySecond)}

      {onRefine && (
        <div className="flex justify-end">
          <button
            onClick={onRefine}
            disabled={isRefining}
            className="inline-flex items-center gap-1.5 px-4 py-2 w-[72px] justify-center rounded-sm text-xs font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRefining ? "animate-spin" : ""}`} />
            {isRefining ? "Refining" : "Refine"}
          </button>
        </div>
      )}
    </div>
  );
}