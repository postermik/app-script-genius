import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { NarrativeOutputData, OutputMode, RefinementTone, Project, ProjectVersion, OutreachEntry, VoiceProfile, AudienceType } from "@/types/narrative";
import type { IntakeSelections, OutputDeliverable, CoreNarrativeData, IntakePurpose } from "@/types/rhetoric";
import { CORE_NARRATIVE_SECTIONS } from "@/types/rhetoric";
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
  generateSlides: () => Promise<void>;
  generateOutput: (outputType: OutputDeliverable) => Promise<void>;
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
  isGeneratingSlides: boolean;
  completedOutputs: Set<string>;
  generationOutputs: OutputDeliverable[];
  coreNarrative: CoreNarrativeData | null;
  outputData: Record<string, any>;
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
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [generationOutputs, setGenerationOutputs] = useState<OutputDeliverable[]>([]);
  const [coreNarrative, setCoreNarrative] = useState<CoreNarrativeData | null>(null);
  const [outputData, setOutputData] = useState<Record<string, any>>({});
  const [scoringComplete, setScoringComplete] = useState(false);
  const inFlightOutputsRef = useRef<Set<string>>(new Set());

  // Derive completedOutputs from actual data — no separate state to go stale
  const completedOutputs = useMemo(() => {
    const set = new Set<string>();
    if (coreNarrative?.sections?.length) set.add("core_narrative");
    for (const key of Object.keys(outputData)) {
      if (!key.endsWith("_error") && !key.endsWith("_rawResponse")) {
        set.add(key);
      }
    }
    if (scoringComplete) set.add("_scoring");
    return set;
  }, [coreNarrative, outputData, scoringComplete]);

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
    supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); });
  }, []);

  // Refs for persistence effect
  const outputDataRef = useRef(outputData);
  outputDataRef.current = outputData;
  const coreNarrativeRef = useRef(coreNarrative);
  coreNarrativeRef.current = coreNarrative;
  const intakeSelectionsRef = useRef(intakeSelections);
  intakeSelectionsRef.current = intakeSelections;
  const setIntakeSelectionsWithRef = useCallback((s: IntakeSelections | null) => {
    intakeSelectionsRef.current = s;
    setIntakeSelections(s);
  }, []);

  // Batch save removed — incremental saves handle output content.
  // Metadata-only save happens at end of generate() via saveQueueRef.

  const loadProjects = useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
    if (!error && data) {
      setProjects(data.map((p: any) => ({
        id: p.id, title: p.title, mode: p.mode, raw_input: p.raw_input,
        output_data: p.output_data || null,
        detected_intent: p.detected_intent, current_thesis: p.current_thesis,
        refinement_history: p.refinement_history || [],
        outreach_tracker: p.outreach_tracker || [],
        created_at: p.created_at, updated_at: p.updated_at,
      })));
    }
  }, [session]);

  useEffect(() => { if (session) loadProjects(); }, [session, loadProjects]);

  const loadVersions = useCallback(async (projectId: string) => {
    const { data } = await supabase.from("project_versions").select("id, version_number, summary, created_at").eq("project_id", projectId).order("version_number", { ascending: false });
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

  const saveProject = useCallback(async (parsed: NarrativeOutputData, extras?: { coreNarrative?: CoreNarrativeData; outputData?: Record<string, any>; intakeSelections?: IntakeSelections }) => {
    if (!session) return;
    const title = (parsed as any).title || "Untitled";
    const thesis = extractThesis(parsed);
    const cn = extras?.coreNarrative || coreNarrative;
    const od = extras?.outputData || outputData;
    const is = extras?.intakeSelections || intakeSelections;
    
    // Build the unified output_data payload
    const persistPayload = {
      core_narrative: cn,
      ...od,
      intake_selections: is,
      applied_suggestions: Array.from(appliedSuggestions),
      dismissed_suggestions: Array.from(dismissedSuggestions),
      tab_order: is?.outputs || [],
      // Keep legacy fields for backward compat
      score: (parsed as any).score || null,
      mode: parsed.mode,
      title,
      intent: (parsed as any).intent || "create",
    };
    
    console.log("[Persistence] saveProject payload:", JSON.stringify(persistPayload).substring(0, 500));
    
    if (currentProjectId) {
      await supabase.from("projects").update({
        title, mode: parsed.mode, raw_input: rawInput,
        output_data: persistPayload as any, detected_intent: parsed.mode, current_thesis: thesis,
      }).eq("id", currentProjectId);
    } else {
      const { data } = await supabase.from("projects").insert({
        user_id: session.user.id, title, mode: parsed.mode, raw_input: rawInput,
        output_data: persistPayload as any, detected_intent: parsed.mode, current_thesis: thesis,
      }).select("id").single();
      if (data) setCurrentProjectId(data.id);
    }
    loadProjects();
  }, [session, currentProjectId, rawInput, loadProjects, coreNarrative, outputData, intakeSelections, appliedSuggestions, dismissedSuggestions]);

  // Serialized save queue to prevent concurrent read-then-write races
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Incremental save: persist a single output to output_data column (serialized)
  const saveOutputIncremental = useCallback((outputType: string, result: any, projectId?: string) => {
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      const pid = projectId || currentProjectId;
      if (!pid) {
        console.warn(`[Persistence] No project ID for saving ${outputType}, skipping`);
        return;
      }
      try {
        const { data: project } = await supabase.from("projects").select("output_data").eq("id", pid).single();
        const existing = (project?.output_data as any) || {};
        const updated = { ...existing, [outputType]: result };
        await supabase.from("projects").update({
          output_data: updated as any,
        }).eq("id", pid);
        console.log(`[Persistence] Saved ${outputType} incrementally to project ${pid}`);
        console.log("[Persistence] Saved to output_data:", JSON.stringify(updated).substring(0, 500));
      } catch (e) {
        console.warn(`[Persistence] Failed to save ${outputType} incrementally:`, e);
      }
    });
    return saveQueueRef.current;
  }, [currentProjectId]);

  const startLoadingPhases = useCallback(() => {
    setLoadingPhase("structuring");
    phaseTimerRef.current = setTimeout(() => {
      setLoadingPhase("sharpening");
      phaseTimerRef.current = setTimeout(() => {
        setLoadingPhase("designing");
        phaseTimerRef.current = setTimeout(() => { setLoadingPhase("scoring"); }, 4000);
      }, 3000);
    }, 3000);
  }, []);

  const stopLoadingPhases = useCallback(() => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    setLoadingPhase("idle");
  }, []);

  // ── JSON parsing / repair ──
  const stripFences = (text: string): string => {
    // Strip markdown code fences aggressively
    let cleaned = text.trim();
    // Remove leading ```json or ``` with optional whitespace
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "");
    // Remove trailing ```
    cleaned = cleaned.replace(/\n?```\s*$/, "");
    // If there's still a fence deeper in, extract just the JSON block
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) cleaned = fenceMatch[1];
    return cleaned.trim();
  };

  const extractJSON = (text: string): string => {
    // Try array first
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    
    // If array comes first and seems complete, use it
    if (firstBracket !== -1 && lastBracket > firstBracket && (firstBrace === -1 || firstBracket < firstBrace)) {
      return text.slice(firstBracket, lastBracket + 1);
    }
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return text.slice(firstBrace, lastBrace + 1);
    }
    return text;
  };

  const repairJSON = (text: string): any => {
    let cleaned = stripFences(text);
    // If it doesn't start with {, try to extract JSON
    if (!cleaned.startsWith("{")) cleaned = extractJSON(cleaned);
    cleaned = cleaned.replace(/,\s*$/, "");
    try { return JSON.parse(cleaned); } catch {}
    // Strip trailing partial key-value pairs
    const lastGoodPatterns = [/,\s*"[^"]*"\s*$/, /,\s*"[^"]*":\s*"[^"]*$/, /,\s*"[^"]*":\s*$/];
    for (const pattern of lastGoodPatterns) {
      const stripped = cleaned.replace(pattern, "");
      if (stripped !== cleaned) { cleaned = stripped; break; }
    }
    let braces = 0, brackets = 0, inString = false, escape = false;
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
    if (inString) cleaned += '"';
    cleaned = cleaned.replace(/,\s*$/, "");
    for (let i = 0; i < brackets; i++) cleaned += ']';
    for (let i = 0; i < braces; i++) cleaned += '}';
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(cleaned);
  };

  // ── Non-streaming API call (for individual outputs) ──
  const callEdgeFunction = useCallback(async (body: Record<string, any>, signal?: AbortSignal): Promise<any> => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) throw new Error("Not authenticated");

    console.log(`[Generation] Calling decksmith-ai: mode=${body.mode}, outputType=${body.outputType || 'full'}`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/decksmith-ai`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${currentSession.access_token}`,
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ ...body, max_tokens: body.max_tokens || 4096, model: body.model || "claude-sonnet-4-20250514" }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Generation failed (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      return await readStream(response);
    } else {
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const rawContent = data.content || "";
      console.log(`[Generation] Raw response length: ${rawContent.length}`);
      console.log(`[Generation] Raw response (first 500):`, rawContent.substring(0, 500));
      const cleaned = stripFences(rawContent);
      // Try direct parse (handles both objects and arrays)
      try {
        const result = JSON.parse(cleaned);
        // If it's an array, wrap it (likely slide framework)
        if (Array.isArray(result)) {
          console.log(`[Generation] Parsed as array with ${result.length} items`);
          return { deckFramework: result };
        }
        console.log(`[Generation] Successfully parsed response`);
        return result;
      } catch {}
      // Try extracting JSON
      const extracted = extractJSON(rawContent);
      try {
        const result = JSON.parse(extracted);
        if (Array.isArray(result)) return { deckFramework: result };
        return result;
      } catch {}
      // Try repair
      try {
        const repaired = repairJSON(rawContent);
        if (Array.isArray(repaired)) return { deckFramework: repaired };
        return repaired;
      } catch (e) {
        console.error(`[Generation] Parse failed. Full raw response:`, rawContent);
        const err = new Error("AI response could not be parsed. Please retry.");
        (err as any).rawResponse = rawContent;
        throw err;
      }
    }
  }, []);

  const readStream = async (response: Response): Promise<any> => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to read stream");
    const decoder = new TextDecoder();
    let fullText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.text) fullText += parsed.text;
            } catch {}
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Parse the full text
    console.log(`[Generation] Stream complete, total length: ${fullText.length}`);
    console.log(`[Generation] Stream raw (first 500):`, fullText.substring(0, 500));
    const cleaned = stripFences(fullText);
    try {
      const result = JSON.parse(cleaned);
      if (Array.isArray(result)) return { deckFramework: result };
      return result;
    } catch {}
    // Try extracting JSON
    const extracted = extractJSON(fullText);
    try {
      const result = JSON.parse(extracted);
      if (Array.isArray(result)) return { deckFramework: result };
      return result;
    } catch {}
    console.warn("[Generation] Strict JSON parse failed, attempting repair...");
    try {
      const repaired = repairJSON(fullText);
      if (Array.isArray(repaired)) return { deckFramework: repaired };
      console.log("[Generation] JSON repair succeeded");
      return repaired;
    } catch (e) {
      console.error("[Generation] JSON repair failed:", e);
      console.error("[Generation] Full raw response:", fullText);
      const err = new Error("AI response could not be parsed. Please retry.");
      (err as any).rawResponse = fullText;
      throw err;
    }
  };

  // ── Streaming call (for main generation showing progress) ──
  const streamFromEdgeFunction = useCallback(async (body: Record<string, any>, signal: AbortSignal): Promise<any> => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) throw new Error("Not authenticated");

    const bodyWithTokens = { ...body, max_tokens: body.max_tokens || 16384 };

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
          for (const line of chunk.split("\n")) {
            const trimmed = line.trim();
            if (trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.text) { fullText += parsed.text; setStreamingText(fullText); }
              } catch {}
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      setIsStreaming(false);
      setStreamingText("");

      console.log(`[Generation] Stream complete, total length: ${fullText.length}`);
      console.log(`[Generation] Stream raw (first 500):`, fullText.substring(0, 500));
      const cleaned = stripFences(fullText);
      try {
        const result = JSON.parse(cleaned);
        if (Array.isArray(result)) return { deckFramework: result };
        return result;
      } catch {}
      const extracted = extractJSON(fullText);
      try {
        const result = JSON.parse(extracted);
        if (Array.isArray(result)) return { deckFramework: result };
        return result;
      } catch {}
      console.warn("[Generation] Strict stream JSON parse failed, attempting repair...");
      try {
        const repaired = repairJSON(fullText);
        if (Array.isArray(repaired)) return { deckFramework: repaired };
        toast.info("Output was slightly truncated but recovered successfully.");
        return repaired;
      } catch (e) {
        console.error("[Generation] Stream JSON repair failed:", e);
        console.error("[Generation] Full raw stream response:", fullText);
        const err = new Error("AI response could not be parsed. Please retry.");
        (err as any).rawResponse = fullText;
        throw err;
      }
    } else {
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const rawContent = data.content || "";
      console.log(`[Generation] Stream non-SSE response length: ${rawContent.length}`);
      const cleaned = stripFences(rawContent);
      try { return JSON.parse(cleaned); }
      catch {
        try { return repairJSON(rawContent); }
        catch (e) {
          console.error("[Generation] Stream non-SSE parse failed. Full response:", rawContent);
          const err = new Error("AI response could not be parsed. Please retry.");
          (err as any).rawResponse = rawContent;
          throw err;
        }
      }
    }
  }, []);

  // ── Core Narrative Generation ──
  const generateCoreNarrative = useCallback(async (
    input: string,
    purpose: IntakePurpose,
    signal: AbortSignal
  ): Promise<{ coreNarrative: CoreNarrativeData; fullOutput: any }> => {
    const sectionHeadings = CORE_NARRATIVE_SECTIONS[purpose];
    
    const promptSuffix = `\n\n---\nGENERATION INSTRUCTIONS:
STYLE RULE: Never use em dashes (\u2014) anywhere in your output. Use commas, periods, colons, or semicolons instead.

Generate a complete narrative analysis. Return a JSON object with:
1. "coreNarrative": An object with "sections" array. Each section must have "heading" and "content" (3-5 sentence paragraph). Use these exact headings: ${sectionHeadings.map(h => `"${h}"`).join(", ")}
2. "supporting": Object with thesis, narrativeStructure, pitchScript, marketLogic, risks, whyNow fields
3. "score": Object with overall (0-100), components (Record<string,number>), strengths (string[]), gaps (string[]), improvements (string[])
4. "title": A short title for this narrative
5. "intent": "create"
6. "mode": "${purpose === 'board_meeting' ? 'board_update' : purpose}"

Do NOT generate deckFramework or slides. Focus only on the narrative foundation.
Return ONLY valid JSON, no markdown fences.`;

    console.log("[Generation] Starting Core Narrative generation...");
    
    const parsed = await streamFromEdgeFunction(
      {
        mode: "generate",
        input: input + promptSuffix,
        outputMode: purpose === "board_meeting" ? "board_update" : purpose,
        model: "claude-sonnet-4-20250514",
        selectedOutputs: ["core_narrative"],
        skipSlides: true,
        max_tokens: 8192,
      },
      signal
    );

    console.log("[Generation] Core Narrative received, parsing...");

    // Extract core narrative from response
    let cn: CoreNarrativeData;
    if (parsed.coreNarrative?.sections?.length) {
      cn = parsed.coreNarrative;
    } else {
      // Synthesize from supporting data
      const s = parsed.supporting || parsed.data || {};
      cn = {
        sections: sectionHeadings.map(heading => {
          const key = heading.toLowerCase().replace(/[^a-z]/g, "");
          // Try to find matching content
          let content = "";
          if (key === "problem") content = s.narrativeStructure?.worldToday || s.narrativeStructure?.breakingPoint || "";
          else if (key === "solution") content = s.narrativeStructure?.newModel || "";
          else if (key === "whynow") content = s.whyNow || "";
          else if (key === "market") content = Array.isArray(s.marketLogic) ? s.marketLogic.join(" ") : (s.marketLogic || "");
          else if (key === "traction") content = s.narrativeStructure?.whyThisWins || "";
          else if (key === "vision") content = s.narrativeStructure?.theFuture || s.thesis?.content || s.thesis || "";
          else if (key === "challenges") content = s.risks || "";
          else if (key === "progressmetrics") content = s.narrativeStructure?.whyThisWins || "";
          else if (key === "strategicupdates") content = s.thesis?.content || s.thesis || "";
          else if (key === "marketposition") content = Array.isArray(s.marketLogic) ? s.marketLogic.join(" ") : "";
          else if (key === "keyasks") content = s.narrativeStructure?.theFuture || "";
          else if (key === "nextquarterpriorities") content = s.whyNow || "";
          else if (key === "currentstate") content = s.narrativeStructure?.worldToday || "";
          else if (key === "strategicinsight") content = s.thesis?.coreInsight || s.thesis?.content || s.thesis || "";
          else if (key === "marketlandscape") content = Array.isArray(s.marketLogic) ? s.marketLogic.join(" ") : "";
          else if (key === "actionplan") content = s.narrativeStructure?.newModel || "";
          
          return { heading, content: content || `[Content for ${heading} will be generated]` };
        })
      };
    }

    return { coreNarrative: cn, fullOutput: parsed };
  }, [streamFromEdgeFunction]);

  // ── Models by output type ──
  const FAST_OUTPUTS: OutputDeliverable[] = ["elevator_pitch", "pitch_email", "board_memo", "strategic_memo", "key_metrics_summary"];
  const HEAVY_OUTPUTS: OutputDeliverable[] = ["investor_qa", "investment_memo", "slide_framework"];
  const HAIKU_MODEL = "claude-haiku-4-5-20251001";
  const SONNET_MODEL = "claude-sonnet-4-20250514";

  // ── Generate a single output type using core narrative as context ──
  const generateSingleOutput = useCallback(async (
    outputType: OutputDeliverable,
    input: string,
    coreNarrativeText: string,
    purpose: IntakePurpose,
    signal: AbortSignal,
    model?: string
  ): Promise<any> => {
    console.log(`[Generation] Starting output: ${outputType} (model: ${model || SONNET_MODEL})`);

    const outputPrompts: Record<string, string> = {
      elevator_pitch: `Generate elevator pitch versions. Return JSON: { "elevatorPitch": { "thirtySecond": "...", "sixtySecond": "..." } }`,
      pitch_email: `Generate 3 pitch email variants (Direct Ask, Warm Intro Request, Follow-Up). Return JSON: { "pitchEmails": [{ "label": "...", "subject": "...", "body": "..." }] }`,
      investor_qa: `Generate 5-7 likely investor questions with suggested answers. Return JSON: { "investorQA": [{ "question": "...", "answer": "..." }] }`,
      investment_memo: `Generate an investment memo with sections: Thesis, Problem, Solution, Market, Traction & Differentiation, Risks, Why Now, The Ask. Return JSON: { "investmentMemo": { "sections": [{ "heading": "...", "content": "..." }] } }`,
      board_memo: `Generate a board memo with sections: Executive Summary, Key Metrics & Progress, Challenges & Risks, Strategic Priorities, Financial Overview, Asks from the Board. Return JSON: { "boardMemo": { "sections": [{ "heading": "...", "content": "..." }] } }`,
      key_metrics_summary: `Generate a key metrics summary organized by category (Growth, Unit Economics, Engagement, Financial). Each metric needs name, value, trend (up/down/flat), and brief context. Return JSON: { "keyMetrics": { "categories": [{ "category": "...", "metrics": [{ "name": "...", "value": "...", "trend": "up|down|flat", "context": "..." }] }] } }`,
      strategic_memo: `Generate a strategic memo with sections: Situation Assessment, Strategic Options, Recommended Path, Resource Requirements, Success Metrics, Timeline. Return JSON: { "strategicMemo": { "sections": [{ "heading": "...", "content": "..." }] } }`,
      slide_framework: `Generate a complete slide framework (deckFramework). Each slide needs: categoryLabel, headline, subheadline, bodyContent (array), closingStatement, speakerNotes, suggestion, layoutRecommendation, metadata. Return JSON: { "deckFramework": [...] }`,
    };

    const prompt = outputPrompts[outputType] || "";
    const noEmDash = `STYLE RULE: Never use em dashes (\u2014) anywhere in your output. Use commas, periods, colons, or semicolons instead.\n`;
    const fullInput = `CORE NARRATIVE CONTEXT:\n${coreNarrativeText}\n\n---\n${noEmDash}${prompt}\nReturn ONLY valid JSON, no markdown fences.`;

    const maxTokens = outputType === "slide_framework" ? 12000 : 4096;

    const parsed = await callEdgeFunction(
      {
        mode: "generate",
        input: fullInput,
        outputMode: purpose === "board_meeting" ? "board_update" : purpose,
        selectedOutputs: [outputType],
        skipSlides: outputType !== "slide_framework",
        max_tokens: maxTokens,
        model: model || SONNET_MODEL,
      },
      signal
    );

    console.log(`[Generation] Output complete: ${outputType}`);
    return parsed;
  }, [callEdgeFunction]);

  // ── Main generate function ──
  const generate = useCallback(async () => {
    if (!rawInput.trim() || isGenerating) return;
    setIsGenerating(true);
    setIsEvaluation(false);
    setOutput(null);
    setCoreNarrative(null);
    setOutputData({});
    setScoringComplete(false);
    startLoadingPhases();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const currentIntake = intakeSelectionsRef.current || intakeSelections;
    const purpose = currentIntake?.purpose || "fundraising";
    const selectedOutputs = currentIntake?.outputs || ["slide_framework"];
    setGenerationOutputs(selectedOutputs);

    console.log("[Generation] currentIntake:", JSON.stringify(currentIntake));
    console.log("[Generation] Selected outputs:", selectedOutputs);

    try {
      // Step 1: Generate Core Narrative (always first)
      const { coreNarrative: cn, fullOutput } = await generateCoreNarrative(rawInput, purpose, abortController.signal);
      
      setCoreNarrative(cn);
      setOutput(fullOutput);
      setDetectedMode(fullOutput.mode);
      // completedOutputs is derived from coreNarrative — no manual set needed
      console.log("[Generation] Core Narrative complete");

      // Save project immediately so we have a currentProjectId for incremental saves
      const title = (fullOutput as any).title || "Untitled";
      const thesis = extractThesis(fullOutput);
      const initialPayload = {
        core_narrative: cn,
        intake_selections: intakeSelectionsRef.current,
        tab_order: selectedOutputs,
        score: (fullOutput as any).score || null,
        mode: fullOutput.mode,
        title,
        intent: (fullOutput as any).intent || "create",
      };
      
      let activeProjectId = currentProjectId;
      if (currentProjectId) {
        await supabase.from("projects").update({
          title, mode: fullOutput.mode, raw_input: rawInput,
          output_data: initialPayload as any, detected_intent: fullOutput.mode, current_thesis: thesis,
        }).eq("id", currentProjectId);
        console.log("[Persistence] Updated project with core narrative, id:", currentProjectId);
      } else {
        const { data: insertedProject } = await supabase.from("projects").insert({
          user_id: session!.user.id, title, mode: fullOutput.mode, raw_input: rawInput,
          output_data: initialPayload as any, detected_intent: fullOutput.mode, current_thesis: thesis,
        }).select("id").single();
        if (insertedProject) {
          activeProjectId = insertedProject.id;
          setCurrentProjectId(insertedProject.id);
          console.log("[Persistence] Created project with core narrative, id:", insertedProject.id);
        }
      }
      console.log("[Persistence] Saved to output_data:", JSON.stringify(initialPayload).substring(0, 500));

      // Build core narrative text for downstream outputs
      const coreNarrativeText = cn.sections.map(s => `${s.heading}: ${s.content}`).join("\n\n");

      // Step 2: Fire all selected outputs in parallel (fast ones use Haiku, heavy ones use Sonnet)
      const outputPromises = selectedOutputs.map(async (outputType) => {
        const model = FAST_OUTPUTS.includes(outputType) ? HAIKU_MODEL : SONNET_MODEL;
        try {
          const result = await generateSingleOutput(outputType, rawInput, coreNarrativeText, purpose, abortController.signal, model);
          
          // Store the result
          setOutputData(prev => ({ ...prev, [outputType]: result }));
          // completedOutputs is derived from outputData — no manual set needed

          // Save this output to DB immediately, passing the known project ID
          saveOutputIncremental(outputType, result, activeProjectId);

          // Merge into main output for backward compatibility
          if (outputType === "slide_framework") {
            const deckFramework = result.deckFramework || result.deliverable?.deckFramework;
            if (deckFramework?.length) {
              setOutput(prev => {
                if (!prev) return prev;
                const updated = { ...prev } as any;
                if (!updated.deliverable) updated.deliverable = { type: "deck" };
                updated.deliverable = { ...updated.deliverable, type: "deck", deckFramework };
                // no more supporting column
                return updated;
              });
            }
          }

          console.log(`[Generation] ✓ Complete: ${outputType}`);
        } catch (e: any) {
          if (e.name === "AbortError") return;
          console.error(`[Generation] ✗ FAILED: ${outputType}:`, e.message);
          setOutputData(prev => ({ ...prev, [`${outputType}_error`]: e.message, [`${outputType}_rawResponse`]: e.rawResponse || null }));
        }
      });

      await Promise.allSettled(outputPromises);

      // Save metadata only (suggestions, tab order, score) — output content already saved incrementally
      if (activeProjectId) {
        saveQueueRef.current = saveQueueRef.current.then(async () => {
          const { data: project } = await supabase.from("projects").select("output_data").eq("id", activeProjectId).single();
          const existing = (project?.output_data as any) || {};
          const completedTypes = selectedOutputs.filter(t => !(outputDataRef.current as any)?.[`${t}_error`]);
          const metadataUpdate = {
            ...existing,
            intake_selections: intakeSelectionsRef.current,
            applied_suggestions: Array.from(appliedSuggestions),
            dismissed_suggestions: Array.from(dismissedSuggestions),
            tab_order: completedTypes,
            score: (fullOutput as any)?.score || existing.score || null,
          };
          await supabase.from("projects").update({ output_data: metadataUpdate as any }).eq("id", activeProjectId);
          console.log("[Persistence] Final metadata save complete. Keys:", Object.keys(metadataUpdate));
        });
      }

      // Step 3: Mark scoring complete (score comes from core narrative generation)
      setScoringComplete(true);

      // Increment generation count (project already saved via incremental saves + initial create above)
      const newCount = generationCount + 1;
      setGenerationCount(newCount);
      localStorage.setItem("rhetoric_gen_count", String(newCount));

    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("[Generation] Error:", e);
      toast.error(e.message || "Generation failed. Please try again.");
    }

    abortControllerRef.current = null;
    stopLoadingPhases();
    setIsGenerating(false);
  }, [rawInput, selectedMode, voiceProfile, generationCount, isGenerating, saveProject, saveOutputIncremental, startLoadingPhases, stopLoadingPhases, intakeSelections, generateCoreNarrative, generateSingleOutput]);

  // ── Generate a single output on demand (post-generation) ──
  const generateOutput = useCallback(async (outputType: OutputDeliverable) => {
    if (!rawInput.trim() || !coreNarrative) return;
    // Prevent duplicate in-flight calls for the same output
    if (inFlightOutputsRef.current.has(outputType)) {
      console.warn(`[Generation] Skipping duplicate call for: ${outputType}`);
      return;
    }
    inFlightOutputsRef.current.add(outputType);
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const purpose = intakeSelections?.purpose || "fundraising";
    const coreNarrativeText = coreNarrative.sections.map(s => `${s.heading}: ${s.content}`).join("\n\n");

    try {
      if (outputType === "slide_framework") {
        setIsGeneratingSlides(true);
      }

      const model = FAST_OUTPUTS.includes(outputType) ? HAIKU_MODEL : SONNET_MODEL;
      const result = await generateSingleOutput(outputType, rawInput, coreNarrativeText, purpose, abortController.signal, model);
      setOutputData(prev => ({ ...prev, [outputType]: result }));
      // completedOutputs is derived from outputData — no manual set needed
      saveOutputIncremental(outputType, result);

      // Merge slides into output
      if (outputType === "slide_framework") {
        const deckFramework = result.deckFramework || result.deliverable?.deckFramework;
        if (deckFramework?.length) {
          setOutput(prev => {
            if (!prev) return prev;
            const updated = { ...prev } as any;
            if (!updated.deliverable) updated.deliverable = { type: "deck" };
            updated.deliverable = { ...updated.deliverable, type: "deck", deckFramework };
            return updated;
          });
          toast.success("Slide framework generated!");
        }
      } else {
        toast.success(`${outputType.replace(/_/g, " ")} generated!`);
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(`[Generation] On-demand ✗ FAILED: ${outputType}:`, e.message);
        setOutputData(prev => ({ ...prev, [`${outputType}_error`]: e.message, [`${outputType}_rawResponse`]: e.rawResponse || null }));
        toast.error(`Failed to generate ${outputType.replace(/_/g, " ")}. Please retry.`);
      }
    } finally {
      inFlightOutputsRef.current.delete(outputType);
      abortControllerRef.current = null;
      if (outputType === "slide_framework") setIsGeneratingSlides(false);
    }
  }, [rawInput, coreNarrative, intakeSelections, generateSingleOutput]);

  // Generate slides on demand
  const generateSlides = useCallback(async () => {
    await generateOutput("slide_framework");
  }, [generateOutput]);

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
          { mode: "evaluate", input: extractedText, model: "claude-sonnet-4-20250514" },
          abortController.signal
        );
        setDetectedMode(parsed.mode);
        setOutput(parsed);
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
        if (retry) { console.warn("Evaluation first attempt failed, retrying...", e); return attempt(false); }
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
      const sourceObj = (output as any).supporting || output.data || {};
      const currentContent = getNestedValue(sourceObj, path);
      const noEmDashRule = "STYLE RULE: Never use em dashes (\u2014) anywhere in your output. Use commas, periods, colons, or semicolons instead.";
      const { data, error } = await supabase.functions.invoke("decksmith-ai", {
        body: { mode: "refine", input: rawInput, section: sectionKey, path, tone, currentContent, model: "claude-sonnet-4-20250514", styleRule: noEmDashRule },
      });
      if (error) throw error;
      const refined = data.content;
      setOutput((prev) => {
        if (!prev) return prev;
        const updated = JSON.parse(JSON.stringify(prev));
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
        body: { mode: "refine", input: rawInput, section: "deckFramework", path: "deckFramework", tone: suggestion, currentContent: JSON.stringify(deckFramework), model: "claude-sonnet-4-20250514" },
      });
      if (error) throw error;
      let refined = data.content;
      if (typeof refined === "string") {
        const cleaned = refined.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
        try { refined = JSON.parse(cleaned); } catch {}
      }
      setOutput((prev) => {
        if (!prev) return prev;
        const updated = JSON.parse(JSON.stringify(prev));
        if (Array.isArray(refined)) {
          if (updated.deliverable) updated.deliverable.deckFramework = refined;
          if (updated.data?.deckFramework) updated.data.deckFramework = refined;
        } else if (refined && typeof refined === "object" && refined.headline) {
          const fw = updated.deliverable?.deckFramework || updated.data?.deckFramework || [];
          fw.push(refined);
          if (updated.deliverable) updated.deliverable.deckFramework = fw;
          if (updated.data?.deckFramework) updated.data.deckFramework = fw;
        }
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
      const deliverable = (output as any).deliverable;
      const deckFramework = deliverable?.deckFramework || (output as any).data?.deckFramework || [];
      const narrativeData = (output as any).supporting || output.data || {};
      const narrativeSnapshot = {
        deckFramework: deckFramework.map((slide: any) => ({ headline: slide.headline || slide, content: slide.body || slide.content || "" })),
        thesis: narrativeData.thesis?.content || narrativeData.thesis || "",
        narrativeStructure: narrativeData.narrativeStructure || {},
        pitchScript: narrativeData.pitchScript || "",
        marketLogic: narrativeData.marketLogic || [],
        risks: narrativeData.risks || "",
        whyNow: narrativeData.whyNow || "",
      };
      const noEmDashRule = "STYLE RULE: Never use em dashes (\u2014) anywhere in your output. Use commas, periods, colons, or semicolons instead.";
      const { data, error } = await supabase.functions.invoke("decksmith-ai", {
        body: { mode: "refine", input: rawInput, section: "score", path: "score", tone: "rescore", currentContent: JSON.stringify(narrativeSnapshot), model: "claude-sonnet-4-20250514", styleRule: noEmDashRule },
      });
      if (error) throw error;
      let scoreContent = data.content;
      if (typeof scoreContent === "string") {
        scoreContent = scoreContent.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
        scoreContent = JSON.parse(scoreContent);
      }
      setOutput((prev) => {
        if (!prev) return prev;
        const updated = JSON.parse(JSON.stringify(prev));
        updated.score = scoreContent;
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
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
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
    setCoreNarrative(null);
    setOutputData({});
    setScoringComplete(false);
  }, []);

  const adaptForAudience = useCallback(async (audience: AudienceType) => {
    if (!output || !rawInput.trim()) return;
    if (audienceVariants[audience]) {
      setActiveAudience(audience);
      setOutput(audienceVariants[audience]);
      return;
    }
    setIsAdapting(true);
    try {
      const audiencePrompts: Record<AudienceType, string> = {
        general: "",
        investors: "Adapt this for external investors. Be risk-aware, returns-focused, and persuasive.",
        board: "Adapt this for a board of directors. Be metrics-heavy, strategic, and concise.",
        internal: "Adapt this for internal employees. Be transparent, motivational, and operational.",
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
      if (currentProjectId) {
        const allVariants = { ...audienceVariants, [audience]: parsed };
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
    setDetectedMode(project.mode as OutputMode);
    setCurrentProjectId(project.id);
    setOutreachTracker(project.outreach_tracker || []);
    setIsEvaluation(project.detected_intent === "evaluate");

    // All persisted data now lives in output_data
    const persisted = (project.output_data as any) || {};
    console.log("[Persistence] Loaded output_data:", JSON.stringify(persisted).substring(0, 500));

    // Restore core narrative
    if (persisted.core_narrative?.sections?.length) {
      console.log("[Persistence] Restoring core narrative from database");
      setCoreNarrative(persisted.core_narrative);
    } else {
      setCoreNarrative(null);
    }

    // Restore individual outputs (everything except meta keys)
    const META_KEYS = new Set(["core_narrative", "intake_selections", "applied_suggestions", "dismissed_suggestions", "tab_order", "score", "mode", "title", "intent"]);
    const restoredOutputData: Record<string, any> = {};
    for (const key of Object.keys(persisted)) {
      if (!META_KEYS.has(key) && !key.endsWith("_error") && !key.endsWith("_rawResponse") && persisted[key]) {
        restoredOutputData[key] = persisted[key];
      }
    }
    
    if (Object.keys(restoredOutputData).length > 0) {
      console.log("[Persistence] Restoring output data from database:", Object.keys(restoredOutputData));
      setOutputData(restoredOutputData);
      
      // Rebuild completedOutputs
      const completed = new Set<string>();
      if (persisted.core_narrative?.sections?.length) completed.add("core_narrative");
      for (const key of Object.keys(restoredOutputData)) {
        completed.add(key);
      }
      completed.add("_scoring");
      setCompletedOutputs(completed);
    } else {
      setOutputData({});
      setCompletedOutputs(new Set());
    }

    // Restore intake selections
    if (persisted.intake_selections) {
      console.log("[Persistence] Restoring intake selections from database");
      setIntakeSelections(persisted.intake_selections);
    }

    // Restore suggestion states
    const applied = persisted.applied_suggestions || [];
    setAppliedSuggestions(new Set(applied.map(String)));
    const dismissed = persisted.dismissed_suggestions || [];
    setDismissedSuggestions(new Set(dismissed));

    // Restore the main output object so ProductView renders OutputView
    const hasPersistedData = persisted.core_narrative || persisted.score || Object.keys(restoredOutputData).length > 0;
    if (hasPersistedData) {
      const restoredOutput: any = {
        mode: persisted.mode || project.mode,
        title: persisted.title || project.title,
        score: persisted.score || null,
        intent: persisted.intent || "create",
      };
      // Reconstruct deliverable from persisted slide_framework
      const slideFw = restoredOutputData.slide_framework?.deckFramework || restoredOutputData.slide_framework?.deliverable?.deckFramework;
      if (slideFw?.length) {
        restoredOutput.deliverable = { type: "deck", deckFramework: slideFw };
      }
      // Attach supporting data for backward compat (refine, rescore etc.)
      const s = persisted.core_narrative?.sections;
      if (s) {
        restoredOutput.supporting = {};
      }
      console.log("[Persistence] Restored output object with keys:", Object.keys(restoredOutput));
      setOutput(restoredOutput);
    } else {
      setOutput(null);
    }

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
    const { data } = await supabase.from("project_versions").select("*").eq("project_id", currentProjectId).eq("version_number", versionNumber).single();
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

  const addOutreachEntry = useCallback(async (entry: OutreachEntry) => { await syncOutreach([...outreachTracker, entry]); }, [outreachTracker, syncOutreach]);
  const updateOutreachEntry = useCallback(async (index: number, entry: OutreachEntry) => { const updated = [...outreachTracker]; updated[index] = entry; await syncOutreach(updated); }, [outreachTracker, syncOutreach]);
  const removeOutreachEntry = useCallback(async (index: number) => { await syncOutreach(outreachTracker.filter((_, i) => i !== index)); }, [outreachTracker, syncOutreach]);

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
        intakeSelections, setIntakeSelections: setIntakeSelectionsWithRef,
        generateSlides, isGeneratingSlides,
        generateOutput,
        completedOutputs, generationOutputs, coreNarrative, outputData,
        appliedSuggestions, markSuggestionApplied: useCallback((key: string) => {
          setAppliedSuggestions(prev => new Set(prev).add(key));
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
