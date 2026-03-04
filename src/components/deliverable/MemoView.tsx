import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";

interface Props {
  deliverable: Deliverable;
}

export function MemoView({ deliverable }: Props) {
  const handleCopy = () => {
    const parts: string[] = [];
    if (deliverable.to) parts.push(`To: ${deliverable.to}`);
    if (deliverable.from) parts.push(`From: ${deliverable.from}`);
    if (deliverable.subject) parts.push(`Subject: ${deliverable.subject}`);
    if (parts.length) parts.push("");
    deliverable.sections?.forEach(s => {
      parts.push(s.heading);
      parts.push(s.content);
      parts.push("");
    });
    navigator.clipboard.writeText(parts.join("\n"));
    toast.success("Memo copied to clipboard.");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="border-b border-border pb-4 mb-6">
        {deliverable.to && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-secondary-foreground">To:</span> {deliverable.to}
          </div>
        )}
        {deliverable.from && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-secondary-foreground">From:</span> {deliverable.from}
          </div>
        )}
        {deliverable.subject && (
          <div className="text-lg font-semibold text-foreground mt-2">{deliverable.subject}</div>
        )}
      </div>

      {deliverable.sections?.map((section, i) => (
        <div key={i} className="mb-6">
          <h3 className="text-base font-semibold text-electric mb-2">{section.heading}</h3>
          <div className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>
        </div>
      ))}

      <button
        onClick={handleCopy}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm px-3 py-1.5 transition-colors"
      >
        Copy memo to clipboard
      </button>
    </div>
  );
}
