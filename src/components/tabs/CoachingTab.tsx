import { AlertTriangle, TrendingUp, Lightbulb, Check } from "lucide-react";
import type { RhetoricScore } from "@/types/rhetoric";

interface Props {
  score: RhetoricScore;
}

export function CoachingTab({ score }: Props) {
  const gaps = score.gaps || [];
  const improvements = score.improvements || [];

  if (gaps.length === 0 && improvements.length === 0) {
    return (
      <div className="card-gradient rounded-sm border border-border p-5 text-center">
        <Check className="h-6 w-6 text-emerald mx-auto mb-2" />
        <p className="text-xs text-foreground font-medium">Looking great!</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">No major coaching items identified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-gradient rounded-sm border border-border p-5">
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-electric mb-4">Coaching</h3>
        <div className="space-y-4">
          {gaps.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3 w-3 text-yellow-400" /> Areas to Strengthen
              </p>
              <div className="space-y-2">
                {gaps.map((gap, idx) => (
                  <div key={`g-${idx}`} className="p-3 rounded-sm bg-muted/50 border border-border accent-left-border">
                    <p className="text-xs text-foreground/90 leading-relaxed">{gap}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {improvements.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
                <Lightbulb className="h-3 w-3 text-electric" /> How to Improve
              </p>
              <div className="space-y-2">
                {improvements.map((imp, idx) => (
                  <div key={`i-${idx}`} className="flex items-start gap-2.5 p-3 rounded-sm bg-electric/5 border border-electric/10">
                    <TrendingUp className="h-3.5 w-3.5 text-electric shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/90 leading-relaxed">{imp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
