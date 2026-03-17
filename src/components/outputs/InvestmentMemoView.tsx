import { useState } from "react";
import { Copy, Check, FileDown, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { InvestmentMemoData } from "@/types/rhetoric";

interface Props {
  data: InvestmentMemoData;
  onEditSection?: (index: number, content: string) => void;
}

export function InvestmentMemoView({ data, onEditSection }: Props) {
  const [copied, setCopied] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  const fullText = data.sections.map(s => `## ${s.heading}\n\n${s.content}`).join("\n\n---\n\n");

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Memo copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric">
          Investment Memo
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy All"}
          </button>
          <button
            onClick={() => {
              const blob = new Blob([fullText], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "investment-memo.txt";
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Memo downloaded.");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors"
          >
            <FileDown className="h-3 w-3" />
            Download
          </button>
        </div>
      </div>

      <div className="card-gradient rounded-sm border border-border divide-y divide-border">
        {data.sections.map((section, i) => (
          <div key={i} className="p-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-electric">
                  {section.heading}
                </h3>
                {savedIndex === i && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald font-medium animate-fade-in">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                )}
              </div>
              {onEditSection && (
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
            </div>
            <p className={`text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap outline-none rounded-sm transition-all ${editingIndex === i ? "ring-1 ring-electric/30 px-3 py-2 -mx-3" : ""}`}
              contentEditable={editingIndex === i}
              suppressContentEditableWarning
              onBlur={(e) => onEditSection?.(i, e.currentTarget.textContent || "")}
            >
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}