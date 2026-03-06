import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ElevatorPitchData } from "@/types/rhetoric";

interface Props {
  data: ElevatorPitchData;
  onRefine?: () => void;
  isRefining?: boolean;
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

export function ElevatorPitchView({ data, onRefine, isRefining }: Props) {
  return (
    <div className="space-y-6">
      {/* 30-Second Pitch */}
      <div className="card-gradient rounded-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-electric font-mono">
            30-Second Pitch
          </p>
          <CopyButton text={data.thirtySecond} />
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {data.thirtySecond}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* 60-Second Pitch */}
      <div className="card-gradient rounded-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-electric font-mono">
            60-Second Pitch
          </p>
          <CopyButton text={data.sixtySecond} />
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {data.sixtySecond}
        </p>
      </div>

      {/* Refine */}
      {onRefine && (
        <div className="flex justify-end">
          <button
            onClick={onRefine}
            disabled={isRefining}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRefining ? "animate-spin" : ""}`} />
            {isRefining ? "Refining…" : "Refine"}
          </button>
        </div>
      )}
    </div>
  );
}
