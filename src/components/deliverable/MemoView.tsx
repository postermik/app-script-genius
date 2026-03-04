import { useState } from "react";
import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";
import { SectionEditor } from "./SectionEditor";
import { useSuggestionApply } from "@/hooks/useSuggestionApply";

interface Props {
  deliverable: Deliverable;
  onUpdateDeliverable?: (d: Deliverable) => void;
}

export function MemoView({ deliverable, onUpdateDeliverable }: Props) {
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
    if (deliverable.to) parts.push(`To: ${deliverable.to}`);
    if (deliverable.from) parts.push(`From: ${deliverable.from}`);
    if (deliverable.subject) parts.push(`Subject: ${deliverable.subject}`);
    if (parts.length) parts.push("");
    deliverable.sections?.forEach(s => { parts.push(s.heading); parts.push(s.content); parts.push(""); });
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
        <SectionEditor
          key={i}
          section={section}
          index={i}
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
        Copy memo to clipboard
      </button>
    </div>
  );
}
