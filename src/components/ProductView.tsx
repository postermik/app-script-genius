import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDecksmith } from "@/context/DecksmithContext";
import { useSubscription } from "@/hooks/useSubscription";
import { OutputView } from "@/components/OutputView";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Loader2, Copy, Trash2, ArrowRight, Lock, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { OutputMode, VoiceProfile } from "@/types/narrative";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { parseDeckFile } from "@/lib/parseDeck";
import { toast } from "sonner";

const MODES: { value: OutputMode | "auto"; label: string }[] = [
  { value: "auto", label: "Auto Detect" }, { value: "fundraising", label: "Fundraising" },
  { value: "board_update", label: "Board Update" }, { value: "strategy", label: "Strategy Memo" },
  { value: "product_vision", label: "Product Vision" }, { value: "investor_update", label: "Investor Update" },
];

const VOICES: { value: VoiceProfile; label: string }[] = [
  { value: "executive", label: "Executive" },
  { value: "investor", label: "Investor" }, { value: "technical", label: "Technical" },
  { value: "visionary", label: "Visionary" },
];

const GENERATION_STEPS = [
  "Analyzing your input...",
  "Detecting narrative intent...",
  "Structuring thesis...",
  "Building narrative arc...",
  "Scoring readiness...",
  "Assembling deck framework...",
  "Finalizing output...",
];

export function ProductView() {
  const navigate = useNavigate();
  const { rawInput, setRawInput, selectedMode, setSelectedMode, output, isGenerating, loadingPhase, generate, reset, projects, loadProjects, openProject, deleteProject, duplicateProject, voiceProfile, setVoiceProfile } = useDecksmith();
  const { subscribed } = useSubscription();
  const [localVoice, setLocalVoice] = useState<VoiceProfile>(voiceProfile || "auto");
  const [draftsUsed, setDraftsUsed] = useState<number | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [genStep, setGenStep] = useState(0);
  
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFreeAndLocked = !subscribed && draftsUsed !== null && draftsUsed >= 1;

  useEffect(() => { loadProjects(); loadDraftsUsed(); }, [loadProjects]);
  useEffect(() => { setVoiceProfile(localVoice); }, [localVoice, setVoiceProfile]);

  useEffect(() => {
    if (!isGenerating) { setGenStep(0); return; }
    const interval = setInterval(() => {
      setGenStep(prev => {
        if (prev >= GENERATION_STEPS.length - 1) return prev; // Stay on final step, never loop
        return prev + 1;
      });
    }, 7000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const loadDraftsUsed = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("user_usage").select("drafts_used").eq("user_id", session.user.id).maybeSingle();
    setDraftsUsed(data?.drafts_used ?? 0);
  };

  const handleGenerate = async () => { await generate(); await loadDraftsUsed(); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (!isFreeAndLocked) handleGenerate(); } };

  const handleFileUpload = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "pptx") {
      toast.error("Please upload a PDF or PPTX file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 20MB.");
      return;
    }
    setUploadingFile(file.name);
    try {
      const extractedText = await parseDeckFile(file);
      if (!extractedText.trim()) {
        toast.error("No text could be extracted from this file.");
        return;
      }
      setUploadingFile(null);
      setRawInput(`Evaluate this deck:\n\n${extractedText}`);
      toast.success(`Extracted text from ${file.name}. Review and hit Generate.`);
    } catch (e: any) {
      console.error("File parsing error:", e);
      toast.error(e.message || "Failed to parse the file.");
    } finally {
      setUploadingFile(null);
    }
  }, [setRawInput]);


  const progressPercent = isGenerating ? Math.min(((genStep + 1) / GENERATION_STEPS.length) * 90, 90) : 0;

  if (output) return <OutputView />;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 pt-20">
        <div className="max-w-[720px] w-full animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight text-center mb-4">What are you working on?</h1>

          <p className="text-base text-secondary-foreground max-w-[540px] mx-auto leading-relaxed text-center mb-12">We'll detect your intent and generate the right output structure.</p>
          <div className="space-y-5">
            <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe your startup, paste your pitch, or tell us what you need to create..." rows={8} disabled={isFreeAndLocked || isGenerating} className="w-full bg-card border border-border rounded-sm px-5 py-4 text-foreground text-[15px] leading-relaxed resize-none focus:outline-none focus:border-electric/40 transition-colors placeholder:text-muted-foreground disabled:opacity-50" />
            {!isFreeAndLocked && !isGenerating && (
              <div className="space-y-3">
                {/* Mode selector */}
                <div className="flex flex-wrap gap-1.5">
                  {MODES.map((m) => (
                    <button key={m.value} onClick={() => setSelectedMode(m.value)}
                      className={`text-xs px-3.5 py-2 rounded-sm border transition-all font-medium ${
                        selectedMode === m.value
                          ? "border-electric/40 text-foreground bg-electric/10 shadow-sm shadow-electric/5"
                          : "border-border bg-card/60 text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30 hover:bg-card"
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
                {/* Voice selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Voice:</span>
                  <select value={localVoice} onChange={(e) => setLocalVoice(e.target.value as VoiceProfile)}
                    className="text-xs px-3 py-1.5 rounded-sm border border-border bg-card text-secondary-foreground hover:text-foreground transition-colors focus:outline-none focus:border-electric/40">
                    {VOICES.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
                  </select>
                </div>
              </div>
            )}
            {isFreeAndLocked ? (
              <div className="border border-electric/20 rounded-sm p-6 card-gradient text-center">
                <Lock className="h-5 w-5 text-electric mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-2">You've used your free draft.</p>
                <p className="text-sm text-muted-foreground mb-4">Upgrade to keep generating narratives, refining sections, and exporting decks.</p>
                <button onClick={() => setUpgradeOpen(true)} className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity glow-blue">Upgrade Now</button>
              </div>
            ) : isGenerating ? (
              <div className="border border-border rounded-sm p-6 card-gradient animate-fade-in space-y-5">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-electric animate-spin shrink-0" />
                  <div className="flex-1">
                    <p className={`text-sm font-medium text-foreground transition-all ${genStep >= GENERATION_STEPS.length - 1 ? "animate-pulse" : ""}`}>{GENERATION_STEPS[genStep]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {genStep >= GENERATION_STEPS.length - 1 ? "Almost there..." : `Step ${genStep + 1} of ${GENERATION_STEPS.length}`}
                    </p>
                  </div>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-muted" />
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="border border-border rounded-sm p-4 space-y-2.5 card-gradient" style={{ animationDelay: `${i * 150}ms` }}>
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-2 w-5/6" />
                      <Skeleton className="h-2 w-2/3" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <button onClick={handleGenerate} disabled={!rawInput.trim()} className="flex-1 py-3.5 bg-primary text-primary-foreground font-medium text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2 glow-blue">
                    Generate
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <button onClick={() => fileInputRef.current?.click()} disabled={!!uploadingFile} className="py-3.5 px-4 border border-border bg-card text-secondary-foreground font-medium text-sm rounded-sm hover:text-foreground hover:border-muted-foreground/30 transition-all disabled:opacity-50 flex items-center gap-2">
                    {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingFile ? "Extracting…" : "Upload"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center mb-4">Press Cmd+Enter to generate · Upload a PDF or PPTX to evaluate</p>
              </>
            )}
          </div>

        </div>
        {!isGenerating && projects.length > 0 && (
          <div className="max-w-[720px] w-full mt-16 mb-12 animate-fade-in">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-6">Recent Projects</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div key={project.id} className="card-gradient border border-border rounded-sm p-5 group cursor-pointer hover:border-muted-foreground/20 hover:-translate-y-0.5 transition-all" onClick={() => openProject(project)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                        {project.title}
                        {project.detected_intent === "evaluate" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-electric/10 text-electric border border-electric/20 shrink-0">Evaluation</span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{project.mode.replace("_", " ")} · {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); duplicateProject(project.id); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Duplicate"><Copy className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground group-hover:text-electric transition-colors">Open <ArrowRight className="h-3 w-3 ml-1" /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
