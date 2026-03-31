import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDecksmith } from "@/context/DecksmithContext";
import { useSubscription } from "@/hooks/useSubscription";
import { OutputView } from "@/components/OutputView";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Loader2, Copy, Trash2, ArrowRight, Lock, Upload, FileText, Check, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { OutputMode, Project } from "@/types/narrative";
import type { IntakeSelections, IntakePurpose } from "@/types/rhetoric";
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
  const { rawInput, setRawInput, selectedMode, setSelectedMode, output, isGenerating, generate, reset, projects, loadProjects, openProject, deleteProject, duplicateProject, setIntakeSelections, session } = useDecksmith();
  const { subscribed } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [chipPurpose, setChipPurpose] = useState<IntakePurpose | undefined>(undefined);
  const [draftsUsed, setDraftsUsed] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFreeAndLocked = !subscribed && draftsUsed !== null && draftsUsed >= 1;

  // Personalized greeting
  const firstName = session?.user?.user_metadata?.full_name?.split(" ")[0]
    || session?.user?.email?.split("@")[0]
    || "";
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greeting = firstName ? `${timeGreeting}, ${firstName}.` : `${timeGreeting}.`;

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
      <div className="flex-1 flex flex-col items-center px-6 pt-16">
        <div className="max-w-[720px] w-full animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-[1.1] tracking-tight text-center mb-10">{greeting}</h1>
          <div className="space-y-5">
            <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Describe your startup, paste your pitch, or upload a file to evaluate..."
              rows={8} disabled={isFreeAndLocked || isGenerating}
              className="w-full bg-card border border-border rounded-lg px-5 py-4 text-foreground text-[15px] leading-relaxed resize-none focus:outline-none focus:border-electric/40 transition-colors placeholder:text-muted-foreground disabled:opacity-50" />
            {!isGenerating && !showIntake && !isFreeAndLocked && (
              <div className="flex flex-wrap gap-2 -mt-2">
                {[
                  { label: "Fundraise", purpose: "fundraising" as IntakePurpose, template: "We're [COMPANY NAME] ([WEBSITE]). We're building [ONE SENTENCE DESCRIPTION]. We're raising $[AMOUNT] at [STAGE: pre-seed/seed/series A] to [KEY MILESTONE]. We have [TRACTION: users, revenue, growth]. Our team has [RELEVANT BACKGROUND]." },
                  { label: "Sales pitch", purpose: "sales" as IntakePurpose, template: "We're [COMPANY NAME] ([WEBSITE]). We help [TARGET CLIENTS] solve [CLIENT PAIN POINT] through [YOUR SERVICE/PRODUCT]. Our approach: [HOW YOU'RE DIFFERENT]. Results: [PROOF POINTS: case studies, metrics, client wins]. We're looking to pitch [PROSPECT NAME/TYPE]." },
                  { label: "Board update", purpose: "board_meeting" as IntakePurpose, template: "[COMPANY NAME] Q[X] [YEAR] Board Update\n\nKey metrics: Revenue $[X], Growth [X]%, Burn $[X]/mo, Runway [X] months\nHighlights: [2-3 wins this quarter]\nChallenges: [1-2 risks or misses]\nAsks: [What you need from the board]" },
                  { label: "Strategy memo", purpose: "strategy" as IntakePurpose, template: "[COMPANY NAME] Strategic Memo: [TOPIC]\n\nContext: [What changed that requires a strategic decision]\nOptions: [2-3 paths we could take]\nRecommendation: [Which path and why]\nSuccess metrics: [How we'll know it's working]" },
                  { label: "Evaluate my deck", purpose: undefined, template: "" },
                ].map(chip => (
                  <button key={chip.label} onClick={() => {
                    if (chip.label === "Evaluate my deck") { fileInputRef.current?.click(); }
                    else { setRawInput(chip.template); setChipPurpose(chip.purpose); setShowIntake(true); }
                  }}
                    className="text-xs px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors font-medium">
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
            {showIntake && !isGenerating && (
              <IntakeCard rawInput={rawInput} onGenerate={handleIntakeGenerate} onCancel={() => { setShowIntake(false); setChipPurpose(undefined); }} defaultPurpose={chipPurpose} />
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
          <div className="max-w-[960px] w-full mt-20 mb-12 animate-fade-in">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-5">Recent Projects</p>
            {projects.length === 0 ? (
              <div className="card-gradient border border-border rounded-lg p-12 flex flex-col items-center text-center">
                <FileText className="h-10 w-10 text-muted-foreground/20 mb-4" />
                <p className="text-sm text-foreground/70">No projects yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Paste your narrative above to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  fundraising: "Fundraising", board_update: "Board Meeting", board_meeting: "Board Meeting", strategy: "Strategy", sales: "Sales",
};

const MODE_HEADER_COLORS: Record<string, { bg: string; text: string }> = {
  fundraising: { bg: "bg-blue-50", text: "text-blue-600" },
  board_update: { bg: "bg-amber-50", text: "text-amber-700" },
  board_meeting: { bg: "bg-amber-50", text: "text-amber-700" },
  strategy: { bg: "bg-indigo-50", text: "text-indigo-600" },
  product_vision: { bg: "bg-emerald-50", text: "text-emerald-600" },
  investor_update: { bg: "bg-blue-50", text: "text-blue-600" },
  sales: { bg: "bg-orange-50", text: "text-orange-600" },
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

  const od = (project as any).output_data || {};
  const firstSlideHeadline = (od?.slide_framework?.deckFramework || od?.slide_framework?.deliverable?.deckFramework || [])?.[0]?.headline || "";
  const elevatorPitch = od?.elevator_pitch?.elevatorPitch?.thirtySecond || "";

  // Brand colors for header
  const brandPrimary = od?.brand_colors?.dark?.primary || od?.brand_colors?.primary || null;
  const headerColors = MODE_HEADER_COLORS[project.mode] || MODE_HEADER_COLORS.fundraising;

  // Company initial from title
  const initial = (project.title || "?").replace(/^(Evaluation:\s*|Rhetoric:\s*)/i, "").charAt(0).toUpperCase();

  // Best preview
  const preview = elevatorPitch || firstSlideHeadline || (project.raw_input || "").replace(/^Evaluate this document:\s*/i, "").slice(0, 120).trim();

  return (
    <div onClick={onOpen} className="bg-card border border-border rounded-lg flex flex-col group hover:border-muted-foreground/30 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden">
      {/* Visual header */}
      <div
        className={`relative h-[72px] flex items-center justify-between px-4 ${!brandPrimary ? headerColors.bg : ""}`}
        style={brandPrimary ? { backgroundColor: brandPrimary + "18" } : undefined}
      >
        {/* Monogram */}
        <span
          className={`text-2xl font-bold ${!brandPrimary ? headerColors.text : ""}`}
          style={brandPrimary ? { color: brandPrimary } : undefined}
        >
          {initial}
        </span>
        {/* Mode pill */}
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${!brandPrimary ? headerColors.text + " " + headerColors.bg : ""}`}
          style={brandPrimary ? { color: brandPrimary, backgroundColor: brandPrimary + "15" } : undefined}
        >
          {MODE_LABELS[project.mode] || project.mode}
        </span>
        {/* Hover actions */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={copyPrompt} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors" title="Copy prompt">
            {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-background/60 transition-colors" title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
          {project.title}
          {project.detected_intent === "evaluate" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-electric/10 text-electric border border-electric/20 shrink-0 ml-1.5">Eval</span>
          )}
        </h3>
        <p className="text-[11px] text-muted-foreground mb-2">
          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
        </p>

        {preview && (
          <p className="text-[12px] text-foreground/50 line-clamp-2 leading-relaxed flex-1">{preview}</p>
        )}

        <div className="mt-auto flex items-center justify-end pt-2">
          <span className="flex items-center text-xs font-medium text-electric group-hover:text-foreground transition-colors">
            Open <ArrowRight className="h-3 w-3 ml-1" />
          </span>
        </div>
      </div>
    </div>
  );
}