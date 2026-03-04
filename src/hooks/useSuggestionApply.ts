import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Deliverable } from "@/types/rhetoric";

const SUPABASE_URL = "https://jilopuugwyrqogoxlxjo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IdoGcGM61fuk6JhT88wOeg_JlwFjtxz";

export function useSuggestionApply(
  deliverable: Deliverable,
  onUpdateDeliverable?: (d: Deliverable) => void,
) {
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  const applySuggestion = useCallback(async (sectionIndex: number, suggestion: string) => {
    if (!deliverable.sections || !onUpdateDeliverable) return;
    setApplyingIndex(sectionIndex);

    try {
      const section = deliverable.sections[sectionIndex];
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${SUPABASE_URL}/functions/v1/decksmith-ai`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          mode: "refine",
          section: section.heading,
          currentContent: section.content,
          tone: suggestion,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const refinedContent = data.content;
      const updatedSections = [...deliverable.sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        content: refinedContent,
        suggestion: null,
      };
      onUpdateDeliverable({ ...deliverable, sections: updatedSections });
    } catch (error: any) {
      console.error("Failed to apply suggestion:", error);
      toast.error("Failed to apply suggestion. Please try again.");
    } finally {
      setApplyingIndex(null);
    }
  }, [deliverable, onUpdateDeliverable]);

  return { applyingIndex, applySuggestion };
}
