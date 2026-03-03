import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  rawInput: string;
}

export function OriginalInputSection({ rawInput }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(rawInput);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-gradient rounded-sm border border-border mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          Original Input
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-border pt-4">
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {rawInput}
          </p>
        </div>
      )}
    </div>
  );
}
