import { useState } from "react";
import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";
import { SectionEditor } from "./SectionEditor";
import { useSuggestionApply } from "@/hooks/useSuggestionApply";

interface Props {
  deliverable: Deliverable;
  onUpdateDeliverable?: (d: Deliverable) => void;
}

export function EmailView({ deliverable, onUpdateDeliverable }: Props) {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<number[]>([]);
  const { applyingIndex, applySuggestion } = useSuggestionApply(deliverable, onUpdateDeliverable);

  const handleDismiss = (i: number) => setDismissedSuggestions(prev => [...prev, i]);

  const handleSaveEdit = (index: number, newContent: string) => {
    if (!onUpdateDeliverable || !deliverable.sections) return;
    const updated = [...deliverable.sections];
    updated[index] = { ...updated[index], content: newContent };
    onUpdateDeliverable({ ...deliverable, sections: updated });
  };

  const handleCopy = () => {
    const parts: string[] = [];
    if (deliverable.subject) parts.push(`Subject: ${deliverable.subject}`, "");
    deliverable.sections?.forEach(s => { parts.push(s.heading); parts.push(s.content); parts.push(""); });
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
        <SectionEditor
          key={i}
          section={section}
          index={i}
          headingClassName="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1"
          contentClassName="text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap"
          dismissed={dismissedSuggestions.includes(i)}
          applyingIndex={applyingIndex}
          onApplySuggestion={applySuggestion}
          onDismissSuggestion={handleDismiss}
          onSaveEdit={handleSaveEdit}
        />
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
