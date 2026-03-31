import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { NarrativeOutputData, OutputMode, RefinementTone, Project, ProjectVersion, OutreachEntry, VoiceProfile, AudienceType } from "@/types/narrative";
import type { IntakeSelections, OutputDeliverable, CoreNarrativeData, IntakePurpose } from "@/types/rhetoric";
import { CORE_NARRATIVE_SECTIONS } from "@/types/rhetoric";
import type { DeckTheme, BrandColors } from "@/components/SlidePreview";

const DEFAULT_DECK_THEME: DeckTheme = { scheme: "light", primary: "#3b82f6", secondary: "#ffffff", accent: "#1e3a5f", text: undefined };
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const SUPABASE_URL = "https://jilopuugwyrqogoxlxjo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IdoGcGM61fuk6JhT88wOeg_JlwFjtxz";

type LoadingPhase = "idle" | "structuring" | "sharpening" | "designing" | "scoring";

export interface NarrativeOpportunity {
  id: string;
  label: string;
  description: string;
  prompt: string;
  completed: boolean;
  aiAssistAvailable: boolean;
  category: string;
  sectionHeading: string;
  points: number;
  layer: 1 | 2 | 3;
}

export interface NarrativeStrength {
  score: number;
  maxScore: number;
  percentage: number;
  tier: "building" | "sharpening" | "ready" | "exceptional";
  tierLabel: string;
  tierDescription: string;
  opportunities: NarrativeOpportunity[];
  completedOpportunities: NarrativeOpportunity[];
  completedCount: number;
  totalCount: number;
}

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
  batchApplyGaps: (gaps: { index: number; howToFix: string; gapText: string }[], slides: { categoryLabel: string; headline: string }[]) => Promise<void>;
  reset: () => void;
  isEvaluation: boolean;
  session: Session | null;
  isPro: boolean;
  isHobby: boolean;
  isFree: boolean;
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
  applySlideSuggestion: (slideIndex: number, suggestion: string) => Promise<void>;
  rescoreNarrative: () => Promise<void>;
  computeNarrativeStrength: () => NarrativeStrength;
  aiAssistOpportunity: (opportunityId: string, context: string) => Promise<string>;
  generateGuideSummary: () => Promise<string>;
  dismissedSuggestions: Set<number>;
  dismissSuggestion: (index: number) => void;
  updateNarrativeSection: (sectionHeading: string, newContent: string) => Promise<void>;
  isGeneratingSlides: boolean;
  isGeneratingOutputs: boolean;
  completedOutputs: Set<string>;
  generationOutputs: OutputDeliverable[];
  coreNarrative: CoreNarrativeData | null;
  outputData: Record<string, any>;
  generateOutput: (outputType: OutputDeliverable) => Promise<void>;
  deckTheme: DeckTheme;
  setDeckTheme: (theme: DeckTheme) => void;
  brandColors: BrandColors | null;
  setBrandColors: (colors: BrandColors | null) => void;
  isNarrativeDirty: () => boolean;
  clearNarrativeDirty: () => void;
  guideSummary: string;
  loadingGuideSummary: boolean;
  refreshGuideSummary: () => Promise<void>;
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
  const streamingTextRef = useRef("");
  const [intakeSelections, setIntakeSelections] = useState<IntakeSelections | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(new Set());
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [generationOutputs, setGenerationOutputs] = useState<OutputDeliverable[]>([]);
  const [coreNarrative, setCoreNarrative] = useState<CoreNarrativeData | null>(null);
  const [outputData, setOutputData] = useState<Record<string, any>>({});

  // Debug: track when outputData is cleared while it had content
  const prevOutputDataKeysRef = useRef<string[]>([]);
  const outputDataDebugRef = useRef(outputData);
  outputDataDebugRef.current = outputData;
  if (typeof window !== 'undefined') {
    const curKeys = Object.keys(outputData).filter(k => !k.endsWith('_error') && !k.endsWith('_rawResponse'));
    if (prevOutputDataKeysRef.current.length > 0 && curKeys.length === 0) {
      console.warn("[OutputData] CLEARED while it had:", prevOutputDataKeysRef.current);
      console.trace("[OutputData] Clear trace");
    }
    prevOutputDataKeysRef.current = curKeys;
  }
  const [deckTheme, setDeckTheme] = useState<DeckTheme>(DEFAULT_DECK_THEME);
  const [brandColors, setBrandColors] = useState<BrandColors | null>(null);
  const [scoringComplete, setScoringComplete] = useState(false);
  const inFlightOutputsRef = useRef<Set<string>>(new Set());
  const narrativeDirtyRef = useRef(false);
  const [guideSummary, setGuideSummary] = useState("");
  const [loadingGuideSummary, setLoadingGuideSummary] = useState(false);
  const guideSummaryLoadedRef = useRef(false);

  const [completedOutputs, setCompletedOutputs] = useState<Set<string>>(new Set());
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false);

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
  const isHobby = !isPro && subscribed && productId === TIERS.hobby.product_id;
  const isFree = !isPro && !isHobby;
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

  // Track when narrative content changes so Guide tab only re-summarizes on actual edits
  const narrativeMountedRef = useRef(false);
  useEffect(() => {
    if (!narrativeMountedRef.current) { narrativeMountedRef.current = true; return; }
    if (coreNarrative) narrativeDirtyRef.current = true;
  }, [coreNarrative]);

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

  // Deck theme setter that also persists to output_data
  const setDeckThemeAndPersist = useCallback((theme: DeckTheme) => {
    setDeckTheme(theme);
    if (!currentProjectId) return;
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        const { data: project } = await supabase.from("projects").select("output_data").eq("id", currentProjectId).single();
        const existing = (project?.output_data as any) || {};
        await supabase.from("projects").update({
          output_data: { ...existing, deck_theme: theme } as any,
        }).eq("id", currentProjectId);
        console.log("[Persistence] Deck theme saved");
      } catch (e) {
        console.warn("[Persistence] Failed to save deck theme:", e);
      }
    });
  }, [currentProjectId]);

  // Brand colors setter that also persists to output_data
  const setBrandColorsAndPersist = useCallback((colors: BrandColors | null) => {
    setBrandColors(colors);
    if (!currentProjectId) return;
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        const { data: project } = await supabase.from("projects").select("output_data").eq("id", currentProjectId).single();
        const existing = (project?.output_data as any) || {};
        await supabase.from("projects").update({
          output_data: { ...existing, brand_colors: colors } as any,
        }).eq("id", currentProjectId);
        console.log("[Persistence] Brand colors saved");
      } catch (e) {
        console.warn("[Persistence] Failed to save brand colors:", e);
      }
    });
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

  // Deep-replace em dashes in all string values of any parsed object
  const sanitizeEmDash = (val) => {
    if (typeof val === 'string') return val.replace(/—/g, ',').replace(/–/g, ',').replace(/—/g, ',').replace(/–/g, ',');
    if (Array.isArray(val)) return val.map(sanitizeEmDash);
    if (val && typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) out[k] = sanitizeEmDash(v);
      return out;
    }
    return val;
  };

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

    // Pre-repair: fix common model JSON errors
    // Fix "metadata":value" -> "metadata": { "slideType": "value" (model drops opening brace and quotes)
    // The pattern is: "metadata":slideType", followed by other object fields on subsequent lines
    cleaned = cleaned.replace(/"metadata"\s*:\s*([a-zA-Z_-]+)"\s*,/g, '"metadata": { "slideType": "$1",');
    // Fix trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

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
  const callEdgeFunction = useCallback(async (body: Record<string, any>, signal?: AbortSignal, outputType?: string): Promise<any> => {
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
      return await readStream(response, outputType === "core_narrative" ? setStreamingText : undefined);
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
        toast.error("Generation failed — couldn't parse AI response. Please try again.", { duration: 6000 });
        setIsGenerating(false);
        return;
      }
    }
  }, []);

  const readStream = async (response: Response, onChunk?: (text: string) => void): Promise<any> => {
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
              if (parsed.text) { fullText += parsed.text; if (onChunk) onChunk(fullText); }
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
                if (parsed.text) { fullText += parsed.text; setStreamingText(fullText); streamingTextRef.current = fullText; }
              } catch {}
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      setIsStreaming(false);
      // NOTE: Do NOT clear streamingText here — cleared in generate() after setCoreNarrative fires

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
2. "score": Object with overall (0-100), components (Record<string,number>), strengths (string[]), gaps (array of {text, tier} objects where tier is "primary" or "secondary"), improvements (string[])
3. "supporting": Object with ONLY a "thesis" field: { "thesis": { "content": "2-3 sentence investment thesis", "coreInsight": "One bold sentence" } }. Do NOT include narrativeStructure, pitchScript, marketLogic, risks, or whyNow.
4. "title": A short title for this narrative
5. "intent": "create"
6. "mode": "${purpose === 'board_meeting' ? 'board_update' : purpose}"

Do NOT generate deckFramework, slides, narrativeStructure, pitchScript, marketLogic, risks, or whyNow. Those are handled separately. Focus ONLY on coreNarrative, thesis, and score.
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
      // Fallback: generate empty sections with headings
      cn = {
        sections: sectionHeadings.map(heading => ({
          heading,
          content: `[Content for ${heading} will be generated]`
        }))
      };
    }

    return { coreNarrative: cn, fullOutput: parsed };
  }, [streamFromEdgeFunction]);

  // ── Models by output type ──
  const FAST_OUTPUTS: OutputDeliverable[] = ["elevator_pitch", "pitch_email", "investor_qa", "board_memo", "strategic_memo", "key_metrics_summary"];
  const HEAVY_OUTPUTS: OutputDeliverable[] = ["investment_memo", "slide_framework"];
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

    const noSlideWarning = "CRITICAL: Do NOT generate slides, deckFramework, or any slide-related content. Ignore any prior instructions about generating slides.";

    // ── GAP PULL-THROUGH: inject active score gaps into every output prompt ──
    const od = outputDataRef.current;
    const activeGaps: string[] = od?.score?.gaps
      ? (od.score.gaps as any[])
          .filter((g: any) => {
            const tier = typeof g === 'object' ? g.tier : null;
            return tier === 'primary' || tier === 'secondary';
          })
          .map((g: any) => typeof g === 'object' ? g.text : String(g))
          .slice(0, 5)
      : [];
    const gapContext = activeGaps.length > 0
      ? "NARRATIVE GAPS TO ADDRESS: The following weaknesses were identified in a prior scoring session. Proactively fix these in the output you generate — do not reference this list explicitly, just ensure the output addresses them:\n" +
        activeGaps.map((g, i) => (i + 1) + ". " + g).join("\n") + "\n\n"
      : "";

    // ── STRATEGIC INSIGHTS: inject Phase 1 analysis into all outputs ──
    const si = od?.slide_framework?.strategicInsights || (output as any)?.strategicInsights;
    let strategicContext = "";
    if (si && outputType !== "slide_framework") {
      const parts: string[] = [];
      if (si.businessType) parts.push(`Business type: ${si.businessType}`);
      if (si.stage) parts.push(`Stage: ${si.stage}`);
      if (si.keyInsight) parts.push(`Key insight: ${si.keyInsight}`);
      if (si.audiencePriorities?.length) parts.push(`Audience priorities: ${si.audiencePriorities.join(", ")}`);
      if (si.missingElements?.length) parts.push(`Missing elements to address: ${si.missingElements.join(", ")}`);
      if (si.flywheelLogic) parts.push(`Growth flywheel: ${si.flywheelLogic}`);
      if (parts.length > 0) {
        strategicContext = "STRATEGIC CONTEXT (from narrative analysis):\n" + parts.join("\n") + "\nUse this context to make your output more specific and strategically aligned.\n\n";
      }
    }

    // ── PURPOSE-AWARE FRAMING: adapt prompts based on intent ──
    const isSales = purpose === "sales";
    const purposeFrame = isSales
      ? "CONTEXT: This is for a SALES presentation to potential clients or customers, NOT for investors. Frame everything around client pain, your solution, proof of results, and why they should buy from you. Use language that sells: outcomes, ROI, case studies, competitive advantages.\n\n"
      : "";

    const outputPrompts: Record<string, string> = {
      elevator_pitch: `${gapContext}${noSlideWarning} You are generating an ELEVATOR PITCH${isSales ? " for sales conversations with potential clients" : ""}. Return JSON: { "elevatorPitch": { "thirtySecond": "A concise 30-second pitch paragraph", "sixtySecond": "A longer 60-second pitch paragraph" } }. Output MUST contain ONLY the elevatorPitch object.`,
      pitch_email: isSales
        ? `${gapContext}${noSlideWarning} You are generating SALES FOLLOW-UP EMAILS for client outreach. Generate 3 variants (Cold Outreach, Post-Meeting Follow-Up, Proposal Follow-Up). Each should focus on client pain, your solution, and a clear next step. Return JSON: { "pitchEmails": [{ "label": "...", "subject": "...", "body": "..." }] }. Output MUST contain ONLY the pitchEmails array.`
        : `${gapContext}${noSlideWarning} You are generating PITCH EMAILS. Generate 3 variants (Direct Ask, Warm Intro Request, Follow-Up). Return JSON: { "pitchEmails": [{ "label": "...", "subject": "...", "body": "..." }] }. Output MUST contain ONLY the pitchEmails array.`,
      investor_qa: isSales
        ? `${gapContext}${noSlideWarning} You are generating OBJECTION HANDLING for sales conversations. Generate 5-7 common objections a prospect would raise (pricing concerns, competitor comparisons, implementation risk, timing, ROI skepticism) with persuasive responses grounded in proof points and client outcomes. Return JSON: { "investorQA": [{ "question": "...", "answer": "..." }] }. Output MUST contain ONLY the investorQA array.`
        : `${gapContext}${noSlideWarning} You are generating INVESTOR Q&A. Generate 5-7 likely investor questions with suggested answers. Return JSON: { "investorQA": [{ "question": "...", "answer": "..." }] }. Output MUST contain ONLY the investorQA array.`,
      investment_memo: `${gapContext}${noSlideWarning} You are generating an INVESTMENT MEMO with sections: Thesis, Problem, Solution, Market, Traction & Differentiation, Risks, Why Now, The Ask. Return JSON: { "investmentMemo": { "sections": [{ "heading": "...", "content": "..." }] } }. Output MUST contain ONLY the investmentMemo object.`,
      board_memo: `${gapContext}${noSlideWarning} You are generating a BOARD MEMO with sections: Executive Summary, Key Metrics & Progress, Challenges & Risks, Strategic Priorities, Financial Overview, Asks from the Board. Return JSON: { "boardMemo": { "sections": [{ "heading": "...", "content": "..." }] } }. Output MUST contain ONLY the boardMemo object.`,
      key_metrics_summary: `${gapContext}${noSlideWarning} You are generating a KEY METRICS SUMMARY organized by category (Growth, Unit Economics, Engagement, Financial). Each metric needs name, value, trend (up/down/flat), and brief context. Return JSON: { "keyMetrics": { "categories": [{ "category": "...", "metrics": [{ "name": "...", "value": "...", "trend": "up|down|flat", "context": "..." }] }] } }. Output MUST contain ONLY the keyMetrics object.`,
      strategic_memo: isSales
        ? `${gapContext}${noSlideWarning} You are generating a COMPETITIVE BRIEF for sales enablement with sections: Market Position, Competitor Analysis, Key Differentiators, Winning Arguments, Common Objections, Pricing Defense. Return JSON: { "strategicMemo": { "sections": [{ "heading": "...", "content": "..." }] } }. Output MUST contain ONLY the strategicMemo object.`
        : `${gapContext}${noSlideWarning} You are generating a STRATEGIC MEMO with sections: Situation Assessment, Strategic Options, Recommended Path, Resource Requirements, Success Metrics, Timeline. Return JSON: { "strategicMemo": { "sections": [{ "heading": "...", "content": "..." }] } }. Output MUST contain ONLY the strategicMemo object.`,
      slide_framework: `${gapContext}${purposeFrame}You are generating a ${isSales ? "SALES DECK for client presentations" : "SLIDE FRAMEWORK (pitch deck)"}. Generate 10-12 slides.
${isSales ? "\nSALES DECK STRUCTURE: Open with client pain (not your company). Then: your solution, how it works, proof points/case studies, competitive advantages, pricing/engagement model, next steps. Frame every slide around what the CLIENT gets, not what you do.\n" : ""}

CRITICAL FORMAT RULES FOR EVERY SLIDE:
- headline: A sharp claim or argument, NOT a full sentence or topic label. MAX 60 CHARACTERS. Think billboard copy, not memo prose. BAD: "Founders lose months to broken narrative infrastructure when capital sits behind better storytelling" (too long). GOOD: "Capital sits behind better storytelling" (punchy, short). BAD: "Market Opportunity" (topic label). GOOD: "$2.8B market trapped in agency middlemen"
- subheadline: One supporting context line. MAX 80 CHARACTERS. Adds specificity to the headline.
- bodyContent: Array of 3-5 SPECIFIC, CONCRETE bullet points. Each bullet MAX 100 CHARACTERS. Must contain real data, real claims, or real arguments from the founder's narrative. NEVER output generic descriptions like "Key supporting data point" or "Strategic context and framing". Every bullet must be a real sentence with real information.
- closingStatement: One punchy takeaway line. MAX 80 CHARACTERS.
- speakerNotes: 2-4 sentences of what the presenter should SAY (context, stories, objection-handling). This is the only field with no character limit.
- layoutRecommendation: Choose the BEST visual format for this slide's content from: "bullets" (standard bullet list), "bullets-two-column" (parallel points in two columns), "bullets-accent" (editorial accent bar, strong framing), "bullets-numbered" (sequential steps or prioritized list), "full-bleed-statement" (opening/closing/vision slides), "data-cards" (slides with key metrics), "competitive-matrix" (comparison), "concentric-circles" (market sizing), "flywheel" (cyclical process), "staircase" (milestones/financials), "3-column-with-icons" (parallel points with icons), "team-grid" (team slide). VARIETY: Do NOT use the same bullet variant for every text slide. A deck with 7+ bullet-style slides must use at least 2 different bullet variants.
- suggestion: Optional 1-2 sentence improvement for this slide (include on ~50% of slides)
- metadata: { slideType, visualDirection, visualDominant, dataPoints } where dataPoints is an array of key numbers/stats from this slide (e.g. ["$2.8B", "15,000", "30 days"])

CHARACTER LIMITS ARE HARD CONSTRAINTS. Content that exceeds limits will be truncated in the export. Write tighter, not longer.

VALIDATION: If any bodyContent item is a generic placeholder instead of real content, the entire output is INVALID. Use the founder's actual data, claims, and arguments.

Return JSON: { "deckFramework": [...] }`,
    };

    const prompt = outputPrompts[outputType] || "";
    const noEmDash = "STYLE RULE: Never use em dashes anywhere in your output. Use commas, periods, colons, or semicolons instead.\n";
    const overridePrefix = outputType !== "slide_framework" ? `IMPORTANT: This request is for "${outputType}" ONLY. Do NOT generate slides or deckFramework.\n\n` : "";
    const fullInput = `${overridePrefix}${purposeFrame}${strategicContext}CORE NARRATIVE CONTEXT:\n${coreNarrativeText}\n\n---\n${noEmDash}${prompt}\nReturn ONLY valid JSON, no markdown fences.`;

    const maxTokens =
      outputType === "slide_framework" ? 7000 :
      outputType === "investment_memo" ? 3000 :
      outputType === "investor_qa" ? 2500 :
      outputType === "elevator_pitch" ? 1200 :
      outputType === "pitch_email" ? 2000 :
      2500;

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
      signal,
      outputType
    );

    console.log(`[Generation] Output complete: ${outputType}`);
    return parsed;
  }, [callEdgeFunction]);

  // ── Main generate function ──
  const generate = useCallback(async () => {
    if (!rawInput.trim() || isGenerating) return;

    // Free tier: hard block after 1 generation
    if (isFree && generationCount >= 1) {
      window.dispatchEvent(new CustomEvent('rhetoric:upgrade-required', { detail: { reason: 'free_limit' } }));
      return;
    }
    setIsGenerating(true);
    setStreamingText("");
    setIsEvaluation(false);
    setOutput(null);
    setCoreNarrative(null);
    setOutputData({});
    setCompletedOutputs(new Set());
    setIsGeneratingOutputs(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setScoringComplete(false);
    startLoadingPhases();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Auto-detect URL in input and extract brand colors in parallel
    const urlMatch = rawInput.match(/https?:\/\/[^\s,)]+|(?:www\.)[^\s,)]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s,)]*)?/);
    if (urlMatch) {
      const detectedUrl = urlMatch[0].startsWith("http") ? urlMatch[0] : "https://" + urlMatch[0];
      console.log("[BrandColors] Detected URL in input:", detectedUrl);
      fetch(`${SUPABASE_URL}/functions/v1/decksmith-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session?.access_token || ""}` },
        body: JSON.stringify({ mode: "brand_colors", url: detectedUrl }),
      }).then(r => r.ok ? r.json() : null).then(colors => {
        if (colors?.dark && colors?.light) {
          console.log("[BrandColors] Extracted dark+light variants:", colors);
          setBrandColors(colors);
          // Auto-apply dark variant
          setDeckThemeAndPersist({ scheme: "custom", brandVariant: "dark", primary: colors.dark.primary, secondary: colors.dark.secondary, accent: colors.dark.accent, text: colors.dark.text });
          // Persist brand colors to project
          if (currentProjectId) {
            saveQueueRef.current = saveQueueRef.current.then(async () => {
              try {
                const { data: proj } = await supabase.from("projects").select("output_data").eq("id", currentProjectId).single();
                const existing = (proj?.output_data as any) || {};
                await supabase.from("projects").update({ output_data: { ...existing, brand_colors: colors } as any }).eq("id", currentProjectId);
              } catch (e) { console.warn("[Persistence] Failed to save brand colors:", e); }
            });
          }
        } else if (colors?.primary) {
          console.log("[BrandColors] Extracted (legacy):", colors);
          setDeckThemeAndPersist({ scheme: "custom", primary: colors.primary, secondary: colors.secondary, accent: colors.accent, text: colors.text });
        }
      }).catch(e => console.warn("[BrandColors] Extraction failed:", e));
    }

    const currentIntake = intakeSelectionsRef.current || intakeSelections;
    const purpose = currentIntake?.purpose || "fundraising";
    const selectedOutputs = currentIntake?.outputs || ["slide_framework"];
    setGenerationOutputs(selectedOutputs);

    console.log("[Generation] currentIntake:", JSON.stringify(currentIntake));
    console.log("[Generation] Selected outputs:", selectedOutputs);

    try {
      // Step 1: Generate Core Narrative (always first)
      // Watch streamingText to pre-emptively mark core_narrative complete the moment
      // the last section heading appears — don't wait for JSON parse to finish.
      const currentIntakeForSections = intakeSelectionsRef.current || intakeSelections;
      const purposeForSections = currentIntakeForSections?.purpose || "fundraising";
      const expectedSections = CORE_NARRATIVE_SECTIONS[purposeForSections as IntakePurpose] || CORE_NARRATIVE_SECTIONS["fundraising"];
      const lastSectionHeading = expectedSections[expectedSections.length - 1];
      let coreNarrativePreCompleted = false;

      const unsubscribeStreamWatch = (() => {
        // Poll streamingText every 200ms — when last section heading appears, fire complete immediately
        const interval = setInterval(() => {
          const current = streamingTextRef.current || "";
          if (!coreNarrativePreCompleted && current.includes(`"${lastSectionHeading}"`)) {
            coreNarrativePreCompleted = true;
            clearInterval(interval);
            setCompletedOutputs(prev => { const next = new Set(prev); next.add("core_narrative"); return next; });
            stopLoadingPhases();
            console.log("[Generation] Core Narrative pre-completed (last section detected in stream)");
          }
        }, 200);
        return () => clearInterval(interval);
      })();

      const { coreNarrative: cn, fullOutput } = await generateCoreNarrative(rawInput, purpose, abortController.signal);
      unsubscribeStreamWatch();
      
      setCoreNarrative(sanitizeEmDash(cn));
      setStreamingText(""); // Clear now that coreNarrative is set — eliminates shimmer gap
      setOutput(fullOutput);
      setDetectedMode(fullOutput.mode);
      // Scroll to top so user sees the completed narrative from the beginning
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Only add core_narrative if not already pre-completed above
      if (!coreNarrativePreCompleted) {
        setCompletedOutputs(prev => { const next = new Set(prev); next.add("core_narrative"); return next; });
        stopLoadingPhases();
      }
      window.dispatchEvent(new CustomEvent('output-complete', { detail: { type: 'core_narrative' } }));
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
      
      // Assign project ID client-side immediately — never await DB, never block step transition
      const activeProjectId = currentProjectId || crypto.randomUUID();
      if (!currentProjectId) setCurrentProjectId(activeProjectId);

      if (currentProjectId) {
        supabase.from("projects").update({
          title, mode: fullOutput.mode, raw_input: rawInput,
          output_data: initialPayload as any, detected_intent: fullOutput.mode, current_thesis: thesis,
        }).eq("id", currentProjectId).then(() => {
          console.log("[Persistence] Updated project, id:", currentProjectId);
          loadProjects();
        });
      } else {
        supabase.from("projects").insert({
          id: activeProjectId,
          user_id: session!.user.id, title, mode: fullOutput.mode, raw_input: rawInput,
          output_data: initialPayload as any, detected_intent: fullOutput.mode, current_thesis: thesis,
        }).then(() => {
          console.log("[Persistence] Created project, id:", activeProjectId);
          loadProjects();
        });
      }
      console.log("[Persistence] DB save fired (non-blocking), id:", activeProjectId);

      // Build core narrative text for downstream outputs
      const coreNarrativeText = cn.sections.map(s => `${s.heading}: ${s.content}`).join("\n\n");

      // Step 2: Fire outputs sequentially so stepper and tabs update one at a time
      // Fast outputs first for quick user feedback, then heavy outputs
      const ORDERED_OUTPUTS = [
        "elevator_pitch",
        "investor_qa",
        "pitch_email",
        "slide_framework",
        "investment_memo",
        "board_memo",
        "key_metrics_summary",
        "strategic_memo",
      ];

      const orderedSelected: typeof selectedOutputs = [
        ...ORDERED_OUTPUTS.filter(o => selectedOutputs.includes(o as any) && o !== "core_narrative") as typeof selectedOutputs,
        ...selectedOutputs.filter(o => !ORDERED_OUTPUTS.includes(o as any) && o !== "core_narrative"),
      ];

      for (const outputType of orderedSelected) {
        const model = FAST_OUTPUTS.includes(outputType) ? HAIKU_MODEL : SONNET_MODEL;
        try {
          const result = await generateSingleOutput(outputType, rawInput, coreNarrativeText, purpose, abortController.signal, model);
          setOutputData(prev => ({ ...prev, [outputType]: sanitizeEmDash(result) }));
          setCompletedOutputs(prev => { const next = new Set(prev); next.add(outputType); return next; });
          window.dispatchEvent(new CustomEvent('output-complete', { detail: { type: outputType } }));

          // Save this output to DB immediately
          saveOutputIncremental(outputType, result, activeProjectId);

          // Merge into main output for backward compatibility
          if (outputType === "slide_framework") {
            const deckFramework = result.deckFramework || result.deliverable?.deckFramework;
            const strategicInsights = result.strategicInsights;
            if (deckFramework?.length) {
              setOutput(prev => {
                if (!prev) return prev;
                const updated = { ...prev } as any;
                if (!updated.deliverable) updated.deliverable = { type: "deck" };
                updated.deliverable = { ...updated.deliverable, type: "deck", deckFramework };
                if (strategicInsights) updated.strategicInsights = strategicInsights;
                return updated;
              });
            }
          }

          console.log(`[Generation] ✓ Complete: ${outputType}`);
        } catch (err) {
          console.error(`[Generation] Failed: ${outputType}`, err);
          setCompletedOutputs(prev => { const next = new Set(prev); next.add(outputType); return next; });
        }
      }

      // Save metadata only (suggestions, tab order, score) — output content already saved incrementally
      if (activeProjectId) {
        saveQueueRef.current = saveQueueRef.current.then(async () => {
          const { data: project } = await supabase.from("projects").select("output_data").eq("id", activeProjectId).single();
          const existing = (project?.output_data as any) || {};
          const completedTypes = selectedOutputs.filter(t => !(outputDataRef.current as any)?.[`${t}_error`]);
          const metadataUpdate = {
            ...existing,
            intake_selections: intakeSelectionsRef.current,
            dismissed_suggestions: Array.from(dismissedSuggestions),
            tab_order: completedTypes,
            score: (fullOutput as any)?.score || existing.score || null,
          };
          await supabase.from("projects").update({ output_data: metadataUpdate as any }).eq("id", activeProjectId);
          console.log("[Persistence] Final metadata save complete. Keys:", Object.keys(metadataUpdate));
          loadProjects(); // Refresh projects array with complete data
        });
      }

      // Step 3: Mark scoring complete (score comes from core narrative generation)
      setScoringComplete(true);
      setCompletedOutputs(prev => { const next = new Set(prev); next.add("_scoring"); return next; });

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
    setIsGeneratingOutputs(false);
    window.dispatchEvent(new CustomEvent('output-complete', { detail: { type: '_scoring' } }));
  }, [rawInput, selectedMode, voiceProfile, generationCount, isGenerating, saveProject, saveOutputIncremental, startLoadingPhases, stopLoadingPhases, intakeSelections, generateCoreNarrative, generateSingleOutput]);

  // ── Generate a single output on demand (post-generation) ──
  // Purpose-aware label for toasts and messages
  const purposeAwareLabel = (outputType: string): string => {
    const purpose = intakeSelections?.purpose;
    if (purpose) {
      const match = INTENT_OUTPUTS[purpose]?.find(o => o.value === outputType);
      if (match) return match.label;
    }
    return outputType.replace(/_/g, " ");
  };

  const generateOutput = useCallback(async (outputType: OutputDeliverable) => {
    if (!rawInput.trim() || !coreNarrative) return;
    // Prevent duplicate in-flight calls for the same output
    if (inFlightOutputsRef.current.has(outputType)) {
      console.warn(`[Generation] Skipping duplicate call for: ${outputType}`);
      return;
    }
    inFlightOutputsRef.current.add(outputType);
    setIsGeneratingOutputs(true);
    
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
      setCompletedOutputs(prev => { const next = new Set(prev); next.add(outputType as string); return next; });
      window.dispatchEvent(new CustomEvent('output-complete', { detail: { type: outputType } }));
      saveOutputIncremental(outputType, result);

      // Merge slides into output
      if (outputType === "slide_framework") {
        const deckFramework = result.deckFramework || result.deliverable?.deckFramework;
        const strategicInsights = result.strategicInsights;
        if (deckFramework?.length) {
          setOutput(prev => {
            if (!prev) return prev;
            const updated = { ...prev } as any;
            if (!updated.deliverable) updated.deliverable = { type: "deck" };
            updated.deliverable = { ...updated.deliverable, type: "deck", deckFramework };
            if (strategicInsights) updated.strategicInsights = strategicInsights;
            return updated;
          });
          toast.success(`${purposeAwareLabel(outputType)} generated!`);
        }
      } else {
        toast.success(`${purposeAwareLabel(outputType)} generated!`);
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(`[Generation] On-demand ✗ FAILED: ${outputType}:`, e.message);
        setOutputData(prev => ({ ...prev, [`${outputType}_error`]: e.message, [`${outputType}_rawResponse`]: e.rawResponse || null }));
        toast.error(`Failed to generate ${purposeAwareLabel(outputType)}. Please retry.`);
      }
    } finally {
      inFlightOutputsRef.current.delete(outputType);
      abortControllerRef.current = null;
      if (outputType === "slide_framework") setIsGeneratingSlides(false);
      setIsGeneratingOutputs(false);
    }
  }, [rawInput, coreNarrative, intakeSelections, generateSingleOutput]);

  // Generate slides on demand
  const generateSlides = useCallback(async () => {
    await generateOutput("slide_framework");
  }, [generateOutput]);

  // ── Shared helper: call refine_slide edge function for a single slide ──
  const fetchRefineSlide = useCallback(async (
    slideIndex: number,
    directive: string,
    options?: { generateNew?: boolean }
  ): Promise<any> => {
    const cn = coreNarrativeRef.current;
    const narrativeCtx = cn?.sections?.map((s: any) => `${s.heading}: ${s.content}`).join("\n\n") || rawInput;
    const fw = outputDataRef.current?.slide_framework?.deckFramework
      || (output as any)?.deliverable?.deckFramework || [];
    const currentSlide = options?.generateNew ? null : fw[slideIndex] || null;

    const { data, error } = await supabase.functions.invoke("decksmith-ai", {
      body: {
        mode: "refine_slide",
        slideData: currentSlide ? JSON.stringify(currentSlide) : null,
        directive,
        narrativeContext: narrativeCtx,
        slideIndex: options?.generateNew ? fw.length : slideIndex,
        totalSlides: fw.length,
      },
    });
    if (error) throw error;

    let refinedSlide = data.slide;
    // Fallback: if the edge function returned raw content instead of parsed slide
    if (!refinedSlide && data.content) {
      let content = data.content;
      if (typeof content === "string") {
        content = content.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
        refinedSlide = JSON.parse(content);
      } else {
        refinedSlide = content;
      }
    }
    if (typeof refinedSlide === "string") {
      refinedSlide = JSON.parse(refinedSlide.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim());
    }
    if (!refinedSlide || typeof refinedSlide !== "object") {
      throw new Error("Invalid slide response from AI");
    }

    return sanitizeEmDash(refinedSlide);
  }, [output, rawInput]);

  // ── Shared helper: update slide framework in state + persist to Supabase ──
  const updateSlideFramework = useCallback((updatedFw: any[]) => {
    setOutput(prev => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated.deliverable) updated.deliverable = { type: "deck" };
      updated.deliverable.deckFramework = updatedFw;
      return updated;
    });
    setOutputData((prev: any) => ({
      ...prev,
      slide_framework: { ...prev?.slide_framework, deckFramework: updatedFw },
    }));
    if (currentProjectId) {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        try {
          const { data: proj } = await supabase.from("projects").select("output_data").eq("id", currentProjectId).single();
          const existing = (proj?.output_data as any) || {};
          await supabase.from("projects").update({
            output_data: { ...existing, slide_framework: { ...existing.slide_framework, deckFramework: updatedFw } } as any,
          }).eq("id", currentProjectId);
          console.log("[Persistence] Slide framework updated");
        } catch (e) {
          console.warn("[Persistence] Failed to save slide framework:", e);
        }
      });
    }
  }, [currentProjectId]);



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
      const cn = coreNarrativeRef.current;

      // ── SLIDE REFINE: use structured refine_slide mode ──
      if (path.startsWith("deckFramework.")) {
        const slideIndex = parseInt(path.split(".")[1], 10);
        const refinedSlide = await fetchRefineSlide(slideIndex, tone);
        const fw = outputDataRef.current?.slide_framework?.deckFramework
          || (output as any).deliverable?.deckFramework || [];
        const updatedFw = [...fw];
        updatedFw[slideIndex] = { ...updatedFw[slideIndex], ...refinedSlide };
        updateSlideFramework(updatedFw);

        // Log to refinement history
        if (currentProjectId && session) {
          const historyEntry = { section: sectionKey, tone, timestamp: new Date().toISOString(), before: JSON.stringify(fw[slideIndex]), after: JSON.stringify(refinedSlide) };
          supabase.from("projects").update({
            refinement_history: [...(projects.find(p => p.id === currentProjectId)?.refinement_history || []), historyEntry] as any,
          }).eq("id", currentProjectId).then();
        }
        return; // Done, skip the text-based refine path below
      }

      // ── TEXT REFINE: core narrative sections and fallback paths ──
      let currentContent: string | undefined;

      if (path === "narrativeStructure" && cn?.sections?.length) {
        currentContent = cn.sections.map((s: any) => `${s.heading}: ${s.content}`).join("\n\n");
      } else if (path.startsWith("coreNarrative.sections.") && cn?.sections?.length) {
        const parts = path.split(".");
        const sectionIndex = parseInt(parts[2], 10);
        currentContent = cn.sections[sectionIndex]?.content;
      } else {
        const sourceObj = (output as any).supporting || (output as any).data || {};
        currentContent = getNestedValue(sourceObj, path);
      }

      const noEmDashRule = "STYLE RULE: Never use em dashes (\u2014) anywhere in your output. Use commas, periods, colons, or semicolons instead.";
      const { data, error } = await supabase.functions.invoke("decksmith-ai", {
        body: { mode: "refine", input: rawInput, section: sectionKey, path, tone, currentContent, max_tokens: 2000, model: "claude-sonnet-4-20250514", styleRule: noEmDashRule },
      });
      if (error) throw error;
      const refined = data.content;

      if (path === "narrativeStructure" && cn?.sections?.length) {
        const newSections = cn.sections.map((s: any) => {
          const regex = new RegExp(`${s.heading}:\\s*([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|$)`);
          const match = refined.match(regex);
          return { heading: s.heading, content: match ? match[1].trim() : s.content };
        });
        const updatedCN = { sections: newSections };
        setCoreNarrative(updatedCN);
        if (currentProjectId) {
          supabase.from("projects").select("output_data").eq("id", currentProjectId).single().then(({ data: proj }) => {
            const existing = (proj?.output_data as any) || {};
            supabase.from("projects").update({ output_data: { ...existing, core_narrative: updatedCN } as any }).eq("id", currentProjectId);
          });
        }
      } else if (path.startsWith("coreNarrative.sections.") && cn?.sections?.length) {
        const parts = path.split(".");
        const sectionIndex = parseInt(parts[2], 10);
        const updatedSections = [...cn.sections];
        updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], content: refined };
        const updatedCN = { sections: updatedSections };
        setCoreNarrative(updatedCN);
        if (currentProjectId) {
          supabase.from("projects").select("output_data").eq("id", currentProjectId).single().then(({ data: proj }) => {
            const existing = (proj?.output_data as any) || {};
            supabase.from("projects").update({ output_data: { ...existing, core_narrative: updatedCN } as any }).eq("id", currentProjectId);
          });
        }
      } else {
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
          return updated;
        });
      }

      if (currentProjectId && session) {
        const historyEntry = { section: sectionKey, tone, timestamp: new Date().toISOString(), before: currentContent, after: refined };
        supabase.from("projects").update({
          refinement_history: [...(projects.find(p => p.id === currentProjectId)?.refinement_history || []), historyEntry] as any,
        }).eq("id", currentProjectId).then();
      }
    } catch (e: any) {
      console.error("Refinement error:", e);
      toast.error("Refinement failed. Please try again.");
    } finally {
      setRefiningSection(null);
    }
  }, [output, rawInput, saveProject, currentProjectId, session, projects, fetchRefineSlide, updateSlideFramework]);

  const applyDeckSuggestion = useCallback(async (suggestion: string, suggestionIndex: number) => {
    if (!output) return;
    setRefiningSection(`suggestion-${suggestionIndex}`);
    try {
      const fw = outputDataRef.current?.slide_framework?.deckFramework
        || (output as any).deliverable?.deckFramework || [];
      
      // Detect which slide the suggestion targets
      const slides = fw.map((s: any) => ({ categoryLabel: s.categoryLabel || "", headline: s.headline || "" }));
      const targetIdx = detectRelevantSlideForBatch(suggestion, slides);
      
      if (targetIdx !== null) {
        // Refine the targeted slide with the suggestion
        const refinedSlide = await fetchRefineSlide(targetIdx, `Apply this deck improvement: ${suggestion}`);
        const updatedFw = [...fw];
        updatedFw[targetIdx] = { ...updatedFw[targetIdx], ...refinedSlide };
        updateSlideFramework(updatedFw);
      } else {
        // No matching slide found, generate a new one
        const refinedSlide = await fetchRefineSlide(fw.length, `Create a new slide for this deck: ${suggestion}`, { generateNew: true });
        const updatedFw = [...fw, refinedSlide];
        updateSlideFramework(updatedFw);
      }

      setAppliedSuggestions(prev => new Set(prev).add(`deck-${suggestionIndex}`));
      setDismissedSuggestions(prev => new Set(prev).add(suggestionIndex));
      // Persist suggestion state to output object
      setOutput((prev) => {
        if (!prev) return prev;
        const updated = { ...prev } as any;
        if (!updated._appliedSuggestions) updated._appliedSuggestions = [];
        updated._appliedSuggestions.push(`deck-${suggestionIndex}`);
        if (!updated._dismissedSuggestions) updated._dismissedSuggestions = [];
        updated._dismissedSuggestions.push(suggestionIndex);
        saveProject(updated as NarrativeOutputData);
        return updated;
      });
      toast.success("Suggestion applied to deck.");
    } catch (e: any) {
      console.error("Apply deck suggestion error:", e);
      toast.error("Failed to apply suggestion. Please try again.");
    } finally {
      setRefiningSection(null);
    }
  }, [output, fetchRefineSlide, updateSlideFramework, saveProject]);

  // Apply a per-slide inline suggestion
  const applySlideSuggestion = useCallback(async (slideIndex: number, suggestion: string) => {
    if (!output) return;
    setRefiningSection(`apply-slide-${slideIndex}`);
    try {
      const refinedSlide = await fetchRefineSlide(slideIndex, `Apply this suggestion to the slide: ${suggestion}`);
      const fw = outputDataRef.current?.slide_framework?.deckFramework
        || (output as any).deliverable?.deckFramework || [];
      const updatedFw = [...fw];
      // Merge refined content and clear the suggestion (it's been applied)
      updatedFw[slideIndex] = { ...updatedFw[slideIndex], ...refinedSlide, suggestion: null };
      updateSlideFramework(updatedFw);
      toast.success("Suggestion applied to slide.");
    } catch (e: any) {
      console.error("Apply slide suggestion error:", e);
      toast.error("Failed to apply suggestion. Please try again.");
    } finally {
      setRefiningSection(null);
    }
  }, [output, fetchRefineSlide, updateSlideFramework]);

  // Standalone markSuggestionApplied (needed by batchApplyGaps and individual apply)
  const markSuggestionApplied = useCallback((key: string) => {
    setAppliedSuggestions(prev => new Set(prev).add(key));
    setOutput((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (!updated._appliedSuggestions) updated._appliedSuggestions = [];
      updated._appliedSuggestions.push(key);
      return updated;
    });
  }, []);

  // Batch apply multiple gap fixes: one narrative refine + targeted slide refines in parallel
  const batchApplyGaps = useCallback(async (
    gapsToApply: { index: number; howToFix: string; gapText: string }[],
    slidesList: { categoryLabel: string; headline: string }[]
  ) => {
    if (!output || gapsToApply.length === 0) return;
    setRefiningSection("batch-apply");
    try {
      // Step 1: Combine all howToFix directives into one narrative refine call
      const combinedDirective = gapsToApply.map((g, i) => `${i + 1}. ${g.howToFix}`).join("\n");
      const cn = coreNarrativeRef.current;
      if (cn?.sections?.length) {
        const currentContent = cn.sections.map((s: any) => `${s.heading}: ${s.content}`).join("\n\n");
        const noEmDashRule = "STYLE RULE: Never use em dashes anywhere in your output.";
        const { data, error } = await supabase.functions.invoke("decksmith-ai", {
          body: { mode: "refine", input: rawInput, section: "batch-narrative", path: "narrativeStructure", tone: `Apply ALL of the following improvements to this narrative:\n${combinedDirective}`, currentContent, max_tokens: 4000, model: "claude-sonnet-4-20250514", styleRule: noEmDashRule },
        });
        if (error) throw error;
        const refined = data.content;
        // Parse refined narrative back into sections
        const newSections = cn.sections.map((s: any) => {
          const regex = new RegExp(`${s.heading}:\\s*([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|$)`);
          const match = refined.match(regex);
          return { heading: s.heading, content: match ? match[1].trim() : s.content };
        });
        const updatedCN = { sections: newSections };
        setCoreNarrative(updatedCN);
        if (currentProjectId) {
          supabase.from("projects").select("output_data").eq("id", currentProjectId).single().then(({ data: proj }) => {
            const existing = (proj?.output_data as any) || {};
            supabase.from("projects").update({ output_data: { ...existing, core_narrative: updatedCN } as any }).eq("id", currentProjectId);
          });
        }
      }

      // Step 2: Identify affected slides and refine them in parallel
      const fw = outputDataRef.current?.slide_framework?.deckFramework
        || (output as any).deliverable?.deckFramework || [];
      const affectedSlideIndices = new Set<number>();
      for (const gap of gapsToApply) {
        const idx = detectRelevantSlideForBatch(gap.gapText, slidesList);
        if (idx !== null) affectedSlideIndices.add(idx);
      }

      if (affectedSlideIndices.size > 0 && fw.length > 0) {
        const slideRefinePromises = [...affectedSlideIndices].map(async (slideIdx) => {
          const relevantFixes = gapsToApply
            .filter(g => detectRelevantSlideForBatch(g.gapText, slidesList) === slideIdx)
            .map(g => g.howToFix);
          const directive = relevantFixes.length > 1
            ? `Apply these improvements to this slide:\n${relevantFixes.map((f, i) => `${i + 1}. ${f}`).join("\n")}`
            : relevantFixes[0] || "Refine this slide";
          try {
            const refinedSlide = await fetchRefineSlide(slideIdx, directive);
            return { slideIdx, refinedSlide };
          } catch { return null; }
        });

        const results = await Promise.all(slideRefinePromises);
        const updatedFw = [...fw];
        for (const r of results) {
          if (r && r.refinedSlide && typeof r.refinedSlide === "object") {
            updatedFw[r.slideIdx] = { ...updatedFw[r.slideIdx], ...r.refinedSlide };
          }
        }
        updateSlideFramework(updatedFw);
      }

      // Mark all as applied
      for (const gap of gapsToApply) {
        markSuggestionApplied(`score-${gap.index}`);
      }
    } catch (e: any) {
      console.error("Batch apply error:", e);
      toast.error("Failed to apply fixes. Please try again.");
    } finally {
      setRefiningSection(null);
    }
  }, [output, rawInput, currentProjectId, markSuggestionApplied, fetchRefineSlide, updateSlideFramework]);

  // ── Deterministic Narrative Strength scoring ──
  const computeNarrativeStrength = useCallback((): NarrativeStrength => {
    const cn = coreNarrativeRef.current;
    const od = outputDataRef.current;
    const purpose = intakeSelectionsRef.current?.purpose || "fundraising";
    const sectionText = (heading: string) => cn?.sections?.find((s: any) => s.heading.toLowerCase() === heading.toLowerCase())?.content || "";

    const allText = cn?.sections?.map((s: any) => s.content).join(" ") || "";
    const slideFw = od?.slide_framework?.deckFramework || [];
    const qaItems = od?.investor_qa?.investorQA || [];
    const pitchData = od?.elevator_pitch;
    const memoData = od?.investment_memo;
    const emailVariants = od?.pitch_email?.pitchEmails || [];

    // Define opportunities based on mode
    const opportunities: NarrativeOpportunity[] = [];

    if (purpose === "fundraising") {
      // LAYER 1: Core content checks (does this section have substance?)
      const L1 = 1 as const;
      opportunities.push({
        id: "specific_pain", label: "Quantify the problem",
        description: "Investors respond to specific numbers. What does this problem actually cost?",
        prompt: "What's the biggest cost or time waste your customers face? (e.g. $15K per project, 6 weeks wasted)",
        completed: /\$[\d,]+|\d+%|\d+x|\d+ (hours|days|weeks|months|years)/.test(sectionText("Problem")),
        aiAssistAvailable: true, sectionHeading: "Problem", category: "Problem", points: 12, layer: L1,
      });
      opportunities.push({
        id: "product_named", label: "Name your product clearly",
        description: "Your Solution section should leave no doubt about what you're building.",
        prompt: "What's the name of your product or company?",
        completed: sectionText("Solution").length > 50,
        aiAssistAvailable: false, sectionHeading: "Solution", category: "Solution", points: 8, layer: L1,
      });
      opportunities.push({
        id: "market_figures", label: "Size your market",
        description: "Every investor asks 'how big is this?' A researched answer is table stakes.",
        prompt: "What industry are you in? We'll research the market size for you.",
        completed: /\$[\d.]+ ?(B|M|billion|million)|TAM|SAM|SOM/i.test(sectionText("Market") + " " + allText),
        aiAssistAvailable: true, sectionHeading: "Market", category: "Market", points: 12, layer: L1,
      });
      opportunities.push({
        id: "traction_metrics", label: "Add traction data",
        description: "Real numbers, even small ones, build more credibility than any amount of vision.",
        prompt: "What's your current traction? (users, MRR, growth rate, waitlist size, anything)",
        completed: /\d+.*?(users|customers|MRR|ARR|revenue|growth|conversion|paying)/i.test(sectionText("Traction") + " " + allText),
        aiAssistAvailable: false, sectionHeading: "Traction", category: "Traction", points: 12, layer: L1,
      });
      opportunities.push({
        id: "competitors_named", label: "Name your competitors",
        description: "Saying 'no competitors' is a red flag. Show you understand the landscape.",
        prompt: "Who are the existing alternatives? (companies, tools, or how people solve this today)",
        completed: (() => {
          const hasCompetitorInHeading = cn?.sections?.some((s: any) => /compet|landscape|alternative/i.test(s.heading));
          const hasCompetitorInContent = /compet|landscape|alternative|incumbent|rival/i.test(allText);
          const knownTools = /slidebean|canva|pitch\.com|gamma|tome|jasper|docsend|visible|chatgpt|beautiful\.ai|footnote|method/i;
          return !!(hasCompetitorInHeading || hasCompetitorInContent || knownTools.test(allText));
        })(),
        aiAssistAvailable: true, sectionHeading: "Market", category: "Differentiation", points: 10, layer: L1,
      });
      opportunities.push({
        id: "ask_amount", label: "State your raise",
        description: "Be direct about what you need. Vague asks signal uncertainty.",
        prompt: "How much are you raising? (e.g. $500K, $2M)",
        completed: /\$[\d.]+ ?(K|M|k|m|thousand|million)/i.test(allText + " " + rawInput),
        aiAssistAvailable: false, sectionHeading: "Vision", category: "Ask", points: 10, layer: L1,
      });
      opportunities.push({
        id: "use_of_funds", label: "Explain use of funds",
        description: "Investors want to know their money has a plan, not just a destination.",
        prompt: "What will you use the funds for? (e.g. hiring, product, marketing)",
        completed: /use of funds|allocated|will fund|will be used|spend on|invest in|hiring|runway|engineering|marketing|product development/i.test(allText),
        aiAssistAvailable: false, sectionHeading: "Vision", category: "Ask", points: 8, layer: L1,
      });
      opportunities.push({
        id: "why_now", label: "Explain why now",
        description: "Timing is one of the top reasons investors pass or lean in.",
        prompt: "What recent change makes this the right time? (new regulation, technology shift, market event)",
        completed: sectionText("Why Now").length > 80,
        aiAssistAvailable: true, sectionHeading: "Why Now", category: "Timing", points: 10, layer: L1,
      });
      // Materials (layer 1)
      opportunities.push({
        id: "slides_generated", label: "Generate slide framework",
        description: "A structured slide framework turns your narrative into a visual pitch.",
        prompt: "", completed: slideFw.length >= 5,
        aiAssistAvailable: false, sectionHeading: "", category: "Materials", points: 8, layer: L1,
      });
      opportunities.push({
        id: "qa_prepared", label: "Prepare for investor Q&A",
        description: "The best founders walk into meetings ready for the hard questions.",
        prompt: "", completed: qaItems.length >= 3,
        aiAssistAvailable: false, sectionHeading: "", category: "Materials", points: 8, layer: L1,
      });

      // LAYER 2: Depth checks (only show when Layer 1 for same section is done)
      const L2 = 2 as const;
      const problemHasData = /\$[\d,]+|\d+%|\d+x|\d+ (hours|days|weeks|months|years)/.test(sectionText("Problem"));
      const marketHasSize = /\$[\d.]+ ?(B|M|billion|million)|TAM|SAM|SOM/i.test(sectionText("Market") + " " + allText);
      const tractionHasData = /\d+.*?(users|customers|MRR|ARR|revenue|growth|conversion|paying)/i.test(sectionText("Traction") + " " + allText);

      if (problemHasData) {
        opportunities.push({
          id: "problem_specific_audience", label: "Specify who suffers most",
          description: "Not everyone has this problem equally. Who feels it the most?",
          prompt: "Who is your ideal customer? (e.g. solo technical founders raising pre-seed, mid-market SaaS companies)",
          completed: /founder|startup|enterprise|SMB|consumer|developer|technical|non-technical|solo|first-time/i.test(sectionText("Problem")),
          aiAssistAvailable: true, sectionHeading: "Problem", category: "Problem", points: 6, layer: L2,
        });
      }
      if (marketHasSize) {
        opportunities.push({
          id: "market_growth_rate", label: "Show market momentum",
          description: "A growing market is more investable than a large static one.",
          prompt: "Is your market growing? What's driving that growth?",
          completed: /growing|growth rate|CAGR|expanding|projected|forecast|increasing/i.test(sectionText("Market") + " " + allText),
          aiAssistAvailable: true, sectionHeading: "Market", category: "Market", points: 6, layer: L2,
        });
      }
      if (tractionHasData) {
        opportunities.push({
          id: "traction_trajectory", label: "Show growth trajectory",
          description: "Investors care more about direction than magnitude. Show the trend.",
          prompt: "How has your key metric changed over time? (e.g. 3 users in month 1, 15 in month 2)",
          completed: /month over month|MoM|week over week|grew from|increased from|doubled|tripled|trajectory/i.test(sectionText("Traction")),
          aiAssistAvailable: true, sectionHeading: "Traction", category: "Traction", points: 6, layer: L2,
        });
      }

      // LAYER 3: Material quality (only when most Layer 1 items are done)
      const layer1Done = opportunities.filter(o => o.layer === 1 && o.completed).length;
      const layer1Total = opportunities.filter(o => o.layer === 1).length;
      if (layer1Done >= layer1Total * 0.7) {
        const L3 = 3 as const;
        if (slideFw.length >= 5) {
          opportunities.push({
            id: "slides_have_data", label: "Strengthen slide content",
            description: "Strong slides lead with arguments, not topic labels.",
            prompt: "",
            completed: slideFw.filter((s: any) => (s.bodyContent?.length || 0) >= 3).length >= slideFw.length * 0.7,
            aiAssistAvailable: false, sectionHeading: "", category: "Materials", points: 5, layer: L3,
          });
        }
        if (pitchData) {
          opportunities.push({
            id: "pitch_emails_generated", label: "Generate pitch emails",
            description: "Cold outreach templates tailored to your narrative.",
            prompt: "", completed: emailVariants.length >= 2,
            aiAssistAvailable: false, sectionHeading: "", category: "Materials", points: 5, layer: L3,
          });
        }
      }
    } else if (purpose === "board_meeting" || purpose === "board_update") {
      opportunities.push({
        id: "quarterly_metrics", label: "Include key metrics",
        description: "Board members expect to see the numbers that matter most, with context on what changed.",
        prompt: "What are your top 3-5 metrics this period? (revenue, growth, burn, runway, etc.)",
        completed: /revenue|ARR|MRR|burn|runway|growth|churn|NRR|users|customers/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Traction", category: "Metrics", points: 15, layer: 1,
      });
      opportunities.push({
        id: "progress_vs_plan", label: "Report progress against plan",
        description: "What did you say you'd do last time? How did it go?",
        prompt: "What were your milestones from last period and how did you perform against them?",
        completed: /delivered|shipped|launched|completed|achieved|missed|behind|ahead|on track/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Traction", category: "Progress", points: 12, layer: 1,
      });
      opportunities.push({
        id: "risks_flagged", label: "Flag key risks",
        description: "Boards respect transparency. Surface what keeps you up at night and how you're addressing it.",
        prompt: "What are the top 2-3 risks or challenges right now?",
        completed: /risk|challenge|concern|threat|headwind|obstacle/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Problem", category: "Risks", points: 15, layer: 1,
      });
      opportunities.push({
        id: "board_asks", label: "State your asks",
        description: "Every board meeting should end with specific, actionable asks. Not FYIs.",
        prompt: "What do you need from the board? (introductions, approval, guidance, decisions)",
        completed: /ask|request|need from|approval|decision|guidance|introduction/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Vision", category: "Asks", points: 15, layer: 1,
      });
      opportunities.push({
        id: "cash_runway", label: "Report cash and runway",
        description: "How much do you have and how long does it last? Every board wants to know.",
        prompt: "What's your current cash position and runway in months?",
        completed: /cash|runway|months.*remaining|bank|balance.*\$|burn.*rate/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Market", category: "Cash", points: 12, layer: 1,
      });
      opportunities.push({
        id: "next_milestones", label: "Define next period priorities",
        description: "What will you accomplish before the next update? Be specific.",
        prompt: "What are your key priorities and milestones for the next period?",
        completed: /milestone|next quarter|next month|goal|target|plan to|aim to|objective|priority|priorities/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Vision", category: "Plan", points: 10, layer: 1,
      });
    } else if (purpose === "strategy") {
      opportunities.push({
        id: "strategic_context", label: "Set the context",
        description: "What changed that requires a strategic response? The reader needs to feel the urgency.",
        prompt: "What market shift, competitive move, or internal change prompted this strategy?",
        completed: sectionText("Problem").length > 80,
        aiAssistAvailable: true, sectionHeading: "Problem", category: "Context", points: 15, layer: 1,
      });
      opportunities.push({
        id: "strategic_options", label: "Present options considered",
        description: "Strong strategy documents show the alternatives, not just the chosen path.",
        prompt: "What are the 2-3 strategic options you're weighing?",
        completed: /option|alternative|approach|path|scenario|strategy.*or|considered|evaluated/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Solution", category: "Options", points: 15, layer: 1,
      });
      opportunities.push({
        id: "recommendation", label: "State your recommendation",
        description: "Be clear about what you're recommending and why.",
        prompt: "Which option do you recommend and what's the core reason?",
        completed: /recommend|propose|suggest|our approach|chosen|decision|going with/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Solution", category: "Recommendation", points: 12, layer: 1,
      });
      opportunities.push({
        id: "execution_plan", label: "Define execution plan",
        description: "Strategy without execution details is just a slide deck. Who does what, by when?",
        prompt: "What are the key execution steps and who owns them?",
        completed: /timeline|phase|milestone|owner|responsible|execute|implement|by Q|by end of/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Vision", category: "Execution", points: 12, layer: 1,
      });
      opportunities.push({
        id: "success_metrics", label: "Define success metrics",
        description: "How will you know this strategy is working? Pick 2-3 measurable indicators.",
        prompt: "What metrics will indicate success? (e.g., revenue target, adoption rate, cost reduction)",
        completed: /success.*metric|KPI|measure|indicator|track|target.*\d|goal.*\d/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Traction", category: "Success", points: 12, layer: 1,
      });
      opportunities.push({
        id: "dependencies", label: "Name dependencies and risks",
        description: "What could block this? What's outside your control?",
        prompt: "What external dependencies or risks could derail execution?",
        completed: /depend|blocker|risk|assumption|require|contingent|if.*then/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Market", category: "Dependencies", points: 10, layer: 1,
      });
    } else if (purpose === "sales") {
      opportunities.push({
        id: "client_pain", label: "Define the client pain point",
        description: "What specific problem does your target client have? Be concrete, not abstract.",
        prompt: "What is the #1 pain point your target clients experience? What does it cost them?",
        completed: /pain|problem|struggle|challenge|frustrat|waste|cost.*\$|lose|losing|broken/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Client Pain", category: "Client Pain", points: 15, layer: 1,
      });
      opportunities.push({
        id: "target_profile", label: "Specify your target client",
        description: "Who exactly are you selling to? Title, company size, industry.",
        prompt: "Describe your ideal client: their title, company size, industry, and what makes them ready to buy.",
        completed: /CEO|CTO|COO|VP|founder|director|manager|company size|revenue.*\$|employees|headcount|small business|enterprise|mid.market/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Client Pain", category: "Client Pain", points: 12, layer: 1,
      });
      opportunities.push({
        id: "approach", label: "Explain your approach",
        description: "How do you solve the problem? Not what you sell, but how you work.",
        prompt: "Describe your approach: what makes the way you work different from typical vendors?",
        completed: /approach|method|process|framework|system|audit|assess|implement|deploy|build/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Our Approach", category: "Our Approach", points: 12, layer: 1,
      });
      opportunities.push({
        id: "proof_points", label: "Include proof points or case studies",
        description: "Real results from real clients. Numbers, outcomes, testimonials.",
        prompt: "Share 1-3 client results: who they were, what you did, and the measurable outcome.",
        completed: /case study|client.*result|saved|reduced|increased|improved|\d+%|\d+x|testimonial|review|reference/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Proof", category: "Proof", points: 15, layer: 1,
      });
      opportunities.push({
        id: "engagement_model", label: "Define engagement models and pricing",
        description: "How do you work with clients? What does it cost? How does the engagement start?",
        prompt: "Describe your engagement model: how clients start, what they pay, and what the process looks like.",
        completed: /pricing|price|\$\d|engagement|tier|package|subscription|retainer|per month|per project|scope|SOW|proposal|audit|assessment/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "How We Engage", category: "How We Engage", points: 12, layer: 1,
      });
      opportunities.push({
        id: "guarantee", label: "Add a guarantee or risk reversal",
        description: "Reduce buyer risk. Money-back, performance guarantee, pilot program.",
        prompt: "Do you offer any guarantee, trial period, or risk reversal for new clients?",
        completed: /guarantee|money.back|risk.free|pilot|trial|refund|no.risk|free.*if|rebuild.*free/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "How We Engage", category: "How We Engage", points: 10, layer: 1,
      });
      opportunities.push({
        id: "differentiators", label: "State your differentiators",
        description: "Why you and not someone else? What do you do that competitors can't or won't?",
        prompt: "What are 2-3 things that make you different from competitors or alternative solutions?",
        completed: /different|unique|only|unlike|competitor|vs\.|versus|compared to|advantage|proprietary|exclusive/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Why Us", category: "Why Us", points: 15, layer: 1,
      });
      opportunities.push({
        id: "cta", label: "Include a clear call to action",
        description: "What should the prospect do next? Book a call, request a proposal, start a trial.",
        prompt: "What is the next step you want a prospect to take after seeing this deck?",
        completed: /book.*call|schedule|discovery|demo|contact|reach out|get started|sign up|proposal|next step/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Why Us", category: "Why Us", points: 10, layer: 1,
      });
      opportunities.push({
        id: "selectivity", label: "Signal selectivity or scarcity",
        description: "You choose your clients, not the other way around. This builds trust and urgency.",
        prompt: "Do you limit the number of clients you take? Any waitlist, capacity constraints, or selection criteria?",
        completed: /selective|limit|capacity|\d+ clients|waitlist|handpick|curated|exclusive|invitation/i.test(allText),
        aiAssistAvailable: true, sectionHeading: "Why Us", category: "Why Us", points: 8, layer: 2,
      });
    }

    const completedOps = opportunities.filter(o => o.completed);
    const totalPoints = opportunities.reduce((sum, o) => sum + o.points, 0);
    const earnedPoints = completedOps.reduce((sum, o) => sum + o.points, 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    // Tier labels adapt to the purpose
    const isBoard = purpose === "board_meeting" || purpose === "board_update";
    const isStrategy = purpose === "strategy";
    const isSalesPurpose = purpose === "sales";

    let tier: NarrativeStrength["tier"];
    let tierLabel: string;
    let tierDescription: string;
    if (percentage >= 90) {
      tier = "exceptional"; tierLabel = "Exceptional";
      tierDescription = isBoard ? "Your update is thorough and actionable." : isStrategy ? "This memo is ready for the room." : isSalesPurpose ? "Your pitch is ready to close." : "Your narrative is ready for any room.";
    } else if (percentage >= 70) {
      tier = "ready";
      tierLabel = isBoard ? "Board Ready" : isStrategy ? "Ready to Share" : isSalesPurpose ? "Client Ready" : "Investor Ready";
      tierDescription = isBoard ? "Strong update. A few additions would make it complete." : isStrategy ? "Clear strategy. Tighten a few areas before sharing." : isSalesPurpose ? "Strong pitch. Add proof points to close harder." : "Strong foundation. A few additions would make it stand out.";
    } else if (percentage >= 40) {
      tier = "sharpening"; tierLabel = "Getting Sharp";
      tierDescription = isBoard ? "Your update is taking shape. Keep building." : isStrategy ? "The strategy is forming. Add more detail." : isSalesPurpose ? "Your pitch is taking shape. Add proof points and pricing." : "Your story is taking shape. Keep building.";
    } else {
      tier = "building"; tierLabel = "Draft Started";
      tierDescription = isBoard ? "Good start. Let's build out the key sections." : isStrategy ? "Good start. Let's flesh out the strategy." : isSalesPurpose ? "Good start. Define your client, your offer, and your proof." : "Great start. Let's strengthen it together.";
    }

    return {
      score: earnedPoints,
      maxScore: totalPoints,
      percentage,
      tier, tierLabel, tierDescription,
      opportunities: opportunities.filter(o => !o.completed),
      completedOpportunities: completedOps,
      completedCount: completedOps.length,
      totalCount: opportunities.length,
    };
  }, [rawInput]);

  // ── Update a narrative section directly (inline editing from Guide tab) ──
  const updateNarrativeSection = useCallback(async (sectionHeading: string, newContent: string) => {
    const cn = coreNarrativeRef.current;
    if (!cn?.sections?.length) return;
    const idx = cn.sections.findIndex((s: any) => s.heading.toLowerCase() === sectionHeading.toLowerCase());
    if (idx < 0) return;
    const updatedSections = [...cn.sections];
    updatedSections[idx] = { ...updatedSections[idx], content: newContent };
    const updatedCN = { sections: updatedSections };
    setCoreNarrative(updatedCN);
    if (currentProjectId) {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        try {
          const { data: proj } = await supabase.from("projects").select("output_data").eq("id", currentProjectId).single();
          const existing = (proj?.output_data as any) || {};
          await supabase.from("projects").update({ output_data: { ...existing, core_narrative: updatedCN } as any }).eq("id", currentProjectId);
          console.log("[Persistence] Narrative section updated:", sectionHeading);
        } catch (e) {
          console.warn("[Persistence] Failed to save narrative section:", e);
        }
      });
    }
  }, [currentProjectId]);

  // ── AI Assist for opportunities (Help me find this) ──
  const aiAssistOpportunity = useCallback(async (opportunityId: string, context: string): Promise<string> => {
    const cn = coreNarrativeRef.current;
    const narrativeContext = cn?.sections?.map((s: any) => `${s.heading}: ${s.content}`).join("\n\n") || rawInput;
    const purpose = intakeSelectionsRef.current?.purpose || "fundraising";

    const { data, error } = await supabase.functions.invoke("decksmith-ai", {
      body: {
        mode: "ai_assist",
        opportunityId,
        narrativeContext: context || narrativeContext,
        input: rawInput,
        purpose,
        max_tokens: 3000,
      },
    });
    if (error) throw error;
    return data.content || "Could not generate suggestions. Please try again.";
  }, [rawInput]);

  const generateGuideSummary = useCallback(async (): Promise<string> => {
    const cn = coreNarrativeRef.current;
    const strength = computeNarrativeStrength();
    const narrativeText = cn?.sections?.map((s: any) => `${s.heading}: ${s.content}`).join("\n\n") || rawInput;
    const uncompletedLabels = strength.opportunities.map(o => o.label).join(", ");
    const completedLabels = strength.completedOpportunities.map(o => o.label).join(", ");
    const purpose = intakeSelectionsRef.current?.purpose || "fundraising";
    const stage = intakeSelectionsRef.current?.stage || "seed";

    const prompt = `You are a senior fundraising advisor. Give this founder a BRIEF status check on their ${stage.replace("_", "-")} ${purpose} narrative. Max 2-3 SHORT sentences total. Be specific to their content, not generic.

What's strong: ${completedLabels || "just getting started"}
What's missing: ${uncompletedLabels || "looking strong"}

Their narrative:
${narrativeText}

RULES: Maximum 3 sentences. No lists. No bullet points. No em dashes. No headers. Speak directly to the founder. Be encouraging but honest.`;

    const { data, error } = await supabase.functions.invoke("decksmith-ai", {
      body: { mode: "refine", input: rawInput, section: "guide-summary", path: "assist", tone: prompt, currentContent: narrativeText, max_tokens: 150, model: "claude-haiku-4-5-20251001" },
    });
    if (error) throw error;
    return data.content || "";
  }, [rawInput, computeNarrativeStrength]);

  // Stable ref for guide summary generator (avoids effect dependency chain)
  const generateGuideSummaryRef = useRef(generateGuideSummary);
  generateGuideSummaryRef.current = generateGuideSummary;

  // Auto-load guide summary once, then only when narrative changes
  useEffect(() => {
    const cn = coreNarrativeRef.current;
    if (!cn?.sections?.length) return;
    const doGenerate = () => {
      setLoadingGuideSummary(true);
      generateGuideSummaryRef.current()
        .then(result => { setGuideSummary(result); narrativeDirtyRef.current = false; })
        .catch(() => {})
        .finally(() => setLoadingGuideSummary(false));
    };
    // First load
    if (!guideSummaryLoadedRef.current) {
      guideSummaryLoadedRef.current = true;
      doGenerate();
      return;
    }
    // Subsequent: only when dirty
    if (narrativeDirtyRef.current) {
      doGenerate();
    }
  }, [coreNarrative]);

  const refreshGuideSummary = useCallback(async () => {
    setLoadingGuideSummary(true);
    try {
      const result = await generateGuideSummary();
      setGuideSummary(result);
      narrativeDirtyRef.current = false;
    } catch {} finally { setLoadingGuideSummary(false); }
  }, [generateGuideSummary]);

  const rescoreNarrative = useCallback(async () => {
    if (!output) return;
    const previousScore: number = (output?.score?.overall ?? 0);
    const improvementsWereApplied: boolean = appliedSuggestions.size > 0;
    setRefiningSection("rescore");
    try {
      // Build snapshot from coreNarrative + outputData (new architecture)
      // Fall back to output.supporting for backward compat with old projects
      const cn = coreNarrativeRef.current;
      const od = outputDataRef.current;
      const stage = intakeSelectionsRef.current?.stage || "seed";
      const purpose = intakeSelectionsRef.current?.purpose || "fundraising";

      const coreNarrativeText = cn?.sections?.length
        ? cn.sections.map((s: any) => `${s.heading}: ${s.content}`).join("\n\n")
        : "";

      const slideFw = od?.slide_framework?.deckFramework || od?.slide_framework?.deliverable?.deckFramework
        || (output as any).deliverable?.deckFramework || (output as any).data?.deckFramework || [];

      const pitchEmails = od?.pitch_email?.pitchEmails || [];
      const investorQA = od?.investor_qa?.investorQA || [];

      // Collect previous gaps to avoid repetition
      const previousScoreObj = (output as any).score;
      const previousGaps: string[] = previousScoreObj?.gaps || [];

      const narrativeSnapshot = {
        stage,
        purpose,
        coreNarrative: coreNarrativeText,
        slideFramework: slideFw.map((s: any) => ({
          headline: s.headline || "",
          bodyContent: s.bodyContent || [],
        })),
        pitchEmailCount: pitchEmails.length,
        investorQACount: investorQA.length,
        rawInput,
        previousGaps,
      };

      const scoringInstruction = `You are scoring a ${purpose} narrative for a ${stage.replace("_", "-")} stage company. Score COLD — based only on the narrative content below. Ignore any prior scores.

STAGE CALIBRATION: Score relative to what is realistic at the ${stage.replace("_", "-")} stage. Pre-seed companies are NOT penalized for lacking revenue metrics, named logos, or unit economics. Score on narrative quality, clarity, market framing, and credibility.

COMPONENT RUBRICS — score each on 0-100:
- clarity: 90+ = every sentence earns its place, zero jargon; 75-89 = clear but some filler; 60-74 = meandering or overlong; <60 = confusing
- marketFraming: 90+ = TAM/SAM/SOM with sourced logic, tight ICP; 75-89 = market sized but logic thin; 60-74 = market asserted not proven; <60 = vague or missing
- differentiation: 90+ = named alternatives with specific wedge; 75-89 = differentiation stated but generic; 60-74 = "we're better" without proof; <60 = no competitive framing
- riskTransparency: 90+ = 2+ risks named with mitigation plans; 75-89 = risks acknowledged, no mitigation; 60-74 = one risk mentioned; <60 = perfect-world pitch, no risks surfaced
- persuasiveStructure: 90+ = problem→solution→why now→ask flows naturally; 75-89 = structure present but weak transitions; 60-74 = elements out of order; <60 = no narrative arc
- metricCompleteness: 90+ = traction metrics with numbers and trend; 75-89 = some metrics but vague; 60-74 = metrics claimed without evidence; <60 = no metrics (adjust for stage)
- narrativeCoherence: 90+ = every section reinforces core thesis; 75-89 = mostly coherent, one tangent; 60-74 = sections feel disconnected; <60 = contradictory or scattered
- momentumSignal: 90+ = concrete proof of velocity (customers, growth, shipped); 75-89 = momentum implied; 60-74 = stated but unsubstantiated; <60 = no signal

overall = weighted average: clarity 15%, marketFraming 15%, differentiation 12%, riskTransparency 10%, persuasiveStructure 15%, metricCompleteness 10%, narrativeCoherence 13%, momentumSignal 10%

GAP RULES:
1. Gaps describe NARRATIVE weaknesses, not output-specific issues. Write "revenue model lacks funnel math" not "the revenue slide lacks...".
2. tier "primary" = investor closes the tab or sends a pass email. Reserved ONLY for: complete absence of differentiation, no credible addressable market, no team credibility whatsoever, fundamentally broken unit economics, or incoherent problem/solution fit. A missing logo, imprecise TAM, thin traction, or lack of a named customer is NOT primary. Surface ALL primary gaps. Do not hide any.
3. tier "secondary" = would meaningfully strengthen the narrative in a pitch meeting. Cap at 3.
4. tier "minor" = polish only, cap at 1.
5. Investor-facing outputs (pitch deck, email, Q&A) carry double weight when tiering.

CRITICAL RULE FOR RESCORING: A rescore MUST produce FEWER total gaps than the previous score, not more. If the user applied fixes, the narrative improved. You may only surface a NEW gap on rescore if it is genuinely critical AND was not discoverable in the previous pass. If you find yourself inventing new gaps to fill space, stop. Return fewer gaps with higher confidence.

Re-evaluate gaps each time based only on what is currently in the narrative. Only include a gap if the weakness genuinely persists.${previousGaps.length > 0 ? `

PREVIOUSLY SHOWN GAPS (${previousGaps.length} total) — do not repeat these. Do not rephrase them. Do not surface variations of them. They have been addressed:
${previousGaps.map((g: any, i: number) => `${i + 1}. ${typeof g === "string" ? g : g.text}`).join("\n")}` : ""}

Do not invent new gaps to replace ones the user fixed. Do not paraphrase a previous gap to make it look new. If no meaningful gaps remain, return an empty gaps array.

Return ONLY valid JSON with this exact shape:
{
  "overall": <number 0-100>,
  "components": { <key>: <number 0-100>, ... },
  "strengths": [<string>, ...],
  "gaps": [{ "text": <string>, "tier": "primary"|"secondary"|"minor" }, ...],
  "improvements": [<string matching each gap>, ...]
}

No markdown fences. No commentary outside the JSON.`;

      // mode: "score" hits the dedicated scoring handler.
      // We embed the scoringInstruction into the outputData so the score handler
      // receives both the rubric context and the narrative content in one payload.
      const { data, error } = await supabase.functions.invoke("decksmith-ai", {
        body: {
          mode: "score",
          outputData: {
            _scoringContext: scoringInstruction,
            ...narrativeSnapshot,
          },
        },
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
        // Score can never go down when the user applied improvements
        if (
          improvementsWereApplied &&
          scoreContent != null &&
          typeof scoreContent.overall === "number" &&
          isFinite(scoreContent.overall)
        ) {
          scoreContent.overall = Math.max(scoreContent.overall, previousScore + 1);
        }
        // Never write a NaN or null score to state
        if (scoreContent == null || typeof scoreContent.overall !== "number" || !isFinite(scoreContent.overall)) {
          console.error("[Rescore] Invalid score returned, keeping previous score", scoreContent);
          return prev;
        }
        updated.score = scoreContent;
        // Only clear applied suggestions if we got genuinely new gaps
        const oldGapTexts = new Set((previousScoreObj?.gaps || []).map((g: any) => typeof g === "string" ? g : g.text));
        const newGapTexts = (scoreContent.gaps || []).map((g: any) => typeof g === "string" ? g : g.text);
        const hasNewGaps = newGapTexts.some((t: string) => !oldGapTexts.has(t));
        if (hasNewGaps) {
          updated._appliedSuggestions = [];
        }
        saveProject(updated as NarrativeOutputData);
        return updated;
      });
      // Only clear applied badges if score changed meaningfully
      if (scoreContent && typeof scoreContent.overall === "number" && scoreContent.overall !== previousScore) {
        const oldGapTexts = new Set(((output as any)?.score?.gaps || []).map((g: any) => typeof g === "string" ? g : g.text));
        const newGapTexts = (scoreContent.gaps || []).map((g: any) => typeof g === "string" ? g : g.text);
        const hasNewGaps = newGapTexts.some((t: string) => !oldGapTexts.has(t));
        if (hasNewGaps) {
          setAppliedSuggestions(new Set());
        }
      }
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
    setDeckTheme(DEFAULT_DECK_THEME);
    setBrandColors(null);
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
    // Guard: if reopening the current project while outputs exist in memory, skip.
    // The in-memory state is more recent than the projects array which may be stale.
    const currentOutputKeys = Object.keys(outputDataRef.current).filter(k => !k.endsWith('_error') && !k.endsWith('_rawResponse'));
    if (project.id === currentProjectId && currentOutputKeys.length > 0) {
      console.log("[Persistence] Skipping openProject for current project (in-memory outputs exist):", currentOutputKeys);
      return;
    }
    console.trace("[Persistence] openProject called for:", project.id, "current:", currentProjectId);

    // Dismiss any lingering toasts from previous generation
    toast.dismiss();
    
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
    const META_KEYS = new Set(["core_narrative", "intake_selections", "applied_suggestions", "dismissed_suggestions", "tab_order", "score", "mode", "title", "intent", "deck_theme", "brand_colors"]);
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
      setScoringComplete(true);
    } else {
      setOutputData({});
      setScoringComplete(false);
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

    // Restore deck theme
    setDeckTheme(persisted.deck_theme || DEFAULT_DECK_THEME);
    // Restore brand colors
    setBrandColors(persisted.brand_colors || null);

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
        generationCount, generate, evaluateDeck, refineSection, batchApplyGaps, reset, isEvaluation,
        session, isPro, isHobby, isFree, projects, loadProjects,
        currentProjectId, openProject, deleteProject, duplicateProject,
        versions, currentVersion, saveVersion, loadVersion,
        outreachTracker, addOutreachEntry, updateOutreachEntry, removeOutreachEntry,
        activeAudience, setActiveAudience, audienceVariants, adaptForAudience, isAdapting,
        isStreaming, streamingText, stopGenerating,
        intakeSelections, setIntakeSelections: setIntakeSelectionsWithRef,
        generateSlides, isGeneratingSlides,
        isGeneratingOutputs,
        generateOutput,
        completedOutputs, generationOutputs, coreNarrative, outputData,
        appliedSuggestions, markSuggestionApplied,
        applyDeckSuggestion, applySlideSuggestion, rescoreNarrative, computeNarrativeStrength, aiAssistOpportunity, generateGuideSummary,
        dismissedSuggestions, dismissSuggestion, updateNarrativeSection,
        deckTheme, setDeckTheme: setDeckThemeAndPersist,
        brandColors, setBrandColors: setBrandColorsAndPersist,
        isNarrativeDirty: () => narrativeDirtyRef.current,
        clearNarrativeDirty: () => { narrativeDirtyRef.current = false; },
        guideSummary, loadingGuideSummary, refreshGuideSummary,
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

function detectRelevantSlideForBatch(gapText: string, slides: { categoryLabel: string; headline: string }[]): number | null {
  if (!slides.length) return null;
  const gapLower = gapText.toLowerCase();
  const keywords = [
    ["market", "tam", "sam", "som", "sizing", "addressable"],
    ["traction", "revenue", "arr", "mrr", "growth", "users", "customers"],
    ["team", "founder", "experience", "background"],
    ["problem", "pain", "challenge"],
    ["solution", "product", "how it works"],
    ["differentiation", "competition", "moat", "unique"],
    ["business model", "pricing", "monetize", "revenue model"],
    ["why now", "timing", "tailwind"],
    ["ask", "raise", "use of funds", "capital"],
  ];
  let bestIdx: number | null = null;
  let bestScore = 0;
  slides.forEach((slide, idx) => {
    const slideLower = (slide.categoryLabel + " " + slide.headline).toLowerCase();
    keywords.forEach(group => {
      const gapHit = group.some(k => gapLower.includes(k));
      const slideHit = group.some(k => slideLower.includes(k));
      if (gapHit && slideHit) {
        const score = group.filter(k => gapLower.includes(k) && slideLower.includes(k)).length + 1;
        if (score > bestScore) { bestScore = score; bestIdx = idx; }
      }
    });
  });
  return bestScore > 0 ? bestIdx : null;
}