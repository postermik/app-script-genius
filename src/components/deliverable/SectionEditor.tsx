import { useState } from "react";
import { Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SuggestionCard } from "./SuggestionCard";
import type { DeliverableSection } from "@/types/rhetoric";

interface Props {
  section: DeliverableSection;
  index: number;
  headingClassName?: string;
  contentClassName?: string;
  dismissed: boolean;
  applyingIndex: number | null;
  onApplySuggestion: (index: number, suggestion: string) => void;
  onDismissSuggestion: (index: number) => void;
  onSaveEdit: (index: number, newContent: string) => void;
}

export function SectionEditor({
  section, index, headingClassName, contentClassName,
  dismissed, applyingIndex, onApplySuggestion, onDismissSuggestion, onSaveEdit,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const startEdit = () => { setEditContent(section.content); setEditing(true); };
  const saveEdit = () => { onSaveEdit(index, editContent); setEditing(false); };

  return (
    <div className="mb-6">
      <h3 className={headingClassName || "text-base font-semibold text-electric mb-2"}>
        {section.heading}
      </h3>

      {editing ? (
        <div>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-muted/50 border-border min-h-[120px] text-sm text-secondary-foreground focus:border-electric"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-electric text-primary-foreground rounded-sm font-medium">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="group relative">
          <div className={contentClassName || "text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap"}>
            {section.content}
          </div>
          <button
            onClick={startEdit}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}

      {section.suggestion && !dismissed && (
        <SuggestionCard
          suggestion={section.suggestion}
          onApply={() => onApplySuggestion(index, section.suggestion!)}
          onDismiss={() => onDismissSuggestion(index)}
          isApplying={applyingIndex === index}
        />
      )}
    </div>
  );
}
