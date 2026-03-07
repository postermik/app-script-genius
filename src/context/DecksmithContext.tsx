import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { NarrativeOutputData, OutputMode, RefinementTone, Project, ProjectVersion, OutreachEntry, VoiceProfile, AudienceType } from "@/types/narrative";
import type { IntakeSelections } from "@/types/rhetoric";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const SUPABASE_URL = "https://jilopuugwyrqogoxlxjo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IdoGcGM61fuk6JhT88wOeg_JlwFjtxz";

type LoadingPhase = "idle" | "structuring" | "sharpening" | "designing" | "scoring";

interface DecksmithContextType {
  rawInput: string;
  setRawInput: (v: string) => void;
  selectedMode: OutputMode | "auto";
  setSelectedMode: (m: OutputMode | "auto") => void;
  voiceProfile: VoiceProfile;
  setVoiceProfile: (v: VoiceProfile) => void;
  detectedMode: OutputMode | null;
  output: NarrativeOutputData | null;
  setOutput: (o: NarrativeOutputData | null) => void;
  isGenerating: boolean;
  loadingPhase: LoadingPhase;
  refiningSection: string | null;
  generationCount: number;
  generate: () => Promise<void>;
  evaluateDeck: (extractedText: string) => Promise<void>;
  refineSection: (sectionKey: string, path: string, tone: RefinementTone) => Promise<void>;
  reset: () => void;
  isEvaluation: boolean;
  session: Session | null;
  isPro: boolean;
  projects: Project[];
  loadProjects: () => Promise<void>;
  currentProjectId: string | null;
  openProject: (project: Project) => void;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  versions: ProjectVersion[];
  currentVersion: number;
  saveVersion: (summary?: string) => Promise<void>;
  loadVersion: (versionNumber: number) => Promise<void>;
  outreachTracker: OutreachEntry[];
  addOutreachEntry: (entry: OutreachEntry) => Promise<void>;
  updateOutreachEntry: (index: number, entry: OutreachEntry) => Promise<void>;
  removeOutreachEntry: (index: number) => Promise<void>;
  activeAudience: AudienceType;
  setActiveAudience: (a: AudienceType) => void;
  audienceVariants: Record<string, NarrativeOutputData>;
  adaptForAudience: (audience: AudienceType) => Promise<void>;
  isAdapting: boolean;
  isStreaming: boolean;
  streamingText: string;
  stopGenerating: () => void;
  intakeSelections: IntakeSelections | null;
  setIntakeSelections: (s: IntakeSelections | null) => void;
  appliedSuggestions: Set<string>;
  markSuggestionApplied: (key: string) => void;
  applyDeckSuggestion: (suggestion: string, suggestionIndex: number) => Promise<void>;
  rescoreNarrative: () => Promise<void>;
  dismissedSuggestions: Set<number>;
  dismissSuggestion: (index: number) => void;
}

const DecksmithContext = createContext<DecksmithContextType | null>(null);

export function DecksmithProvider({ children }: { children: React.ReactNode }) {
  const [rawInput, setRawInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<OutputMode | "auto">("auto");
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>("auto");
  const [detectedMode, setDetectedMode] = useState<OutputMode | null>(null);
  const [output, setOutput] = useState<NarrativeOutputData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [refiningSection, setRefiningSection] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(() => {
    const stored = localStorage.getItem("rhetoric_gen_count");
    return stored ? parseInt(stored, 10) : 0;
  });
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [outreachTracker, setOutreachTracker] = useState<OutreachEntry[]>([]);
  const [devSimPro, setDevSimPro] = useState(false);
  const [isEvaluation, setIsEvaluation] = useState(false);
  const [activeAudience, setActiveAudience] = useState<AudienceType>("general");
  const [audienceVariants, setAudienceVariants] = useState<Record<string, NarrativeOutputData>>({});
  const [isAdapting, setIsAdapting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [intakeSelections, setIntakeSelections] = useState<IntakeSelections | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(new Set());

  // Sync appliedSuggestions from persisted output._appliedSuggestions whenever output changes
  useEffect(() => {
    if (!output) return;
    const persisted = (output as any)._appliedSuggestions;
    if (Array.isArray(persisted) && persisted.length > 0) {
      setAppliedSuggestions(new Set(persisted.map(String)));
    }
    const persistedDismissed = (output as any)._dismissedSuggestions;
    if (Array.isArray(persistedDismissed) && persistedDismissed.length > 0) {
      setDismissedSuggestions(new Set(persistedDismissed));
    }
  }, [output]);
  const { subscribed, productId } = useSubscription();
  const isPro = devSimPro || (subscribed && productId === TIERS.pro.product_id);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const loadProjects = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setProjects(data.map((p: any) => ({
        id: p.id, title: p.title, mode: p.mode, raw_input: p.raw_input,
        output_data: p.output_data as NarrativeOutputData | null,
        detected_intent: p.detected_intent, current_thesis: p.current_thesis,
        refinement_history: p.refinement_history || [],
        outreach_tracker: p.outreach_tracker || [],
        created_at: p.created_at, updated_at: p.updated_at,
      })));
    }
  }, [session]);

  useEffect(() => {
    if (session) loadProjects();
  }, [session, loadProjects]);

  const loadVersions = useCallback(async (projectId: string) => {
    const { data } = await supabase
      .from("project_versions")
      .select("id, version_number, summary, created_at")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false });
    if (data) {
      setVersions(data);
      if (data.length > 0) setCurrentVersion(data[0].version_number);
    }
  }, []);

  const extractThesis = (parsed: NarrativeOutputData): string => {
    const d = (parsed.data || (parsed as any).supporting || {}) as any;
    if (parsed.mode === "fundraising") return d.thesis?.content || d.thesis || "";
    if (parsed.mode === "strategy") return d.thesis || "";
    if (parsed.mode === "board_update") return d.executiveSummary || "";
    if (parsed.mode === "product_vision") return d.vision || "";
    if (parsed.mode === "investor_update") return d.headline || "";
    return "";
  };

  const saveProject = useCallback(async (parsed: NarrativeOutputData) => {
    if (!session) return;
    const title = (parsed as any).title || "Untitled";
    const thesis = extractThesis(parsed);
    if (currentProjectId) {
      await supabase.from("projects").update({
        title, mode: parsed.mode, raw_input: rawInput,
        output_data: parsed as any, detected_intent: parsed.mode, current_thesis: thesis,
      }).eq("id", currentProjectId);
    } else {
      const { data } = await supabase.from("projects").insert({
        user_id: session.user.id, title, mode: parsed.mode, raw_input: rawInput,
        output_data: parsed as any, detected_intent: parsed.mode, current_thesis: thesis,
      }).select("id").single();
      if (data) setCurrentProjectId(data.id);
    }
    loadProjects();
  }, [session, currentProjectId, rawInput, loadProjects]);

  const startLoadingPhases = useCallback(() => {
    setLoadingPhase("structuring");
    phaseTimerRef.current = setTimeout(() => {
      setLoadingPhase("sharpening");
      phaseTimerRef.current = setTimeout(() => {
        setLoadingPhase("designing");
        phaseTimerRef.current = setTimeout(() => {
          setLoadingPhase("scoring");
        }, 4000);
      }, 3000);
    }, 3000);
  }, []);

  const stopLoadingPhases = useCallback(() => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    setLoadingPhase("idle");
  }, []);

  // Attempt to repair truncated JSON by closing unclosed brackets/braces
  const repairJSON = (text: string): any => {
    let cleaned = text.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
    // Remove trailing commas before closing brackets
    cleaned = cleaned.replace(/,\s*$/, "");
    
    // Count unclosed brackets
    let braces = 0, brackets = 0;
    let inString = false, escape = false;
    for (const ch of cleaned) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') braces++;
      if (ch === '}') braces--;
      if (ch === '[') brackets++;
      if (ch === ']') brackets--;
    }
    
    // If we're inside an unterminated string, close it
    if (inString) cleaned += '"';
    
    // Close any unclosed brackets/braces
    for (let i = 0; i < brackets; i++) cleaned += ']';
    for (let i = 0; i < braces; i++) cleaned += '}';
    
    // Remove trailing commas before closing brackets (again after repair)
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
    
    return JSON.parse(cleaned);
  };

  const streamFromEdgeFunction = useCallback(async (
    body: Record<string, any>,
    signal: AbortSignal
  ): Promise<any> => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) throw new Error("Not authenticated");

    // Always request generous token limit
    const bodyWithTokens = { ...body, max_tokens: 16384 };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/decksmith-ai`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentSession.access_token}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(bodyWithTokens),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Generation failed (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream")) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to read stream");

      const decoder = new TextDecoder();
      let fullText = "";
      setIsStreaming(true);
      setStreamingText("");

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.text) {
                  fullText += parsed.text;
                  setStreamingText(fullText);
                }
              } catch {
                // skip unparseable chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      setIsStreaming(false);
      setStreamingText("");

      // Try strict parse first, then attempt JSON repair for truncated responses
      const cleaned = fullText.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.warn("Strict JSON parse failed, attempting repair...");
        try {
          const repaired = repairJSON(fullText);
          console.log("JSON repair succeeded");
          toast.info("Output was slightly truncated but recovered successfully.");
          return repaired;
        } catch (repairError) {
          console.error("JSON repair also failed:", repairError);
          console.error("Raw text (first 1000 chars):", fullText.slice(0, 1000));
          console.error("Raw text (last 500 chars):", fullText.slice(-500));
          throw new Error("Generation failed. The AI response was incomplete. Please try again with fewer selected outputs.");
        }
      }
    } else {
      // Non-streaming fallback
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const cleaned = (data.content || "").replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        return repairJSON(data.content || "");
      }
    }
  }, []);

  const generate = useCallback(async () => {
    if (!rawInput.trim() || isGenerating) return;
    setIsGenerating(true);
    setIsEvaluation(false);
    startLoadingPhases();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let currentThesis: string | undefined;
    if (currentProjectId) {
      const proj = projects.find(p => p.id === currentProjectId);
      if (proj?.current_thesis) currentThesis = proj.current_thesis;
    }

    const attempt = async (retry: boolean): Promise<void> => {
      try {
        const parsed = await streamFromEdgeFunction(
          { mode: "generate", input: rawInput, outputMode: selectedMode, currentThesis, voiceProfile, model: "claude-sonnet-4-20250514" },
          abortController.signal
        );
        setDetectedMode(parsed.mode);
        setOutput(parsed);
        const newCount = generationCount + 1;
        setGenerationCount(newCount);
        localStorage.setItem("rhetoric_gen_count", String(newCount));
        await saveProject(parsed);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        if (retry) {
          console.warn("First attempt failed, retrying...", e);
          return attempt(false);
        }
        console.error("Generation error:", e);
        toast.error(e.message || "Generation failed. Please try again.");
      }
    };

    await attempt(true);
    abortControllerRef.current = null;
    stopLoadingPhases();
    setIsGenerating(false);
  }, [rawInput, selectedMode, voiceProfile, generationCount, isGenerating, saveProject, startLoadingPhases, stopLoadingPhases, currentProjectId, projects, streamFromEdgeFunction]);

  const evaluateDeck = useCallback(async (extractedText: string) => {
    if (!extractedText.trim() || isGenerating) return;
    setIsGenerating(true);
    setIsEvaluation(true);
    setRawInput(extractedText);
    startLoadingPhases();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const attempt = async (retry: boolean): Promise<void> => {
      try {
        const parsed = await streamFromEdgeFunction(
          { mode: "evaluate", input: extractedText },
          abortController.signal
        );
        setDetectedMode(parsed.mode);
        setOutput(parsed);

        // Save as evaluation project
        if (session) {
          const title = (parsed as any).title || "Deck Evaluation";
          const thesis = extractThesis(parsed);
          const { data: projData } = await supabase.from("projects").insert({
            user_id: session.user.id, title, mode: parsed.mode, raw_input: extractedText,
            output_data: parsed as any, detected_intent: "evaluate", current_thesis: thesis,
          }).select("id").single();
          if (projData) setCurrentProjectId(projData.id);
          loadProjects();
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
        if (retry) {
          console.warn("Evaluation first attempt failed, retrying...", e);
          return attempt(false);
        }
        console.error("Evaluation error:", e);
        toast.error(e.message || "Evaluation failed. Please try again.");
        setIsEvaluation(false);
      }
    };

    await attempt(true);
    abortControllerRef.current = null;
    stopLoadingPhases();
    setIsGenerating(false);
  }, [isGenerating, session, startLoadingPhases, stopLoadingPhases, loadProjects, streamFromEdgeFunction]);

  const refineSection = useCallback(async (sectionKey: string, path: string, tone: RefinementTone) => {
    if (!output) return;
    setRefiningSection(sectionKey);
    try {
      // Read from supporting first (new format), then data (legacy)
      const sourceObj = (output as any).supporting || output.data || {};
      const currentContent = getNestedValue(sourceObj, path);
      const { data, error } = await supabase.functions.invoke("decksmith-ai", {
        body: { mode: "refine", input: rawInput, section: sectionKey, path, tone, currentContent },
      });
      if (error) throw error;
      const refined = data.content;

      setOutput((prev) => {
        if (!prev) return prev;
        const updated = JSON.parse(JSON.stringify(prev));
        // Write back to the same location we read from
        if (updated.supporting && getNestedValue(updated.supporting, path.split(".")[0]) !== undefined) {
          setNestedValue(updated.supporting, path, refined);
        } else if (updated.data) {
          setNestedValue(updated.data, path, refined);
        } else if (updated.supporting) {
          setNestedValue(updated.supporting, path, refined);
        }
        saveProject(updated as NarrativeOutputData);

        if (currentProjectId && session) {
          const historyEntry = { section: sectionKey, tone, timestamp: new Date().toISOString(), before: currentContent, after: refined };
          supabase.from("projects").update({
            refinement_history: [...(projects.find(p => p.id === currentProjectId)?.refinement_history || []), historyEntry] as any,
          }).eq("id", currentProjectId).then();
        }

        return updated;
      });
    } catch (e: any) {
      console.error("Refinement error:", e);
      toast.error("Refinement failed. Please try again.");
    } finally {
      setRefiningSection(null);
    }
  }, [output, rawInput, saveProject, currentProjectId, session, projects]);

  const applyDeckSuggestion = useCallback(async (suggestion: string, suggestionIndex: number) => {
    if (!output) return;
    setRefiningSection(`suggestion-${suggestionIndex}`);
    try {
      const deliverable = (output as any).deliverable;
      const deckFramework = deliverable?.deckFramework || (output as any).data?.deckFramework || [];

      const { data, error } = await supabase.functions.invoke("decksmith-ai", {
        body: {
          mode: "refine",
          input: rawInput,
          section: "deckFramework",
          path: "deckFramework",
          tone: suggestion,
          currentContent: JSON.stringify(deckFramework),
          model: "claude-sonnet-4-20250514",
        },
      });
      if (error) throw error;

      let refined = data.content;
      if (typeof refined === "string") {
        const cleaned = refined.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
        try { refined = JSON.parse(cleaned); } catch { /* leave as string if not JSON */ }
      }

      setOutput((prev) => {
        if (!prev) return prev;
        const updated = JSON.parse(JSON.stringify(prev));

        if (Array.isArray(refined)) {
          // AI returned a full updated framework
          if (updated.deliverable) updated.deliverable.deckFramework = refined;
          if (updated.data?.deckFramework) updated.data.deckFramework = refined;
        } else if (refined && typeof refined === "object" && refined.headline) {
          // AI returned a single new slide - append it
          const fw = updated.deliverable?.deckFramework || updated.data?.deckFramework || [];
          fw.push(refined);
          if (updated.deliverable) updated.deliverable.deckFramework = fw;
          if (updated.data?.deckFramework) updated.data.deckFramework = fw;
        }

        // Persist applied suggestion
        if (!updated._appliedSuggestions) updated._appliedSuggestions = [];
        updated._appliedSuggestions.push(`deck-${suggestionIndex}`);

        saveProject(updated as NarrativeOutputData);
        return updated;
      });

      setAppliedSuggestions(prev => new Set(prev).add(`deck-${suggestionIndex}`));
      setDismissedSuggestions(prev => new Set(prev).add(suggestionIndex));
      toast.success("Suggestion applied to deck.");
    } catch (e: any) {
      console.error("Apply deck suggestion error:", e);
      toast.error("Failed to apply suggestion. Please try again.");
    } finally {
      setRefiningSection(null);
    }
  }, [output, rawInput, saveProject]);

  const rescoreNarrative = useCallback(async () => {
    if (!output) return;
    setRefiningSection("rescore");
    try {
      // Gather the CURRENT narrative content including any applied suggestions
      const deliverable = (output as any).deliverable;
      const deckFramework = deliverable?.deckFramework || (output as any).data?.deckFramework || [];
      const narrativeData = (output as any).supporting || output.data || {};

      // Build a comprehensive snapshot of the current narrative state
      const narrativeSnapshot = {
        deckFramework: deckFramework.map((slide: any) => ({
          headline: slide.headline || slide,
          content: slide.body || slide.content || "",
        })),
        thesis: narrativeData.thesis?.content || narrativeData.thesis || "",
        narrativeStructure: narrativeData.narrativeStructure || {},
        pitchScript: narrativeData.pitchScript || "",
        marketLogic: narrativeData.marketLogic || [],
        risks: narrativeData.risks || "",
        whyNow: narrativeData.whyNow || "",
      };

      console.log("[Rescore] Sending current narrative snapshot with", deckFramework.length, "slides");

      const { data, error } = await supabase.functions.invoke("decksmith-ai", {
        body: {
          mode: "refine",
          input: rawInput,
          section: "score",
          path: "score",
          tone: "rescore",
          currentContent: JSON.stringify(narrativeSnapshot),
          model: "claude-sonnet-4-20250514",
        },
      });
      if (error) throw error;

      let scoreContent = data.content;
      if (typeof scoreContent === "string") {
        scoreContent = scoreContent.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
        scoreContent = JSON.parse(scoreContent);
      }

      console.log("[Rescore] New score:", scoreContent.overall, "vs old:", (output as any).score?.overall);

      setOutput((prev) => {
        if (!prev) return prev;
        const updated = JSON.parse(JSON.stringify(prev));
        updated.score = scoreContent;
        // Clear persisted applied suggestions since we rescored
        updated._appliedSuggestions = [];
        saveProject(updated as NarrativeOutputData);
        return updated;
      });

      setAppliedSuggestions(new Set());
      toast.success("Score updated.");
    } catch (e: any) {
      console.error("Rescore error:", e);
      toast.error("Re-scoring failed. Please try again.");
    } finally {
      setRefiningSection(null);
    }
  }, [output, rawInput, saveProject]);

  const dismissSuggestion = useCallback((index: number) => {
    setDismissedSuggestions(prev => new Set(prev).add(index));
    // Persist in output
    setOutput((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (!(updated as any)._dismissedSuggestions) (updated as any)._dismissedSuggestions = [];
      (updated as any)._dismissedSuggestions.push(index);
      saveProject(updated as NarrativeOutputData);
      return updated;
    });
  }, [saveProject]);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsGenerating(false);
    setStreamingText("");
    toast.info("Generation stopped.");
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setRawInput("");
    setOutput(null);
    setDetectedMode(null);
    setCurrentProjectId(null);
    setVersions([]);
    setCurrentVersion(1);
    setOutreachTracker([]);
    setActiveAudience("general");
    setAudienceVariants({});
    setIsEvaluation(false);
    setIsStreaming(false);
    setStreamingText("");
    setIntakeSelections(null);
    setAppliedSuggestions(new Set());
    setDismissedSuggestions(new Set());
  }, []);

  const adaptForAudience = useCallback(async (audience: AudienceType) => {
    if (!output || !rawInput.trim()) return;
    // If we already have this variant cached, just switch
    if (audienceVariants[audience]) {
      setActiveAudience(audience);
      setOutput(audienceVariants[audience]);
      return;
    }
    setIsAdapting(true);
    try {
      const audiencePrompts: Record<AudienceType, string> = {
        general: "",
        investors: "Adapt this for external investors. Be risk-aware, returns-focused, and persuasive. Emphasize market opportunity, traction, and exit potential.",
        board: "Adapt this for a board of directors. Be metrics-heavy, strategic, and concise. Focus on governance, KPIs, and decision items.",
        internal: "Adapt this for internal employees. Be transparent, motivational, and operational. Focus on team impact, roadmap, and company vision.",
      };
      const { data, error } = await supabase.functions.invoke("decksmith-ai", {
        body: { mode: "generate", input: `${rawInput}\n\n---\nAUDIENCE INSTRUCTION: ${audiencePrompts[audience]}`, outputMode: output.mode, voiceProfile },
      });
      if (error) throw error;
      if (!data?.content) throw new Error("Empty response");
      const cleaned = data.content.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleaned);
      setAudienceVariants(prev => ({ ...prev, [audience]: parsed }));
      setActiveAudience(audience);
      setOutput(parsed);
      // Save variant to project
      if (currentProjectId) {
        const existing = audienceVariants;
        const allVariants = { ...existing, [audience]: parsed };
        await supabase.from("projects").update({ audience_variants: allVariants as any }).eq("id", currentProjectId);
      }
      toast.success(`Adapted for ${audience} audience.`);
    } catch (e: any) {
      console.error("Audience adaptation error:", e);
      toast.error("Failed to adapt for audience. Try again.");
    } finally {
      setIsAdapting(false);
    }
  }, [output, rawInput, audienceVariants, voiceProfile, currentProjectId]);

  const openProject = useCallback((project: Project) => {
    setRawInput(project.raw_input);
    setOutput(project.output_data);
    setDetectedMode(project.mode as OutputMode);
    setCurrentProjectId(project.id);
    setOutreachTracker(project.outreach_tracker || []);
    setIsEvaluation(project.detected_intent === "evaluate");
    // Restore persisted suggestion state
    const applied = (project.output_data as any)?._appliedSuggestions || [];
    setAppliedSuggestions(new Set(applied));
    const dismissed = (project.output_data as any)?._dismissedSuggestions || [];
    setDismissedSuggestions(new Set(dismissed));
    loadVersions(project.id);
  }, [loadVersions]);

  const deleteProject = useCallback(async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProjectId === id) reset();
  }, [currentProjectId, reset]);

  const duplicateProject = useCallback(async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project || !session) return;
    await supabase.from("projects").insert({
      user_id: session.user.id, title: `${project.title} (copy)`,
      mode: project.mode, raw_input: project.raw_input,
      output_data: project.output_data as any,
      detected_intent: project.detected_intent, current_thesis: project.current_thesis,
    });
    loadProjects();
    toast.success("Project duplicated.");
  }, [projects, session, loadProjects]);

  const saveVersion = useCallback(async (summary?: string) => {
    if (!currentProjectId || !session || !output) return;
    const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;
    const thesis = extractThesis(output);
    await supabase.from("project_versions").insert({
      project_id: currentProjectId, user_id: session.user.id,
      version_number: nextVersion, raw_input: rawInput,
      output_data: output as any, current_thesis: thesis,
      summary: summary || `Version ${nextVersion}`,
    });
    setCurrentVersion(nextVersion);
    loadVersions(currentProjectId);
    toast.success(`Version ${nextVersion} saved.`);
  }, [currentProjectId, session, output, versions, rawInput, loadVersions]);

  const loadVersion = useCallback(async (versionNumber: number) => {
    if (!currentProjectId) return;
    const { data } = await supabase
      .from("project_versions")
      .select("*")
      .eq("project_id", currentProjectId)
      .eq("version_number", versionNumber)
      .single();
    if (data) {
      setRawInput(data.raw_input);
      setOutput(data.output_data as unknown as NarrativeOutputData);
      setCurrentVersion(data.version_number);
      toast.success(`Restored to version ${versionNumber}.`);
    }
  }, [currentProjectId]);

  const syncOutreach = useCallback(async (tracker: OutreachEntry[]) => {
    if (!currentProjectId) return;
    setOutreachTracker(tracker);
    await supabase.from("projects").update({ outreach_tracker: tracker as any }).eq("id", currentProjectId);
  }, [currentProjectId]);

  const addOutreachEntry = useCallback(async (entry: OutreachEntry) => {
    await syncOutreach([...outreachTracker, entry]);
  }, [outreachTracker, syncOutreach]);

  const updateOutreachEntry = useCallback(async (index: number, entry: OutreachEntry) => {
    const updated = [...outreachTracker];
    updated[index] = entry;
    await syncOutreach(updated);
  }, [outreachTracker, syncOutreach]);

  const removeOutreachEntry = useCallback(async (index: number) => {
    const updated = outreachTracker.filter((_, i) => i !== index);
    await syncOutreach(updated);
  }, [outreachTracker, syncOutreach]);

  return (
    <DecksmithContext.Provider
      value={{
        rawInput, setRawInput, selectedMode, setSelectedMode,
        voiceProfile, setVoiceProfile,
        detectedMode, output, setOutput, isGenerating, loadingPhase, refiningSection,
        generationCount, generate, evaluateDeck, refineSection, reset, isEvaluation,
        session, isPro, projects, loadProjects,
        currentProjectId, openProject, deleteProject, duplicateProject,
        versions, currentVersion, saveVersion, loadVersion,
        outreachTracker, addOutreachEntry, updateOutreachEntry, removeOutreachEntry,
        activeAudience, setActiveAudience, audienceVariants, adaptForAudience, isAdapting,
        isStreaming, streamingText, stopGenerating,
        intakeSelections, setIntakeSelections,
        appliedSuggestions, markSuggestionApplied: useCallback((key: string) => {
          setAppliedSuggestions(prev => new Set(prev).add(key));
          // Persist in output
          setOutput((prev: any) => {
            if (!prev) return prev;
            const updated = { ...prev };
            if (!updated._appliedSuggestions) updated._appliedSuggestions = [];
            updated._appliedSuggestions.push(key);
            return updated;
          });
        }, []),
        applyDeckSuggestion, rescoreNarrative,
        dismissedSuggestions, dismissSuggestion,
      }}
    >
      {children}
    </DecksmithContext.Provider>
  );
}

export function useDecksmith() {
  const ctx = useContext(DecksmithContext);
  if (!ctx) throw new Error("useDecksmith must be used within DecksmithProvider");
  return ctx;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  const last = keys.pop()!;
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}
