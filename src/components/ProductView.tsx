import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDecksmith } from "@/context/DecksmithContext";
import { useSubscription } from "@/hooks/useSubscription";
import { OutputView } from "@/components/OutputView";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Loader2, Copy, Trash2, ArrowRight, Lock, Upload, FileText, Check } from "lucide-react";
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
    // Sort initial batch by speed (fastest first); subsequent adds will be appended
    const sortedOutputs = sortBySpeed(selections.outputs);
    setIntakeSelections({ ...selections, outputs: sortedOutputs });
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

  if (output || isGenerating) return <OutputView />;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 pt-20">
        <div className="max-w-[720px] w-full animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight text-center mb-4">What are you working on?</h1>

          <p className="text-base text-secondary-foreground max-w-[540px] mx-auto leading-relaxed text-center mb-12">Paste your narrative and we'll help you build the right outputs.</p>
          <div className="space-y-5">