import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Bookmark, BookmarkCheck, MapPin, ExternalLink, Filter, X, Sparkles, Plus, Check, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────

interface Investor {
  id: string;
  firm_name: string;
  investor_type: string;
  stages: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  sectors: string[];
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  website_url: string | null;
  application_url: string | null;
  contact_method: string | null;
  notable_investments: string[];
  description: string | null;
  thesis_keywords: string[];
  solo_founder_friendly: boolean;
  fund_size: number | null;
  is_active: boolean;
}

interface NarrativeSignals {
  stages: string[];
  sectors: string[];
  soloFounder: boolean;
  rawInput: string;
}

interface ScoredInvestor extends Investor {
  matchScore: number;
  matchReasons: string[];
}

// ── Constants ──────────────────────────────────────────

const STAGE_OPTIONS = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
];

const SECTOR_OPTIONS = [
  { value: "ai_ml", label: "AI/ML" },
  { value: "saas", label: "SaaS" },
  { value: "fintech", label: "FinTech" },
  { value: "enterprise", label: "Enterprise" },
  { value: "consumer", label: "Consumer" },
  { value: "healthtech", label: "HealthTech" },
  { value: "edtech", label: "EdTech" },
  { value: "marketplace", label: "Marketplace" },
  { value: "creator_tools", label: "Creator Tools" },
];

const TYPE_LABELS: Record<string, string> = {
  micro_vc: "Micro VC", vc: "VC", accelerator: "Accelerator", angel: "Angel", corporate_vc: "Corporate VC",
};

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(SECTOR_OPTIONS.map(s => [s.value, s.label]));
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGE_OPTIONS.map(s => [s.value, s.label]));

const CHECK_SIZE_RANGES = [
  { label: "< $250K", min: 0, max: 250000 },
  { label: "$250K–$1M", min: 250000, max: 1000000 },
  { label: "$1M–$5M", min: 1000000, max: 5000000 },
  { label: "$5M+", min: 5000000, max: null },
];

function formatCheckSize(min: number | null, max: number | null): string {
  const fmt = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return "—";
}

// ── Narrative signal extraction ────────────────────────

function extractNarrativeSignals(outputData: any, rawInput: string): NarrativeSignals {
  const text = `${JSON.stringify(outputData || "")} ${rawInput}`.toLowerCase();
  const stages: string[] = [];
  const sectors: string[] = [];

  if (text.includes("pre-seed") || text.includes("pre_seed")) stages.push("pre_seed");
  if (/\bseed\b/.test(text) && !text.includes("pre-seed") && !text.includes("pre_seed")) stages.push("seed");
  if (text.includes("series a")) stages.push("series_a");
  if (text.includes("series b")) stages.push("series_b");

  if (/\bai\b|artificial intelligence|machine learning|ai\/ml|ai model|llm|gpt|neural/.test(text)) sectors.push("ai_ml");
  if (/\bsaas\b|software.as.a.service|subscription.software|cloud.platform/.test(text)) sectors.push("saas");
  if (/fintech|financial.technology|payments|banking|lending|neobank/.test(text)) sectors.push("fintech");
  if (/\benterprise\b|b2b|business.software/.test(text)) sectors.push("enterprise");
  if (/\bconsumer\b|d2c|direct.to.consumer|b2c/.test(text)) sectors.push("consumer");
  if (/healthtech|health.tech|healthcare|medtech|digital.health|biotech/.test(text)) sectors.push("healthtech");
  if (/edtech|education|e-learning|learning.platform/.test(text)) sectors.push("edtech");
  if (/\bmarketplace\b|two.sided|platform.connecting/.test(text)) sectors.push("marketplace");
  if (/creator|content.creator|creator.economy/.test(text)) sectors.push("creator_tools");

  const soloFounder = /solo.founder|single.founder|sole.founder|founding.alone/.test(text);

  return { stages: [...new Set(stages)], sectors: [...new Set(sectors)], soloFounder, rawInput };
}

// ── Scoring & matching ─────────────────────────────────

function scoreInvestor(inv: Investor, signals: NarrativeSignals): ScoredInvestor {
  let score = 0;
  const reasons: string[] = [];

  // Stage match (high weight)
  const matchedStages = signals.stages.filter(s => inv.stages.includes(s));
  if (matchedStages.length > 0) {
    score += 30 * matchedStages.length;
    reasons.push(`Invests in ${matchedStages.map(s => STAGE_LABELS[s] || s).join(", ")}`);
  }

  // Sector match (medium-high weight)
  const matchedSectors = signals.sectors.filter(s => inv.sectors.includes(s));
  if (matchedSectors.length > 0) {
    score += 20 * matchedSectors.length;
    reasons.push(`Focuses on ${matchedSectors.map(s => SECTOR_LABELS[s] || s).join(", ")}`);
  }

  // Solo founder boost
  if (signals.soloFounder && inv.solo_founder_friendly) {
    score += 15;
    reasons.push("Solo founder friendly");
  }

  // Thesis keyword overlap
  if (inv.thesis_keywords.length > 0 && signals.rawInput) {
    const inputLower = signals.rawInput.toLowerCase();
    const kwMatches = inv.thesis_keywords.filter(kw => inputLower.includes(kw.toLowerCase()));
    if (kwMatches.length > 0) {
      score += 10 * kwMatches.length;
      reasons.push(`Thesis alignment: ${kwMatches.slice(0, 3).join(", ")}`);
    }
  }

  return { ...inv, matchScore: score, matchReasons: reasons };
}

// ── Component ──────────────────────────────────────────

export default function Investors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("rhetoric_saved_investors");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [pipelineIds, setPipelineIds] = useState<Set<string>>(new Set());
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null);
  const [narrativeSignals, setNarrativeSignals] = useState<NarrativeSignals | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedCheckSize, setSelectedCheckSize] = useState<number | null>(null);
  const [soloFriendly, setSoloFriendly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load latest project for narrative signals
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data: project } = await supabase
        .from("projects")
        .select("output_data, raw_input")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (project?.output_data) {
        const signals = extractNarrativeSignals(project.output_data, project.raw_input || "");
        setNarrativeSignals(signals);
      }

      // Load existing pipeline entries to know what's already added
      const { data: pipelineData } = await supabase
        .from("pipeline_entries")
        .select("investor_id")
        .not("investor_id", "is", null);
      if (pipelineData) {
        setPipelineIds(new Set(pipelineData.map((p: any) => p.investor_id).filter(Boolean)));
      }
    })();
  }, []);

  // Load investors
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("investors")
        .select("*")
        .eq("is_active", true)
        .order("firm_name");
      if (!error && data) {
        setInvestors(data.map((d: any) => ({
          ...d,
          stages: d.stages || [],
          sectors: d.sectors || [],
          notable_investments: d.notable_investments || [],
          thesis_keywords: d.thesis_keywords || [],
        })));
      }
      setLoading(false);
    })();
  }, []);

  const addToPipeline = useCallback(async (inv: Investor) => {
    if (!userId) return;
    setAddingToPipeline(inv.id);
    const { error } = await supabase.from("pipeline_entries").insert({
      user_id: userId,
      investor_id: inv.id,
      firm_name: inv.firm_name,
      status: "researching",
      interest_level: "unknown",
    });
    if (error) {
      toast.error("Failed to add to pipeline");
    } else {
      setPipelineIds(prev => new Set([...prev, inv.id]));
      toast.success(`${inv.firm_name} added to pipeline`);
    }
    setAddingToPipeline(null);
  }, [userId]);

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("rhetoric_saved_investors", JSON.stringify([...next]));
      return next;
    });
  };

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearFilters = () => {
    setSelectedStages([]);
    setSelectedSectors([]);
    setSelectedCheckSize(null);
    setSoloFriendly(false);
  };

  const hasFilters = selectedStages.length > 0 || selectedSectors.length > 0 || selectedCheckSize !== null || soloFriendly;

  // Score and split investors into recommended vs all
  const { recommended, allFiltered } = useMemo(() => {
    // Score all investors
    const scored: ScoredInvestor[] = narrativeSignals
      ? investors.map(inv => scoreInvestor(inv, narrativeSignals))
      : investors.map(inv => ({ ...inv, matchScore: 0, matchReasons: [] }));

    // Apply filters to all investors
    const applyFilters = (list: ScoredInvestor[]) => list.filter(inv => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${inv.firm_name} ${inv.description || ""} ${inv.sectors.join(" ")} ${inv.thesis_keywords.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (selectedStages.length > 0 && !selectedStages.some(s => inv.stages.includes(s))) return false;
      if (selectedSectors.length > 0 && !selectedSectors.some(s => inv.sectors.includes(s))) return false;
      if (selectedCheckSize !== null) {
        const range = CHECK_SIZE_RANGES[selectedCheckSize];
        if (range) {
          if (range.max !== null && inv.check_size_min && inv.check_size_min > range.max) return false;
          if (inv.check_size_max && inv.check_size_max < range.min) return false;
        }
      }
      if (soloFriendly && !inv.solo_founder_friendly) return false;
      return true;
    });

    const filteredScored = applyFilters(scored);

    // Recommended: score >= 30, sorted by score desc, max 6
    const rec = filteredScored
      .filter(i => i.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    const recIds = new Set(rec.map(i => i.id));
    const rest = filteredScored.filter(i => !recIds.has(i.id));

    return { recommended: rec, allFiltered: rest };
  }, [investors, narrativeSignals, search, selectedStages, selectedSectors, selectedCheckSize, soloFriendly]);

  const totalCount = recommended.length + allFiltered.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-sm bg-electric/10">
          <Search className="h-4 w-4 text-electric" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Investor Discovery</h2>
          <p className="text-sm text-secondary-foreground">Find investors matched to your stage, sector, and thesis.</p>
        </div>
      </div>

      {/* Narrative match banner */}
      {narrativeSignals && (narrativeSignals.stages.length > 0 || narrativeSignals.sectors.length > 0) && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-sm border border-electric/20 bg-electric/5">
          <Sparkles className="h-4 w-4 text-electric shrink-0" />
          <p className="text-sm text-foreground/80 flex-1">
            Matched to your latest narrative
            {narrativeSignals.stages.length > 0 && (
              <span className="text-muted-foreground"> · {narrativeSignals.stages.map(s => STAGE_LABELS[s] || s).join(", ")}</span>
            )}
            {narrativeSignals.sectors.length > 0 && (
              <span className="text-muted-foreground"> · {narrativeSignals.sectors.map(s => SECTOR_LABELS[s] || s).join(", ")}</span>
            )}
            {narrativeSignals.soloFounder && <span className="text-muted-foreground"> · Solo founder</span>}
          </p>
        </div>
      )}

      {/* Search + filter toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search firms, sectors, keywords..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40 transition-colors" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-sm border transition-colors ${
            hasFilters ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
          }`}>
          <Filter className="h-4 w-4" /> Filters
          {hasFilters && <span className="text-xs bg-electric text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">
            {selectedStages.length + selectedSectors.length + (selectedCheckSize !== null ? 1 : 0) + (soloFriendly ? 1 : 0)}
          </span>}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-5 p-4 rounded-sm border border-border card-gradient space-y-4 animate-fade-in">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Stage</label>
            <div className="flex flex-wrap gap-2">
              {STAGE_OPTIONS.map(s => (
                <button key={s.value} onClick={() => toggleFilter(selectedStages, s.value, setSelectedStages)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedStages.includes(s.value) ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Sector</label>
            <div className="flex flex-wrap gap-2">
              {SECTOR_OPTIONS.map(s => (
                <button key={s.value} onClick={() => toggleFilter(selectedSectors, s.value, setSelectedSectors)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedSectors.includes(s.value) ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Check Size</label>
            <div className="flex flex-wrap gap-2">
              {CHECK_SIZE_RANGES.map((r, idx) => (
                <button key={idx} onClick={() => setSelectedCheckSize(selectedCheckSize === idx ? null : idx)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedCheckSize === idx ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>{r.label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={() => setSoloFriendly(!soloFriendly)}
              className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                soloFriendly ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
              }`}>Solo Founder Friendly</button>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-4">{totalCount} investor{totalCount !== 1 ? "s" : ""} found</p>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && totalCount === 0 && (
        <div className="text-center py-12 border border-border rounded-sm card-gradient">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No investors match your filters.</p>
          <p className="text-xs text-muted-foreground">Try broadening your search or clearing filters.</p>
        </div>
      )}

      {/* Recommended section */}
      {!loading && recommended.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-electric" />
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Recommended for You</h3>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm font-bold">{recommended.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommended.map(inv => (
              <InvestorCard key={inv.id} inv={inv} matchReasons={inv.matchReasons} matchScore={inv.matchScore}
                saved={savedIds.has(inv.id)} onToggleSave={() => toggleSave(inv.id)}
                inPipeline={pipelineIds.has(inv.id)} onAddToPipeline={() => addToPipeline(inv)}
                isAdding={addingToPipeline === inv.id} isRecommended />
            ))}
          </div>
        </div>
      )}

      {/* All investors */}
      {!loading && allFiltered.length > 0 && (
        <div>
          {recommended.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">All Investors</h3>
              <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm font-bold">{allFiltered.length}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFiltered.map(inv => (
              <InvestorCard key={inv.id} inv={inv} matchReasons={inv.matchReasons} matchScore={inv.matchScore}
                saved={savedIds.has(inv.id)} onToggleSave={() => toggleSave(inv.id)}
                inPipeline={pipelineIds.has(inv.id)} onAddToPipeline={() => addToPipeline(inv)}
                isAdding={addingToPipeline === inv.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Investor Card ──────────────────────────────────────

function InvestorCard({ inv, matchReasons, matchScore, saved, onToggleSave, inPipeline, onAddToPipeline, isAdding, isRecommended }: {
  inv: Investor;
  matchReasons: string[];
  matchScore: number;
  saved: boolean;
  onToggleSave: () => void;
  inPipeline: boolean;
  onAddToPipeline: () => void;
  isAdding: boolean;
  isRecommended?: boolean;
}) {
  return (
    <div className={`p-5 rounded-sm border transition-colors ${
      isRecommended ? "border-electric/20 bg-electric/[0.03] hover:border-electric/30" : "border-border card-gradient hover:border-muted-foreground/20"
    }`}>
      {/* Match reason banner */}
      {isRecommended && matchReasons.length > 0 && (
        <div className="flex items-start gap-2 mb-3 pb-3 border-b border-electric/10">
          <Sparkles className="h-3.5 w-3.5 text-electric shrink-0 mt-0.5" />
          <p className="text-xs text-electric leading-relaxed">
            {matchReasons.join(". ")}.
          </p>
        </div>
      )}

      {/* Top row: name + type + save */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground leading-tight">{inv.firm_name}</h3>
          {inv.location_city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {[inv.location_city, inv.location_state, inv.location_country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-sm bg-electric/10 text-electric uppercase tracking-wide">
            {TYPE_LABELS[inv.investor_type] || inv.investor_type}
          </span>
          <button onClick={onToggleSave}
            className={`p-1.5 rounded-sm transition-colors ${saved ? "text-electric bg-electric/10" : "text-muted-foreground hover:text-electric hover:bg-electric/5"}`}
            title={saved ? "Saved" : "Save"}>
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Stages */}
      {inv.stages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {inv.stages.map(s => (
            <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-sm border border-border text-secondary-foreground">
              {STAGE_LABELS[s] || s}
            </span>
          ))}
        </div>
      )}

      {/* Check size */}
      <p className="text-xs text-secondary-foreground mb-2">
        <span className="text-muted-foreground">Check size:</span> {formatCheckSize(inv.check_size_min, inv.check_size_max)}
      </p>

      {inv.description && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{inv.description}</p>
      )}

      {/* Sectors */}
      {inv.sectors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {inv.sectors.slice(0, 5).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/40 text-muted-foreground">
              {SECTOR_LABELS[s] || s}
            </span>
          ))}
          {inv.sectors.length > 5 && <span className="text-[10px] text-muted-foreground">+{inv.sectors.length - 5}</span>}
        </div>
      )}

      {/* Footer: solo + links + pipeline */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          {inv.solo_founder_friendly && (
            <span className="text-[10px] font-medium text-emerald">✓ Solo founder friendly</span>
          )}
          {inv.website_url && (
            <a href={inv.website_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-electric flex items-center gap-1 transition-colors">
              <ExternalLink className="h-3 w-3" /> Website
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {inv.application_url && (
            <a href={inv.application_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-electric hover:underline font-medium">Apply</a>
          )}
          {inPipeline ? (
            <span className="flex items-center gap-1 text-xs text-emerald font-medium px-2.5 py-1.5 rounded-sm bg-emerald/10">
              <Check className="h-3 w-3" /> In Pipeline
            </span>
          ) : (
            <button onClick={onAddToPipeline} disabled={isAdding}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-sm border border-electric/30 text-electric hover:bg-electric/10 transition-colors disabled:opacity-50">
              {isAdding ? (
                <div className="h-3 w-3 border border-electric border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
              Add to Pipeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
