import { useState } from "react";
import { Copy, Check, FileDown } from "lucide-react";
import { toast } from "sonner";
import type { InvestmentMemoData } from "@/types/rhetoric";

interface Props {
  data: InvestmentMemoData;
}

export function InvestmentMemoView({ data }: Props) {
  const [copied, setCopied] = useState(false);

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
            onClick={() => toast.info("PDF export coming soon")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors"
          >
            <FileDown className="h-3 w-3" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="card-gradient rounded-sm border border-border divide-y divide-border">
        {data.sections.map((section, i) => (
          <div key={i} className="p-5">
            <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-electric mb-2.5">
              {section.heading}
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
