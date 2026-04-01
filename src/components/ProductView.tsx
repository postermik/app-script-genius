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

const MODE_LABELS: Record<string, string> = {
  fundraising: "Fundraising", board_update: "Board Meeting", board_meeting: "Board Meeting", strategy: "Strategy", sales: "Sales",
};

const MODE_PILL_COLORS: Record<string, string> = {
  fundraising: "text-blue-600 bg-blue-50",
  board_update: "text-amber-700 bg-amber-50",
  board_meeting: "text-amber-700 bg-amber-50",
  strategy: "text-indigo-600 bg-indigo-50",
  product_vision: "text-emerald-600 bg-emerald-50",
  investor_update: "text-blue-600 bg-blue-50",
  sales: "text-orange-600 bg-orange-50",
};

function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const trimmed = text.slice(0, maxLen);
  const lastSpace = trimmed.lastIndexOf(" ");
  let result = lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed;
  result = result.replace(/[,;:\-]+$/, "");
  return result + "...";
}

function getAccentClass(mode: string, brandPrimary: string | null): { className: string; style?: React.CSSProperties } {
  if (brandPrimary) return { className: "absolute top-0 left-0 right-0 h-1 rounded-t-lg", style: { backgroundColor: brandPrimary } };
  const cls = mode === "sales" ? "bg-orange-400" : mode === "strategy" ? "bg-indigo-400" : mode?.includes("board") ? "bg-amber-400" : "bg-electric/70";
  return { className: `absolute top-0 left-0 right-0 h-1 rounded-t-lg ${cls}` };
}

function getProjectPreview(project: Project): string {
  const od = (project as any).output_data || {};
  const pitch = od?.elevator_pitch?.elevatorPitch?.thirtySecond || "";
  const headline = (od?.slide_framework?.deckFramework || od?.slide_framework?.deliverable?.deckFramework || [])?.[0]?.headline || "";
  return pitch || headline || (project.raw_input || "").replace(/^Evaluate this document:\s*/i, "").slice(0, 150).trim();
}

function getBrandPrimary(project: Project): string | null {
  const od = (project as any).output_data || {};
  return od?.brand_colors?.dark?.primary || od?.brand_colors?.primary || null;
}

export function ProductView() {
  const navigate = useNavigate();
  const { rawInput, setRawInput, selectedMode, setSelectedMode, output, isGenerating, generate, reset, projects, loadProjects, openProject, deleteProject, duplicateProject, setIntakeSelections } = useDecksmith();
  const { subscribed } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [chipPurpose, setChipPurpose] = useState<IntakePurpose | undefined>(undefined);
  const [draftsUsed, setDraftsUsed] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFreeAndLocked = !subscribed && draftsUsed !== null && draftsUsed >= 1;

  const hour = new Date().getHours();
  const mornings = ["Good morning.", "Morning. Time to build.", "Fresh day, fresh narrative."];
  const afternoons = ["Good afternoon.", "Afternoon. Ready to build?", "Let's pick up where you left off."];
  const evenings = ["Good evening.", "Evening. Let's sharpen something.", "Winding down or warming up?"];
  const pool = hour < 12 ? mornings : hour < 18 ? afternoons : evenings;
  const greeting = pool[Math.floor(Date.now() / 86400000) % pool.length];

  useEffect(() => { loadProjects(); loadDraftsUsed(); }, [loadProjects]);

  const loadDraftsUsed = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("user_usage").select("drafts_used").eq("user_id", session.user.id).maybeSingle();
    setDraftsUsed(data?.drafts_used ?? 0);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setConfirmDeleteId(id); };
  const confirmDelete = () => { if (confirmDeleteId) deleteProject(confirmDeleteId); setConfirmDeleteId(null); };
  const handleShowIntake = () => { if (!rawInput.trim()) return; setShowIntake(true); };

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
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (!isFreeAndLocked) handleShowIntake(); }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "pptx" && ext !== "docx") { toast.error("Please upload a PDF, PPTX, or DOCX file."); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("File is too large. Maximum size is 20MB."); return; }
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
          <h1 className="text-[32px] sm:text-[36px] font-semibold text-foreground/60 leading-[1.15] tracking-tight text-center mb-10">{greeting}</h1>
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
            )}
            {isFreeAndLocked && (
              <div className="border border-electric/20 rounded-lg p-6 card-gradient text-center">
                <Lock className="h-5 w-5 text-electric mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-2">You've used your free project.</p>
                <p className="text-sm text-muted-foreground mb-4">Upgrade to create unlimited projects, export materials, and edit inline.</p>
                <button onClick={() => setUpgradeOpen(true)} className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity glow-blue">Upgrade Now</button>
              </div>
            )}
            {isGenerating && <GenerationStepper />}
          </div>
        </div>

        {!isGenerating && !showIntake && projects.length > 0 && (
          <div className="max-w-[960px] w-full mt-20 mb-12 animate-fade-in">
            {/* Hero card */}
            {(() => {
              const latest = projects[0];
              const brand = getBrandPrimary(latest);
              const pill = MODE_PILL_COLORS[latest.mode] || "text-blue-600 bg-blue-50";
              const preview = getProjectPreview(latest);
              const accent = getAccentClass(latest.mode, brand);
              return (
                <div onClick={() => openProject(latest)}
                  className="bg-card border border-border rounded-lg p-5 mb-8 flex items-center justify-between group hover:border-muted-foreground/30 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden">
                  <div className={accent.className} style={accent.style} />
                  <div className="flex-1 mt-0.5 max-w-[75%]">
                    <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1.5">Continue where you left off</p>
                    <p className="text-[15px] font-semibold text-foreground mb-1">{latest.title}</p>
                    {preview && <p className="text-[12px] text-foreground/50 leading-relaxed mb-2">{truncateAtWord(preview, 100)}</p>}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pill}`}>{MODE_LABELS[latest.mode] || latest.mode}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(latest.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <span className="flex items-center text-sm font-medium text-electric group-hover:text-foreground transition-colors ml-4 shrink-0">
                    Continue <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </div>
              );
            })()}

            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-4">Recent Projects</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(1, 7).map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={() => openProject(project)} onDelete={(e) => handleDelete(project.id, e)} />
              ))}
              {projects.length < 4 && Array.from({ length: Math.max(0, 4 - projects.length) }).map((_, i) => (
                <div key={`empty-${i}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="border-2 border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center min-h-[190px] cursor-pointer hover:border-muted-foreground/40 transition-colors group">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-border group-hover:border-muted-foreground/40 flex items-center justify-center mb-2.5 transition-colors">
                    <span className="text-muted-foreground/50 text-xl leading-none">+</span>
                  </div>
                  <p className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">New project</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isGenerating && !showIntake && projects.length === 0 && (
          <div className="max-w-[960px] w-full mt-20 mb-12 animate-fade-in">
            <div className="card-gradient border border-border rounded-lg p-12 flex flex-col items-center text-center">
              <FileText className="h-10 w-10 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-foreground/70">No projects yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Paste your narrative above to get started.</p>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => navigate("/settings")}
        className="fixed bottom-5 left-5 flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-foreground/80 transition-colors z-40">
        <Settings className="h-3.5 w-3.5" /> Settings
      </button>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-foreground mb-2">Delete this project?</p>
            <p className="text-xs text-muted-foreground mb-5">This action cannot be undone. All outputs, slides, and data for this project will be permanently removed.</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={confirmDelete} className="text-xs px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity">Delete</button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}

function ProjectCard({ project, onOpen, onDelete }: { project: Project; onOpen: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const [copied, setCopied] = useState(false);
  const copyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(project.raw_input || "");
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const brandPrimary = getBrandPrimary(project);
  const pillColors = MODE_PILL_COLORS[project.mode] || "text-blue-600 bg-blue-50";
  const preview = getProjectPreview(project);
  const accent = getAccentClass(project.mode, brandPrimary);

  return (
    <div onClick={onOpen} className="bg-card border border-border rounded-lg p-5 flex flex-col group hover:border-muted-foreground/30 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden relative min-h-[190px]">
      <div className={accent.className} style={accent.style} />

      <div className="flex items-start justify-between mb-2 mt-0.5">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 flex-1 min-w-0 pr-1">
          {project.title}
          {project.detected_intent === "evaluate" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-electric/10 text-electric border border-electric/20 shrink-0 ml-1.5">Eval</span>
          )}
        </h3>
        <div className="flex items-center shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={copyPrompt} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Copy prompt">
            {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
          </button>
          <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {preview && (
        <p className="text-[12px] text-foreground/50 leading-relaxed flex-1">{truncateAtWord(preview, 120)}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pillColors}`}>{MODE_LABELS[project.mode] || project.mode}</span>
          <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
        </div>
        <span className="flex items-center text-xs font-medium text-electric group-hover:text-foreground transition-colors">
          Open <ArrowRight className="h-3 w-3 ml-1" />
        </span>
      </div>
    </div>
  );
}