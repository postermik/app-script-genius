import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";

interface Props {
  deliverable: Deliverable;
}

export function EmailView({ deliverable }: Props) {
  const handleCopy = () => {
    const parts: string[] = [];
    if (deliverable.subject) parts.push(`Subject: ${deliverable.subject}`, "");
    deliverable.sections?.forEach(s => {
      parts.push(s.heading);
      parts.push(s.content);
      parts.push("");
    });
    navigator.clipboard.writeText(parts.join("\n"));
    toast.success("Email copied to clipboard.");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-muted/30 rounded-sm p-4 mb-6 border border-border">
        <div className="text-sm text-muted-foreground mb-1">Subject</div>
        <div className="text-base font-medium text-foreground">{deliverable.subject}</div>
      </div>

      {deliverable.sections?.map((section, i) => (
        <div key={i} className="mb-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {section.heading}
          </div>
          <div className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>
        </div>
      ))}

      <button
        onClick={handleCopy}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground border border-border rounded-sm px-3 py-1.5 transition-colors"
      >
        Copy email to clipboard
      </button>
    </div>
  );
}
