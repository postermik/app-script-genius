import { useState } from "react";
import { Copy, Check, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import type { KeyMetricsSummaryData } from "@/types/rhetoric";

interface Props {
  data: KeyMetricsSummaryData;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export function KeyMetricsSummaryView({ data }: Props) {
  const [copied, setCopied] = useState(false);

  const fullText = data.categories.map(cat => 
    `${cat.category}\n${cat.metrics.map(m => `  ${m.name}: ${m.value} (${m.trend}) — ${m.context}`).join("\n")}`
  ).join("\n\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Metrics copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric">
          Key Metrics Summary
        </p>
        <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium text-secondary-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-colors">
          {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {data.categories.map((cat, ci) => (
        <div key={ci} className="card-gradient rounded-sm border border-border p-5">
          <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-electric mb-3">
            {cat.category}
          </h3>
          <div className="space-y-2.5">
            {cat.metrics.map((metric, mi) => (
              <div key={mi} className="flex items-start gap-3">
                <TrendIcon trend={metric.trend} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">{metric.name}</span>
                    <span className="text-sm font-semibold text-electric">{metric.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{metric.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
