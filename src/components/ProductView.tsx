import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDecksmith } from "@/context/DecksmithContext";
import { useSubscription } from "@/hooks/useSubscription";
import { OutputView } from "@/components/OutputView";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Loader2, Copy, Trash2, ArrowRight, Lock, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { OutputMode } from "@/types/narrative";
import type { IntakeSelections } from "@/types/rhetoric";
import { formatDistanceToNow } from "date-fns";
import { parseDeckFile } from "@/lib/parseDeck";
import { GenerationStepper } from "@/components/GenerationStepper";
import { IntakeCard } from "@/components/intake/IntakeCard";
import { toast } from "sonner";

const MODES: { value: OutputMode | "auto"; label: string }[] = [
  { value: "auto", label: "Auto Detect" }, { value: "fundraising", label: "Fundraising" },
  { value: "board_update", label: "Board Update" }, { value: "strategy", label: "Strategy Memo" },
  { value: "product_vision", label: "Product Vision" }, { value: "investor_update", label: "Investor Update" },
];


export function ProductView() {
  const navigate = useNavigate();
  const { rawInput, setRawInput, selectedMode, setSelectedMode, output, isGenerating, generate, reset, projects, loadProjects, openProject, deleteProject, duplicateProject, setIntakeSelections } = useDecksmith();
  const { subscribed } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [showIntake, setShowIntake] = useState(false);

  const [draftsUsed, setDraftsUsed] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFreeAndLocked = !subscribed && draftsUsed !== null && draftsUsed >= 1;

  useEffect(() => { loadProjects(); loadDraftsUsed(); }, [loadProjects]);

  const loadDraftsUsed = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("user_usage").select("drafts_used").eq("user_id", session.user.id).maybeSingle();
    setDraftsUsed(data?.drafts_used ?? 0);
  };

  const handleShowIntake = () => {
    if (!rawInput.trim()) return;
    setShowIntake(true);
  };

  const handleIntakeGenerate = async (selections: IntakeSelections) => {
    setIntakeSelections(selections);
    setShowIntake(false);
    // Map purpose to mode
    const purposeToMode: Record<string, OutputMode | "auto"> = {
      investor_pitch: "fundraising",
      board_update: "board_update",
      strategy_memo: "strategy",
      team_alignment: "auto",
      general_narrative: "auto",
    };
    setSelectedMode(purposeToMode[selections.purpose] || "auto");
    await generate();
    await loadDraftsUsed();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isFreeAndLocked) handleShowIntake();
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "pptx" && ext !== "docx") {
      toast.error("Please upload a PDF, PPTX, or DOCX file.");
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
      setRawInput(`Evaluate this document:\n\n${extractedText}`);
      toast.success(`Extracted text from ${file.name}. Review and hit Generate.`);
    } catch (e: any) {
      console.error("File parsing error:", e);
      toast.error(e.message || "Failed to parse the file.");
    } finally {
      setUploadingFile(null);
    }
  }, [setRawInput]);

  if (output) return <OutputView />;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 pt-20">
        <div className="max-w-[720px] w-full animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight text-center mb-4">What are you working on?</h1>

          <p className="text-base text-secondary-foreground max-w-[540px] mx-auto leading-relaxed text-center mb-12">Paste your narrative and we'll help you build the right outputs.</p>
          <div className="space-y-5">
            <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe your startup, paste your pitch, or upload a file to evaluate..." rows={8} disabled={isFreeAndLocked || isGenerating} className="w-full bg-card border border-border rounded-sm px-5 py-4 text-foreground text-[15px] leading-relaxed resize-none focus:outline-none focus:border-electric/40 transition-colors placeholder:text-muted-foreground disabled:opacity-50" />

            {/* Intake card */}
            {showIntake && !isGenerating && (
              <IntakeCard
                rawInput={rawInput}
                onGenerate={handleIntakeGenerate}
                onCancel={() => setShowIntake(false)}
              />
            )}

            {!showIntake && !isFreeAndLocked && !isGenerating && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={handleShowIntake} disabled={!rawInput.trim()} className="flex-1 py-3.5 bg-primary text-primary-foreground font-medium text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2 glow-blue">
                    Generate
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.docx"
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
              </div>
            )}

            {isFreeAndLocked && (
              <div className="border border-electric/20 rounded-sm p-6 card-gradient text-center">
                <Lock className="h-5 w-5 text-electric mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-2">You've used your free draft.</p>
                <p className="text-sm text-muted-foreground mb-4">Upgrade to keep generating narratives, refining sections, and exporting decks.</p>
                <button onClick={() => setUpgradeOpen(true)} className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity glow-blue">Upgrade Now</button>
              </div>
            )}

            {isGenerating && <GenerationStepper />}
          </div>
        </div>
        {!isGenerating && !showIntake && projects.length > 0 && (
          <div className="max-w-[720px] w-full mt-16 mb-12 animate-fade-in">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-6">Recent Projects</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div key={project.id} className="card-gradient border border-border rounded-sm p-5 group cursor-pointer hover:border-muted-foreground/20 hover:-translate-y-0.5 transition-all" onClick={() => openProject(project)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5 line-clamp-2">
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
