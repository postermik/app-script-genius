import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDecksmith } from "@/context/DecksmithContext";
import { useSubscription } from "@/hooks/useSubscription";
import { OutputView } from "@/components/OutputView";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Loader2, Copy, Trash2, ArrowRight, Lock, Upload, FileText, Check, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { OutputMode, Project } from "@/types/narrative";
import type { IntakeSelections } from "@/types/rhetoric";
import { sortBySpeed } from "@/lib/outputOrder";
import { formatDistanceToNow } from "date-fns";
import { parseDeckFile } from "@/lib/parseDeck";
import { GenerationStepper } from "@/components/GenerationStepper";
import { IntakeCard } from "@/components/intake/IntakeCard";
import { toast } from "sonner";

const MODES: { value: OutputMode | "auto"; label: string }[] = [
  { value: "auto", label: "Auto Detect" },
  { value: "fundraising", label: "Fundraising" },
  { value: "board_update", label: "Board Update" },
  { value: "strategy", label: "Strategy Memo" },
  { value: "product_vision", label: "Product Vision" },
  { value: "investor_update", label: "Investor Update" },
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
    const sortedOutputs = sortBySpeed(selections.outputs);
    setIntakeSelections({ ...selections, outputs: sortedOutputs });
    setShowIntake(false);
    const purposeToMode: Record<string, OutputMode | "auto"> = {
      investor_pitch: "fundraising", board_update: "board_update", strategy_memo: "strategy",
      team_alignment: "auto", general_narrative: "auto",
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
      toast.error("Please upload a PDF, PPTX, or DOCX file."); return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 20MB."); return;
    }
    setUploadingFile(file.name);
    try {
      const extractedText = await parseDeckFile(file);
      if (!extractedText.trim()) { toast.error("No text could be extracted from this file."); return; }
      setUploadingFile(null);
      setRawInput(`Evaluate this document:\n\n${extractedText}`);
      toast.success(`Extracted text from ${file.name}. Review and hit Generate.`);
    } catch (e: any) {
      console.error("File parsing error:", e);
      toast.error(e.message || "Failed to parse the file.");
    } finally { setUploadingFile(null); }
  }, [setRawInput]);

  if (output || isGenerating) return <OutputView />;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 pt-20">
        <div className="max-w-[720px] w-full animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight text-center mb-3">What are you building?</h1>
          <p className="text-sm text-muted-foreground text-center mb-10">Paste your pitch, describe your startup, or upload a deck to evaluate.</p>
          <div className="space-y-5">
            <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Describe your startup, paste your pitch, or upload a file to evaluate..."
              rows={8} disabled={isFreeAndLocked || isGenerating}
              className="w-full bg-card border border-border rounded-lg px-5 py-4 text-foreground text-[15px] leading-relaxed resize-none focus:outline-none focus:border-electric/40 transition-colors placeholder:text-muted-foreground disabled:opacity-50" />
            {!rawInput.trim() && !isGenerating && !showIntake && (
              <div className="flex flex-wrap gap-2 -mt-2">
                {[
                  { label: "Pre-seed raise", template: "We're [COMPANY NAME] ([WEBSITE]). We're building [ONE SENTENCE DESCRIPTION]. We're raising $[AMOUNT] to [KEY MILESTONE]. Our team has [RELEVANT BACKGROUND]." },
                  { label: "Seed round", template: "We're [COMPANY NAME] ([WEBSITE]), a [CATEGORY] platform that [VALUE PROP]. We have [TRACTION METRICS: users, revenue, growth rate]. We're raising $[AMOUNT] at $[VALUATION] to [USE OF FUNDS]." },
                  { label: "Board update", template: "[COMPANY NAME] Q[X] [YEAR] Board Update\n\nKey metrics: Revenue $[X], Growth [X]%, Burn $[X]/mo, Runway [X] months\nHighlights: [2-3 wins this quarter]\nChallenges: [1-2 risks or misses]\nAsks: [What you need from the board]" },
                  { label: "Strategy memo", template: "[COMPANY NAME] Strategic Memo: [TOPIC]\n\nContext: [What changed that requires a strategic decision]\nOptions: [2-3 paths we could take]\nRecommendation: [Which path and why]\nSuccess metrics: [How we'll know it's working]" },
                  { label: "Evaluate my deck", template: "" },
                ].map(chip => (
                  <button key={chip.label} onClick={() => {
                    if (chip.label === "Evaluate my deck") { fileInputRef.current?.click(); }
                    else { setRawInput(chip.template); }
                  }}
                    className="text-xs px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors font-medium">
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
            {showIntake && !isGenerating && (
              <IntakeCard rawInput={rawInput} onGenerate={handleIntakeGenerate} onCancel={() => setShowIntake(false)} />
            )}
            {!showIntake && !isFreeAndLocked && !isGenerating && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={handleShowIntake} disabled={!rawInput.trim()}
                    className="flex-1 py-3.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2 glow-blue">
                    Generate
                  </button>
                  <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.docx" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ""; }} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={!!uploadingFile}
                    className="py-3.5 px-4 border border-border bg-card text-secondary-foreground font-medium text-sm rounded-lg hover:text-foreground hover:border-muted-foreground/30 transition-all disabled:opacity-50 flex items-center gap-2">
                    {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingFile ? "Extracting..." : "Upload"}
                  </button>
                </div>
              </div>
            )}
            {isFreeAndLocked && (
              <div className="border border-electric/20 rounded-lg p-6 card-gradient text-center">
                <Lock className="h-5 w-5 text-electric mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-2">You've used your free project.</p>
                <p className="text-sm text-muted-foreground mb-4">Upgrade to create unlimited projects, export materials, and edit inline.</p>
                <button onClick={() => setUpgradeOpen(true)}
                  className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity glow-blue">Upgrade Now</button>
              </div>
            )}
            {isGenerating && <GenerationStepper />}
          </div>
        </div>
        {!isGenerating && !showIntake && (
          <div className="max-w-[720px] w-full mt-16 mb-12 animate-fade-in">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-6">Recent Projects</p>
            {projects.length === 0 ? (
              <div className="card-gradient border border-border rounded-lg p-10 flex flex-col items-center text-center">
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">No projects yet.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Paste your narrative above to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.slice(0, 6).map((project) => (
                  <RecentProjectTile key={project.id} project={project} onOpen={() => openProject(project)} onDelete={() => deleteProject(project.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings link - bottom left, matches project sidebar placement */}
      <button onClick={() => navigate("/settings")}
        className="fixed bottom-5 left-5 flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-foreground/80 transition-colors z-40">
        <Settings className="h-3.5 w-3.5" /> Settings
      </button>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

const MODE_LABELS: Record<string, string> = {
  fundraising: "Fundraising", board_update: "Board Meeting", board_meeting: "Board Meeting", strategy: "Strategy",
};

const MODE_ACCENTS: Record<string, string> = {
  fundraising: "bg-electric/80",
  board_update: "bg-amber-500",
  board_meeting: "bg-amber-500",
  strategy: "bg-indigo",
  product_vision: "bg-emerald",
  investor_update: "bg-electric/80",
};

function RecentProjectTile({ project, onOpen, onDelete }: { project: Project; onOpen: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const copyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(project.raw_input || "");
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const accentColor = MODE_ACCENTS[project.mode] || "bg-electric/80";
  const preview = (project.raw_input || "").replace(/^Evaluate this document:\s*/i, "").slice(0, 90).trim();

  return (
    <div onClick={onOpen} className="bg-card border border-border rounded-lg p-5 flex flex-col group hover:border-muted-foreground/20 hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden relative">
      {/* Mode accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor} rounded-t-lg`} />

      <div className="flex items-start justify-between mb-1.5 mt-1">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 flex-1 min-w-0">
          {project.title}
          {project.detected_intent === "evaluate" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-electric/10 text-electric border border-electric/20 shrink-0 ml-1.5">Eval</span>
          )}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          <button onClick={copyPrompt} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Copy prompt">
            {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {MODE_LABELS[project.mode] || project.mode} · {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
      </p>

      {/* Preview snippet */}
      {preview && (
        <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed mb-3">{preview}...</p>
      )}

      <div className="mt-auto">
        <span className="flex items-center text-xs text-electric hover:text-foreground transition-colors">
          Open <ArrowRight className="h-3 w-3 ml-1" />
        </span>
      </div>
    </div>
  );
}