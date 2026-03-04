import { Lightbulb, Loader2 } from "lucide-react";

interface Props {
  suggestion: string;
  onApply: () => void;
  onDismiss: () => void;
  isApplying?: boolean;
}

export function SuggestionCard({ suggestion, onApply, onDismiss, isApplying }: Props) {
  return (
    <div className="mt-3 bg-electric/[0.06] border border-electric/20 rounded-sm p-3 flex items-start gap-3">
      <div className="text-electric mt-0.5">
        <Lightbulb className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-foreground/80">{suggestion}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onApply}
          disabled={isApplying}
          className="text-xs px-2.5 py-1 bg-electric hover:bg-electric/80 text-primary-foreground rounded-sm transition-colors disabled:opacity-50 font-medium"
        >
          {isApplying ? (
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Applying…</span>
          ) : "Apply"}
        </button>
        <button
          onClick={onDismiss}
          className="text-xs px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
