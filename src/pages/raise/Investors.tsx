import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, MapPin, Filter, X, Sparkles, ArrowRight, Check, Linkedin, Globe, Mail, Copy, ExternalLink } from "lucide-react";
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
  contact_email?: string | null;
  linkedin_url?: string | null;
  last_enriched_at?: string | null;
  enriching?: boolean;
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
  { label: "$250K-$1M", min: 250000, max: 1000000 },
  { label: "$1M-$5M", min: 1000000, max: 5000000 },
  { label: "$5M+", min: 5000000, max: null },
];

function formatCheckSize(min: number | null, max: number | null): string {
  const fmt = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return "-";
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

  const matchedStages = signals.stages.filter(s => inv.stages.includes(s));
  if (matchedStages.length > 0) {
    score += 30 * matchedStages.length;
    reasons.push(`Invests in ${matchedStages.map(s => STAGE_LABELS[s] || s).join(", ")}`);
  }

  const matchedSectors = signals.sectors.filter(s => inv.sectors.includes(s));
  if (matchedSectors.length > 0) {
    score += 20 * matchedSectors.length;
    reasons.push(`Focuses on ${matchedSectors.map(s => SECTOR_LABELS[s] || s).join(", ")}`);
  }

  if (signals.soloFounder && inv.solo_founder_friendly) {
    score += 15;
    reasons.push("Solo founder friendly");
  }

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
  const [pipelineIds, setPipelineIds] = useState<Set<string>>(new Set());
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null);
  const [removingFromPipeline, setRemovingFromPipeline] = useState<string | null>(null);
  const [narrativeSignals, setNarrativeSignals] = useState<NarrativeSignals | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Filters
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedCheckSize, setSelectedCheckSize] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      // Load dismissed investors from localStorage
      const stored = localStorage.getItem(`dismissed_investors_${session.user.id}`);
      if (stored) {
        try { setDismissedIds(new Set(JSON.parse(stored))); } catch {}
      }

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

      const { data: pipelineData } = await supabase
        .from("pipeline_entries")
        .select("investor_id")
        .not("investor_id", "is", null);
      if (pipelineData) {
        setPipelineIds(new Set(pipelineData.map((p: any) => p.investor_id).filter(Boolean)));
      }
    })();
  }, []);

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

  // Background enrichment via Apollo.io
  useEffect(() => {
    if (investors.length === 0) return;
    const SUPABASE_URL = "https://jilopuugwyrqogoxlxjo.supabase.co";

    const enrichInvestor = async (inv: Investor) => {
      // Skip if already enriched within 30 days
      if (inv.last_enriched_at) {
        const daysSince = (Date.now() - new Date(inv.last_enriched_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) return;
      }

      // Parse name from firm_name (best effort: use firm name as org)
      // The edge function handles graceful fallback if Apollo key is missing
      try {
        // Mark as enriching
        setInvestors(prev => prev.map(i => i.id === inv.id ? { ...i, enriching: true } : i));

        const res = await fetch(`${SUPABASE_URL}/functions/v1/enrich-investor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: inv.firm_name.split(" ")[0] || inv.firm_name,
            last_name: inv.firm_name.split(" ").slice(1).join(" ") || "Partner",
            organization_name: inv.firm_name,
            investor_id: inv.id,
          }),
        });

        if (!res.ok) {
          setInvestors(prev => prev.map(i => i.id === inv.id ? { ...i, enriching: false } : i));
          return;
        }

        const data = await res.json();
        if (data.skipped) {
          // Apollo not configured, stop enrichment
          setInvestors(prev => prev.map(i => ({ ...i, enriching: false })));
          return;
        }

        if (data.email || data.linkedin_url || data.cached) {
          setInvestors(prev => prev.map(i => i.id === inv.id ? {
            ...i,
            contact_email: data.email || i.contact_email,
            linkedin_url: data.linkedin_url || i.linkedin_url,
            last_enriched_at: new Date().toISOString(),
            enriching: false,
          } : i));
        } else {
          setInvestors(prev => prev.map(i => i.id === inv.id ? { ...i, enriching: false, last_enriched_at: new Date().toISOString() } : i));
        }
      } catch {
        setInvestors(prev => prev.map(i => i.id === inv.id ? { ...i, enriching: false } : i));
      }
    };

    // Enrich up to 5 investors at a time that lack contact info
    const toEnrich = investors.filter(i => !i.contact_email && !i.linkedin_url && !i.last_enriched_at).slice(0, 5);
    toEnrich.forEach((inv, idx) => {
      // Stagger requests to avoid rate limiting
      setTimeout(() => enrichInvestor(inv), idx * 1500);
    });
  }, [investors.length]); // Only run when investor count changes (initial load)

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

  const removeFromPipeline = useCallback(async (inv: Investor) => {
    if (!userId) return;
    setRemovingFromPipeline(inv.id);
    const { error } = await supabase
      .from("pipeline_entries")
      .delete()
      .eq("user_id", userId)
      .eq("investor_id", inv.id);
    if (error) {
      toast.error("Failed to remove from pipeline");
    } else {
      setPipelineIds(prev => {
        const next = new Set(prev);
        next.delete(inv.id);
        return next;
      });
      toast.success(`${inv.firm_name} removed from pipeline`);
    }
    setRemovingFromPipeline(null);
  }, [userId]);

  const dismissInvestor = useCallback((inv: Investor) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(inv.id);
      if (userId) localStorage.setItem(`dismissed_investors_${userId}`, JSON.stringify([...next]));
      return next;
    });
    toast("Investor hidden", {
      action: {
        label: "Undo",
        onClick: () => {
          setDismissedIds(prev => {
            const next = new Set(prev);
            next.delete(inv.id);
            if (userId) localStorage.setItem(`dismissed_investors_${userId}`, JSON.stringify([...next]));
            return next;
          });
        },
      },
    });
  }, [userId]);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearFilters = () => {
    setSelectedStages([]);
    setSelectedSectors([]);
    setSelectedCheckSize(null);
  };

  const hasFilters = selectedStages.length > 0 || selectedSectors.length > 0 || selectedCheckSize !== null;

  const { recommended, allFiltered } = useMemo(() => {
    const scored: ScoredInvestor[] = narrativeSignals
      ? investors.map(inv => scoreInvestor(inv, narrativeSignals))
      : investors.map(inv => ({ ...inv, matchScore: 0, matchReasons: [] }));

    const applyFilters = (list: ScoredInvestor[]) => list.filter(inv => {
      // Always filter out dismissed from recommendations, but show in search
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
      return true;
    });

    const filteredScored = applyFilters(scored);

    const rec = filteredScored
      .filter(i => i.matchScore >= 30 && !dismissedIds.has(i.id))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    const recIds = new Set(rec.map(i => i.id));
    const rest = filteredScored.filter(i => !recIds.has(i.id) && !dismissedIds.has(i.id));

    return { recommended: rec, allFiltered: rest };
  }, [investors, narrativeSignals, search, selectedStages, selectedSectors, selectedCheckSize, dismissedIds]);

  const totalCount = recommended.length + allFiltered.length;

  return (
    <div>
      {/* Row 1: Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-foreground">Investor Discovery</h2>
        <p className="text-sm text-secondary-foreground">Find investors matched to your stage, sector, and thesis.</p>
      </div>

      {/* Row 2: Search + filters + count */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search firms, sectors, keywords..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40 transition-colors" />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{totalCount} found</span>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-sm border transition-colors ${
            hasFilters ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
          }`}>
          <Filter className="h-4 w-4" /> Filters
          {hasFilters && <span className="text-xs bg-electric text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">
            {selectedStages.length + selectedSectors.length + (selectedCheckSize !== null ? 1 : 0)}
          </span>}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/60 mb-4">Contact information is sourced from public data and may not be current.</p>

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
          {hasFilters && (
            <div className="flex justify-end">
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" /> Clear all
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Row 3: Recommended section */}
      {!loading && recommended.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-electric" />
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Recommended for You</h3>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm font-bold">{recommended.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map(inv => (
              <InvestorCard key={inv.id} inv={inv}
                inPipeline={pipelineIds.has(inv.id)}
                onAddToPipeline={() => addToPipeline(inv)}
                onRemoveFromPipeline={() => removeFromPipeline(inv)}
                onDismiss={() => dismissInvestor(inv)}
                isAdding={addingToPipeline === inv.id}
                isRemoving={removingFromPipeline === inv.id}
                isRecommended />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allFiltered.map(inv => (
              <InvestorCard key={inv.id} inv={inv}
                inPipeline={pipelineIds.has(inv.id)}
                onAddToPipeline={() => addToPipeline(inv)}
                onRemoveFromPipeline={() => removeFromPipeline(inv)}
                onDismiss={() => dismissInvestor(inv)}
                isAdding={addingToPipeline === inv.id}
                isRemoving={removingFromPipeline === inv.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Investor Card ──────────────────────────────────────

function InvestorCard({ inv, inPipeline, onAddToPipeline, onRemoveFromPipeline, onDismiss, isAdding, isRemoving, isRecommended }: {
  inv: Investor;
  inPipeline: boolean;
  onAddToPipeline: () => void;
  onRemoveFromPipeline: () => void;
  onDismiss: () => void;
  isAdding: boolean;
  isRemoving: boolean;
  isRecommended?: boolean;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [fading, setFading] = useState(false);
  const MAX_SECTORS = 3;
  const visibleSectors = inv.sectors.slice(0, MAX_SECTORS);
  const overflowCount = inv.sectors.length - MAX_SECTORS;

  const hasContact = inv.contact_email || inv.linkedin_url || inv.website_url;

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => onDismiss(), 300);
  };

  const handlePipelineClick = () => {
    if (inPipeline) {
      if (confirmRemove) {
        onRemoveFromPipeline();
        setConfirmRemove(false);
      } else {
        setConfirmRemove(true);
        setTimeout(() => setConfirmRemove(false), 3000);
      }
    } else {
      onAddToPipeline();
    }
  };

  return (
    <div className={`relative p-5 rounded-sm border transition-all group ${
      fading ? "opacity-0 scale-95" : "opacity-100"
    } ${
      isRecommended ? "border-electric/20 bg-electric/[0.03] hover:border-electric/30" : "border-border card-gradient hover:border-muted-foreground/20"
    }`} style={{ transitionDuration: "300ms" }}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-sm text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors opacity-0 group-hover:opacity-100"
        title="Hide this investor"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Top row: name + type badge */}
      <div className="flex items-start justify-between gap-3 mb-3 pr-5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground leading-tight">{inv.firm_name}</h3>
          {inv.location_city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {[inv.location_city, inv.location_state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-sm bg-electric/10 text-electric uppercase tracking-wide shrink-0">
          {TYPE_LABELS[inv.investor_type] || inv.investor_type}
        </span>
      </div>

      {/* Stages */}
      {inv.stages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {inv.stages.map(s => (
            <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-sm border border-border text-secondary-foreground">
              {STAGE_LABELS[s] || s}
            </span>
          ))}
        </div>
      )}

      {/* Check size */}
      <p className="text-xs text-secondary-foreground mb-2">
        <span className="text-muted-foreground">Check:</span> {formatCheckSize(inv.check_size_min, inv.check_size_max)}
      </p>

      {/* Sectors (max 3 + overflow) */}
      {inv.sectors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleSectors.map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/40 text-muted-foreground">
              {SECTOR_LABELS[s] || s}
            </span>
          ))}
          {overflowCount > 0 && <span className="text-[10px] text-muted-foreground">+{overflowCount}</span>}
        </div>
      )}

      {/* Contact info row */}
      {inv.enriching ? (
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-24 rounded-sm bg-muted/40 animate-pulse" />
          <div className="h-3 w-3 rounded-full bg-muted/40 animate-pulse" />
        </div>
      ) : hasContact ? (
        <div className="flex items-center gap-2 mb-3">
          {inv.contact_email && (
            <div className="flex items-center gap-1">
              <a href={`mailto:${inv.contact_email}`} className="text-[10px] text-muted-foreground hover:text-electric transition-colors truncate max-w-[120px]" title={inv.contact_email}>
                <Mail className="h-3 w-3 inline mr-0.5" />{inv.contact_email}
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(inv.contact_email!); toast.success("Email copied"); }}
                className="p-0.5 text-muted-foreground/50 hover:text-electric transition-colors"
                title="Copy email"
              >
                <Copy className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
          {inv.linkedin_url && (
            <a href={inv.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-electric transition-colors" title="LinkedIn">
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          )}
          {inv.website_url && (
            <a href={inv.website_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-electric transition-colors" title="Website">
              <Globe className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          {inv.website_url && (
            <a href={inv.website_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-electric transition-colors" title="Website">
              <Globe className="h-3.5 w-3.5" />
            </a>
          )}
          <p className="text-[10px] text-muted-foreground/50">No contact info available</p>
        </div>
      )}

      {/* Solo founder + website on hover */}
      <div className="h-0 overflow-hidden group-hover:h-auto group-hover:mb-3 transition-all">
        <div className="flex items-center gap-3 text-[10px]">
          {inv.solo_founder_friendly && <span className="text-emerald font-medium">✓ Solo founder friendly</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        {inv.application_url && (
          <a href={inv.application_url} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium py-2 rounded-sm border border-electric/30 text-electric hover:bg-electric/10 transition-colors">
            Apply
          </a>
        )}
        <button
          onClick={handlePipelineClick}
          disabled={isAdding || isRemoving}
          className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-sm border transition-colors disabled:opacity-50 ${
            inPipeline
              ? confirmRemove
                ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                : "border-emerald/30 text-emerald bg-emerald/10 hover:border-destructive/30 hover:text-destructive hover:bg-transparent"
              : "border-border text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30"
          }`}
        >
          {isAdding || isRemoving ? (
            <div className="h-3 w-3 border border-electric border-t-transparent rounded-full animate-spin" />
          ) : inPipeline ? (
            confirmRemove ? (
              <>Remove from pipeline?</>
            ) : (
              <><Check className="h-3 w-3" /> In Pipeline</>
            )
          ) : (
            <><ArrowRight className="h-3 w-3" /> Add to Pipeline</>
          )}
        </button>
      </div>
    </div>
  );
}
