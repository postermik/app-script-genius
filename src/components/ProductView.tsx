import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDecksmith } from "@/context/DecksmithContext";
import { useSubscription } from "@/hooks/useSubscription";
import { OutputView } from "@/components/OutputView";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Loader2, Copy, Trash2, ArrowRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { OutputMode, VoiceProfile } from "@/types/narrative";
import { formatDistanceToNow } from "date-fns";

const MODES: { value: OutputMode | "auto"; label: string }[] = [
  { value: "auto", label: "Auto Detect" }, { value: "fundraising", label: "Fundraising" },
  { value: "board_update", label: "Board Update" }, { value: "strategy", label: "Strategy Memo" },
  { value: "product_vision", label: "Product Vision" }, { value: "investor_update", label: "Investor Update" },
];

const VOICES: { value: VoiceProfile; label: string }[] = [
  { value: "auto", label: "Auto" }, { value: "executive", label: "Executive" },
  { value: "investor", label: "Investor" }, { value: "technical", label: "Technical" },
  { value: "visionary", label: "Visionary" },
];

const LOADING_MESSAGES: Record<string, string> = {
  structuring: "Structuring thesis...", sharpening: "Sharpening narrative...",
  designing: "Designing deck framework...", scoring: "Computing readiness...",
};

export function ProductView() {
  const navigate = useNavigate();
  const { rawInput, setRawInput, selectedMode, setSelectedMode, output, isGenerating, loadingPhase, generate, reset, projects, loadProjects, openProject, deleteProject, duplicateProject, voiceProfile, setVoiceProfile } = useDecksmith();
  const { subscribed } = useSubscription();
  const [localVoice, setLocalVoice] = useState<VoiceProfile>(voiceProfile || "auto");
  const [draftsUsed, setDraftsUsed] = useState<number | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const isFreeAndLocked = !subscribed && draftsUsed !== null && draftsUsed >= 1;

  useEffect(() => { loadProjects(); loadDraftsUsed(); }, [loadProjects]);
  useEffect(() => { setVoiceProfile(localVoice); }, [localVoice, setVoiceProfile]);

  const loadDraftsUsed = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("user_usage").select("drafts_used").eq("user_id", session.user.id).maybeSingle();
    setDraftsUsed(data?.drafts_used ?? 0);
  };

  const handleGenerate = async () => { await generate(); await loadDraftsUsed(); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (!isFreeAndLocked) handleGenerate(); } };

  if (output) return <OutputView />;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 pt-20">
        <div className="max-w-[720px] w-full animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight text-center mb-4">What are you working on?</h1>
          <p className="text-base text-muted-foreground max-w-[540px] mx-auto leading-relaxed text-center mb-12">We'll detect your intent and generate the right output structure.</p>
          <div className="space-y-5">
            <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe your startup, paste your pitch, or tell us what you need to create..." rows={8} disabled={isFreeAndLocked} className="w-full bg-card border border-border rounded-sm px-5 py-4 text-foreground text-[15px] leading-relaxed resize-none focus:outline-none focus:border-electric/40 transition-colors placeholder:text-muted-foreground/40 disabled:opacity-50" />
            {!isFreeAndLocked && (
              <div className="flex flex-wrap gap-1.5">
                {MODES.map((m) => (<button key={m.value} onClick={() => setSelectedMode(m.value)} className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${selectedMode === m.value ? "border-electric/30 text-foreground bg-accent" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}`}>{m.label}</button>))}
                <span className="w-px bg-border mx-1" />
                <select value={localVoice} onChange={(e) => setLocalVoice(e.target.value as VoiceProfile)} className="text-xs px-3 py-1.5 rounded-sm border border-border bg-card text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:border-electric/40">
                  {VOICES.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
                </select>
              </div>
            )}
            {isFreeAndLocked ? (
              <div className="border border-electric/20 rounded-sm p-6 bg-card/50 text-center">
                <Lock className="h-5 w-5 text-electric mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-2">You've used your free draft.</p>
                <p className="text-sm text-muted-foreground mb-4">Upgrade to keep generating narratives, refining sections, and exporting decks.</p>
                <button onClick={() => setUpgradeOpen(true)} className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium rounded-sm hover:opacity-90 transition-opacity glow-blue">Upgrade Now</button>
              </div>
            ) : (
              <>
                <button onClick={handleGenerate} disabled={isGenerating || !rawInput.trim()} className="w-full py-3.5 bg-primary text-primary-foreground font-medium text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center gap-2 glow-blue">
                  {isGenerating ? (<><Loader2 className="h-4 w-4 animate-spin" />{LOADING_MESSAGES[loadingPhase] || "Generating..."}</>) : "Generate"}
                </button>
                <p className="text-[11px] text-muted-foreground/50 text-center mb-4">Press Cmd+Enter to generate</p>
              </>
            )}
          </div>
        </div>
        {projects.length > 0 && (
          <div className="max-w-[720px] w-full mt-16 mb-12 animate-fade-in">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-6">Recent Projects</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div key={project.id} className="bg-card/50 border border-border rounded-sm p-5 group cursor-pointer hover:border-muted-foreground/20 hover:-translate-y-0.5 transition-all" onClick={() => openProject(project)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground truncate">{project.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1">{project.mode.replace("_", " ")} · {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); duplicateProject(project.id); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Duplicate"><Copy className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="flex items-center text-[11px] text-muted-foreground/60 group-hover:text-electric transition-colors">Open <ArrowRight className="h-3 w-3 ml-1" /></div>
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
