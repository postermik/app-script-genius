import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, MapPin, Filter, X, Sparkles, ArrowRight, Check, Linkedin, Mail, Copy, Loader2, User, Banknote, Eye, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──────────────────────────────────────────────

interface Investor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  title: string | null;
  firm_name: string;
  website_url: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  investor_type: string;
  stages: string[] | null;
  sectors: string[] | null;
  check_min: number | null;
  check_max: number | null;
  application_url: string | null;
  solo_founder_friendly: boolean | null;
  is_enriched: boolean | null;
  last_enriched_at: string | null;
  is_active: boolean | null;
}

interface ProjectOption {
  id: string;
  title: string;
  raw_input: string;
  output_data: any;
}

// ── Constants ──────────────────────────────────────────

const STAGE_OPTIONS = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B+" },
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
  { value: "climate", label: "Climate" },
  { value: "crypto", label: "Crypto/Web3" },
];

const LOCATION_OPTIONS = [
  { value: "San Francisco", label: "San Francisco" },
  { value: "New York", label: "New York" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "Boston", label: "Boston" },
  { value: "Austin", label: "Austin" },
  { value: "Chicago", label: "Chicago" },
  { value: "Seattle", label: "Seattle" },
  { value: "Miami", label: "Miami" },
  { value: "London", label: "London" },
  { value: "Remote", label: "Remote / Any" },
];

const TYPE_LABELS: Record<string, string> = {
  micro_vc: "Micro VC", vc: "VC", accelerator: "Accelerator", angel: "Angel", corporate_vc: "Corporate VC",
};

const TYPE_BADGE_STYLES: Record<string, string> = {
  vc: "bg-electric/10 text-electric",
  micro_vc: "bg-purple-500/15 text-purple-400",
  accelerator: "bg-amber-500/15 text-amber-400",
  angel: "bg-emerald/15 text-emerald",
  corporate_vc: "bg-electric/10 text-electric",
};

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(SECTOR_OPTIONS.map(s => [s.value, s.label]));
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGE_OPTIONS.map(s => [s.value, s.label]));

const SUPABASE_URL = "https://jilopuugwyrqogoxlxjo.supabase.co";
const ANON_KEY = "sb_publishable_IdoGcGM61fuk6JhT88wOeg_JlwFjtxz";

// ── Helpers ────────────────────────────────────────────

function formatCheckSize(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function isEnrichedRecently(inv: Investor): boolean {
  if (!inv.is_enriched || !inv.last_enriched_at) return false;
  const daysSince = (Date.now() - new Date(inv.last_enriched_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 30;
}

function displayName(inv: Investor): string {
  if (inv.first_name && inv.last_name) return `${inv.first_name} ${inv.last_name}`;
  return inv.contact_name || inv.firm_name;
}

function extractNarrativeSignals(outputData: any, rawInput: string) {
  const text = `${JSON.stringify(outputData || "")} ${rawInput}`.toLowerCase();
  const stages: string[] = [];
  const sectors: string[] = [];

  if (text.includes("pre-seed") || text.includes("pre_seed")) stages.push("pre_seed");
  if (/\bseed\b/.test(text) && !text.includes("pre-seed") && !text.includes("pre_seed")) stages.push("seed");
  if (text.includes("series a")) stages.push("series_a");
  if (text.includes("series b")) stages.push("series_b");

  if (/\bai\b|artificial intelligence|machine learning|ai\/ml|llm|gpt/.test(text)) sectors.push("ai_ml");
  if (/\bsaas\b|software.as.a.service/.test(text)) sectors.push("saas");
  if (/fintech|financial.technology|payments/.test(text)) sectors.push("fintech");
  if (/\benterprise\b|b2b/.test(text)) sectors.push("enterprise");
  if (/\bconsumer\b|d2c|b2c/.test(text)) sectors.push("consumer");
  if (/healthtech|healthcare|medtech/.test(text)) sectors.push("healthtech");
  if (/edtech|education/.test(text)) sectors.push("edtech");
  if (/\bmarketplace\b/.test(text)) sectors.push("marketplace");
  if (/creator/.test(text)) sectors.push("creator_tools");

  return { stages: [...new Set(stages)], sectors: [...new Set(sectors)] };
}

/** Apply filters to a list of investors */
function applyFilters(
  list: Investor[],
  search: string,
  stages: string[],
  sectors: string[],
  locations: string[],
  dismissedIds: Set<string>,
) {
  return list.filter(inv => {
    if (dismissedIds.has(inv.id)) return false;

    if (search) {
      const q = search.toLowerCase();
      const searchable = [displayName(inv), inv.firm_name, inv.title, inv.contact_name]
        .filter(Boolean).join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    if (stages.length > 0) {
      if (!inv.stages || !stages.some(s => inv.stages!.includes(s))) return false;
    }

    if (sectors.length > 0) {
      if (!inv.sectors || !sectors.some(s => inv.sectors!.includes(s))) return false;
    }

    if (locations.length > 0) {
      const loc = [inv.location_city, inv.location_state, inv.location_country].filter(Boolean).join(" ").toLowerCase();
      if (!locations.some(l => loc.includes(l.toLowerCase()))) return false;
    }

    return true;
  });
}

// ── Component ──────────────────────────────────────────

export default function Investors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [pipelineIds, setPipelineIds] = useState<Set<string>>(new Set());
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null);
  const [removingFromPipeline, setRemovingFromPipeline] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [userManuallyChangedFilters, setUserManuallyChangedFilters] = useState(false);

  // Projects / narrative
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filters
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // ── Init: load user, projects, pipeline, investors ──
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const stored = localStorage.getItem(`dismissed_investors_${session.user.id}`);
      if (stored) {
        try { setDismissedIds(new Set(JSON.parse(stored))); } catch {}
      }

      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, title, raw_input, output_data")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (projectsData && projectsData.length > 0) {
        setProjects(projectsData);
        setSelectedProjectId(projectsData[0].id);
        const signals = extractNarrativeSignals(projectsData[0].output_data, projectsData[0].raw_input || "");
        if (signals.stages.length > 0) setSelectedStages(signals.stages);
        if (signals.sectors.length > 0) setSelectedSectors(signals.sectors);
      }

      const { data: pipelineData } = await supabase
        .from("pipeline_entries")
        .select("investor_id")
        .not("investor_id", "is", null);
      if (pipelineData) {
        setPipelineIds(new Set(pipelineData.map((p: any) => p.investor_id).filter(Boolean)));
      }

      const { data: investorsData, error } = await supabase
        .from("investors")
        .select("*")
        .eq("is_active", true)
        .order("firm_name");

      if (!error && investorsData) {
        setInvestors(investorsData as Investor[]);
      }
      setLoading(false);
    })();
  }, []);

  // ── Handle narrative change ───────────────────────
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setUserManuallyChangedFilters(false);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const signals = extractNarrativeSignals(project.output_data, project.raw_input || "");
      setSelectedStages(signals.stages);
      setSelectedSectors(signals.sectors);
      setSelectedLocations([]);
    }
  };

  // Wrap filter setters to track manual changes
  const handleToggleStage = (val: string) => {
    setUserManuallyChangedFilters(true);
    setSelectedStages(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const handleToggleSector = (val: string) => {
    setUserManuallyChangedFilters(true);
    setSelectedSectors(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  const handleToggleLocation = (val: string) => {
    setUserManuallyChangedFilters(true);
    setSelectedLocations(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  // ── Smart filter fallback logic ──────────────────
  const { recommended, allInvestors, filtersLoosened, totalCount } = useMemo(() => {
    const MIN_RESULTS = 10;

    // Recommended: always use strict filters
    const strictFiltered = applyFilters(investors, searchInput, selectedStages, selectedSectors, selectedLocations, dismissedIds);
    const rec = strictFiltered.slice(0, 6);

    // "All Investors" section: apply fallback loosening if strict results < MIN_RESULTS
    let allResults = strictFiltered;
    let loosened = false;

    if (allResults.length < MIN_RESULTS && !userManuallyChangedFilters) {
      // Step 1: Remove location filters
      let loosened1 = applyFilters(investors, searchInput, selectedStages, selectedSectors, [], dismissedIds);
      if (loosened1.length >= MIN_RESULTS) {
        allResults = loosened1;
        loosened = true;
      } else {
        // Step 2: Remove sector filters one at a time (least specific first)
        let trySectors = [...selectedSectors];
        let best = loosened1;
        while (trySectors.length > 0 && best.length < MIN_RESULTS) {
          trySectors.pop(); // remove least specific (last)
          best = applyFilters(investors, searchInput, selectedStages, trySectors, [], dismissedIds);
        }
        if (best.length >= MIN_RESULTS || best.length > allResults.length) {
          allResults = best;
          loosened = true;
        }

        // Step 3: Remove stage filters too
        if (allResults.length < MIN_RESULTS) {
          const broadest = applyFilters(investors, searchInput, [], [], [], dismissedIds);
          if (broadest.length > allResults.length) {
            allResults = broadest;
            loosened = true;
          }
        }
      }
    }

    // Deduplicate: remove recommended ids from allOthers
    const recIds = new Set(rec.map(r => r.id));
    const others = allResults.filter(inv => !recIds.has(inv.id));

    return {
      recommended: rec,
      allInvestors: others,
      filtersLoosened: loosened,
      totalCount: allResults.length,
    };
  }, [investors, dismissedIds, searchInput, selectedStages, selectedSectors, selectedLocations, userManuallyChangedFilters]);

  // ── Reveal contact (enrich) ───────────────────────
  const revealContact = useCallback(async (inv: Investor) => {
    setEnrichingIds(prev => new Set([...prev, inv.id]));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/enrich-investor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          first_name: inv.first_name || displayName(inv).split(" ")[0],
          last_name: inv.last_name || displayName(inv).split(" ").slice(1).join(" "),
          organization_name: inv.firm_name,
          investor_id: inv.id,
        }),
      });

      const data = await res.json();

      setInvestors(prev => prev.map(i => {
        if (i.id !== inv.id) return i;
        return {
          ...i,
          contact_email: data.email || i.contact_email,
          linkedin_url: data.linkedin_url || i.linkedin_url,
          is_enriched: true,
          last_enriched_at: new Date().toISOString(),
        };
      }));

      if (data.email) {
        toast.success("Contact info revealed");
      } else {
        toast("No email found for this contact", { description: "LinkedIn may still be available." });
      }
    } catch (err) {
      console.error("Enrichment error:", err);
      toast.error("Failed to reveal contact info");
    } finally {
      setEnrichingIds(prev => {
        const next = new Set(prev);
        next.delete(inv.id);
        return next;
      });
    }
  }, []);

  // ── Pipeline actions ───────────────────────────────
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

  const clearFilters = () => {
    setUserManuallyChangedFilters(true);
    setSelectedStages([]);
    setSelectedSectors([]);
    setSelectedLocations([]);
  };

  const hasFilters = selectedStages.length > 0 || selectedSectors.length > 0 || selectedLocations.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-foreground">Investor Discovery</h2>
        <p className="text-sm text-secondary-foreground">
          Browse curated investors matched to your stage, sector, and thesis.
        </p>
      </div>

      {/* Narrative selector */}
      {projects.length > 1 && (
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Match investors to narrative</label>
          <Select value={selectedProjectId || undefined} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-full max-w-xs h-9 text-sm">
              <SelectValue placeholder="Select a narrative..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title || "Untitled narrative"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, firm, or title..."
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setUserManuallyChangedFilters(true); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40 transition-colors"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {loading ? "Loading..." : `${totalCount} investors`}
        </span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-sm border transition-colors ${
            hasFilters ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
          }`}
        >
          <Filter className="h-4 w-4" /> Filters
          {hasFilters && (
            <span className="text-xs bg-electric text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">
              {selectedStages.length + selectedSectors.length + selectedLocations.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-5 p-4 rounded-sm border border-border card-gradient space-y-4 animate-fade-in">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Stage</label>
            <div className="flex flex-wrap gap-2">
              {STAGE_OPTIONS.map(s => (
                <button key={s.value} onClick={() => handleToggleStage(s.value)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedStages.includes(s.value) ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Sector / Industry</label>
            <div className="flex flex-wrap gap-2">
              {SECTOR_OPTIONS.map(s => (
                <button key={s.value} onClick={() => handleToggleSector(s.value)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedSectors.includes(s.value) ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Location</label>
            <div className="flex flex-wrap gap-2">
              {LOCATION_OPTIONS.map(l => (
                <button key={l.value} onClick={() => handleToggleLocation(l.value)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedLocations.includes(l.value) ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>{l.label}</button>
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

      {/* Loosened filters note */}
      {filtersLoosened && !userManuallyChangedFilters && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-sm border border-border bg-muted/20 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Showing broader results. Adjust filters to narrow down.
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && totalCount === 0 && recommended.length === 0 && (
        <div className="text-center py-12 border border-border rounded-sm card-gradient">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No investors match your filters.</p>
          <p className="text-xs text-muted-foreground">Try broadening your search or clearing filters.</p>
        </div>
      )}

      {/* Recommended section (top 6, strict filters) */}
      {!loading && recommended.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-electric" />
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Recommended for You</h3>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm font-bold">{recommended.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {recommended.map(inv => (
              <InvestorCard
                key={inv.id}
                inv={inv}
                inPipeline={pipelineIds.has(inv.id)}
                onAddToPipeline={() => addToPipeline(inv)}
                onRemoveFromPipeline={() => removeFromPipeline(inv)}
                onDismiss={() => dismissInvestor(inv)}
                onRevealContact={() => revealContact(inv)}
                isAdding={addingToPipeline === inv.id}
                isRemoving={removingFromPipeline === inv.id}
                isEnriching={enrichingIds.has(inv.id)}
                isRecommended
              />
            ))}
          </div>
        </div>
      )}

      {/* All investors (loosened filters) */}
      {!loading && allInvestors.length > 0 && (
        <div>
          {recommended.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">All Investors</h3>
              <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm font-bold">{allInvestors.length}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {allInvestors.map(inv => (
              <InvestorCard
                key={inv.id}
                inv={inv}
                inPipeline={pipelineIds.has(inv.id)}
                onAddToPipeline={() => addToPipeline(inv)}
                onRemoveFromPipeline={() => removeFromPipeline(inv)}
                onDismiss={() => dismissInvestor(inv)}
                onRevealContact={() => revealContact(inv)}
                isAdding={addingToPipeline === inv.id}
                isRemoving={removingFromPipeline === inv.id}
                isEnriching={enrichingIds.has(inv.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Investor Card ──────────────────────────────────────

function InvestorCard({ inv, inPipeline, onAddToPipeline, onRemoveFromPipeline, onDismiss, onRevealContact, isAdding, isRemoving, isEnriching, isRecommended }: {
  inv: Investor;
  inPipeline: boolean;
  onAddToPipeline: () => void;
  onRemoveFromPipeline: () => void;
  onDismiss: () => void;
  onRevealContact: () => void;
  isAdding: boolean;
  isRemoving: boolean;
  isEnriching: boolean;
  isRecommended?: boolean;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [fading, setFading] = useState(false);

  const enriched = isEnrichedRecently(inv);
  const name = displayName(inv);
  const checkSize = formatCheckSize(inv.check_min, inv.check_max);

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

  const hasContactRow = enriched || isEnriching || !enriched;

  return (
    <div className={`relative flex flex-col h-full p-5 rounded-sm border transition-all group ${
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

      {/* 1. Name + investor type badge — badge always right-aligned */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold text-foreground leading-tight truncate">{name}</h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide shrink-0 whitespace-nowrap ${TYPE_BADGE_STYLES[inv.investor_type] || "bg-electric/10 text-electric"}`}>
          {TYPE_LABELS[inv.investor_type] || inv.investor_type}
        </span>
      </div>

      {/* 2. Title */}
      {inv.title && (
        <p className="text-[11px] text-muted-foreground mb-1.5 truncate">{inv.title}</p>
      )}

      {/* 3. Firm (clickable link) + check size */}
      <p className="text-xs font-medium text-secondary-foreground mb-1">
        {inv.website_url ? (
          <a href={inv.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-electric transition-colors cursor-pointer">
            {inv.firm_name}
          </a>
        ) : inv.firm_name}
        {checkSize && <span className="text-muted-foreground font-normal"> · {checkSize}</span>}
      </p>

      {/* 4. Location */}
      {(inv.location_city || inv.location_state) && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
          <MapPin className="h-3 w-3 shrink-0" />
          {[inv.location_city, inv.location_state].filter(Boolean).join(", ")}
        </p>
      )}

      {/* 5. Stage tags */}
      {inv.stages && inv.stages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {inv.stages.map(s => (
            <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-sm border border-border text-secondary-foreground">
              {STAGE_LABELS[s] || s}
            </span>
          ))}
        </div>
      )}

      {/* 6. Sector tags + solo founder friendly inline */}
      {((inv.sectors && inv.sectors.length > 0) || inv.solo_founder_friendly) && (
        <div className="flex flex-wrap gap-1.5 mb-2 items-center">
          {inv.sectors?.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/40 text-muted-foreground">
              {SECTOR_LABELS[s] || s}
            </span>
          ))}
          {inv.sectors && inv.sectors.length > 3 && <span className="text-[10px] text-muted-foreground">+{inv.sectors.length - 3}</span>}
          {inv.solo_founder_friendly && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald/10 text-emerald flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Solo friendly
            </span>
          )}
        </div>
      )}

      {/* Spacer pushes contact row + actions to bottom */}
      <div className="flex-1" />

      {/* 8. Contact row: compact inline — no globe, firm name links to website */}
      <div className="mb-3">
        {enriched ? (
          <div className="flex items-center gap-2.5 flex-wrap">
            {inv.contact_email ? (
              <div className="flex items-center gap-1 min-w-0">
                <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                <a href={`mailto:${inv.contact_email}`} className="text-[10px] text-muted-foreground hover:text-electric transition-colors truncate max-w-[130px]" title={inv.contact_email}>
                  {inv.contact_email}
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(inv.contact_email!); toast.success("Email copied"); }}
                  className="p-0.5 text-muted-foreground/50 hover:text-electric transition-colors shrink-0"
                  title="Copy email"
                >
                  <Copy className="h-2.5 w-2.5" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground/50">No email found</span>
            )}
            {inv.linkedin_url && (
              <a href={inv.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-electric transition-colors" title="LinkedIn">
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ) : isEnriching ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : (
          <button
            onClick={onRevealContact}
            className="text-[11px] font-medium px-3 py-1.5 rounded-sm border border-border text-secondary-foreground hover:text-electric hover:border-electric/30 transition-colors flex items-center gap-1.5"
          >
            <Eye className="h-3 w-3" />
            Reveal Contact
          </button>
        )}
      </div>

      {/* 9. Actions pinned to bottom */}
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
