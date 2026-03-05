import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, MapPin, Filter, X, Sparkles, ArrowRight, Check, Linkedin, Globe, Mail, Copy, Loader2, ChevronDown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────

interface Investor {
  id: string;
  first_name: string;
  last_name: string;
  contact_name: string;
  contact_email: string | null;
  linkedin_url: string | null;
  title: string | null;
  firm_name: string;
  website_url: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  investor_type: string;
  apollo_id: string | null;
  // Fields from DB (for legacy/cached results)
  stages?: string[];
  sectors?: string[];
  check_size_min?: number | null;
  check_size_max?: number | null;
  application_url?: string | null;
  solo_founder_friendly?: boolean;
  is_active?: boolean;
}

interface NarrativeSignals {
  stages: string[];
  sectors: string[];
  location: string | null;
  rawInput: string;
}

interface PaginationInfo {
  page: number;
  per_page: number;
  total_entries: number;
  total_pages: number;
}

// ── Constants ──────────────────────────────────────────

const SUPABASE_URL = "https://jilopuugwyrqogoxlxjo.supabase.co";
const ANON_KEY = "sb_publishable_IdoGcGM61fuk6JhT88wOeg_JlwFjtxz";

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

const LOCATION_OPTIONS = [
  { value: "San Francisco, California, United States", label: "San Francisco" },
  { value: "New York, New York, United States", label: "New York" },
  { value: "Los Angeles, California, United States", label: "Los Angeles" },
  { value: "Boston, Massachusetts, United States", label: "Boston" },
  { value: "Austin, Texas, United States", label: "Austin" },
  { value: "Chicago, Illinois, United States", label: "Chicago" },
  { value: "Seattle, Washington, United States", label: "Seattle" },
  { value: "Miami, Florida, United States", label: "Miami" },
  { value: "London, England, United Kingdom", label: "London" },
];

const TYPE_LABELS: Record<string, string> = {
  micro_vc: "Micro VC", vc: "VC", accelerator: "Accelerator", angel: "Angel", corporate_vc: "Corporate VC",
};

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(SECTOR_OPTIONS.map(s => [s.value, s.label]));
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGE_OPTIONS.map(s => [s.value, s.label]));

// ── Narrative signal extraction ────────────────────────

function extractNarrativeSignals(outputData: any, rawInput: string): NarrativeSignals {
  const text = `${JSON.stringify(outputData || "")} ${rawInput}`.toLowerCase();
  const stages: string[] = [];
  const sectors: string[] = [];
  let location: string | null = null;

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

  // Try to extract location
  if (text.includes("new york") || text.includes("nyc")) location = "New York, New York, United States";
  else if (text.includes("san francisco") || text.includes("sf") || text.includes("bay area")) location = "San Francisco, California, United States";
  else if (text.includes("los angeles") || text.includes("la")) location = "Los Angeles, California, United States";
  else if (text.includes("boston")) location = "Boston, Massachusetts, United States";
  else if (text.includes("austin")) location = "Austin, Texas, United States";

  return { stages: [...new Set(stages)], sectors: [...new Set(sectors)], location, rawInput };
}

// ── Component ──────────────────────────────────────────

export default function Investors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelineIds, setPipelineIds] = useState<Set<string>>(new Set());
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null);
  const [removingFromPipeline, setRemovingFromPipeline] = useState<string | null>(null);
  const [narrativeSignals, setNarrativeSignals] = useState<NarrativeSignals | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [apolloAvailable, setApolloAvailable] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Filters
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchParams = useRef<string>("");

  // ── Init: load user, narrative, pipeline ───────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

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
        // Auto-set filters from narrative
        if (signals.sectors.length > 0) setSelectedSectors(signals.sectors);
        if (signals.location) setSelectedLocations([signals.location]);
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

  // ── Search Apollo ──────────────────────────────────
  const searchInvestors = useCallback(async (page = 1, append = false) => {
    const params = JSON.stringify({ selectedSectors, selectedLocations, searchQuery, page });

    // Don't re-search with same params (unless appending for pagination)
    if (!append && params === lastSearchParams.current && investors.length > 0) return;
    lastSearchParams.current = params;

    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/search-investors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          sectors: selectedSectors,
          locations: selectedLocations,
          keywords: searchQuery || undefined,
          page,
          per_page: 50,
        }),
      });

      if (!res.ok) {
        console.error("Search failed:", res.status);
        // Fall back to DB
        await loadFromDB();
        return;
      }

      const data = await res.json();

      if (data.skipped) {
        setApolloAvailable(false);
        await loadFromDB();
        return;
      }

      if (data.people && data.people.length > 0) {
        const mapped: Investor[] = data.people.map((p: any, idx: number) => ({
          id: p.apollo_id || `apollo-${page}-${idx}`,
          ...p,
          stages: [],
          sectors: [],
          check_size_min: null,
          check_size_max: null,
          application_url: null,
          solo_founder_friendly: false,
          is_active: true,
        }));

        if (append) {
          setInvestors(prev => [...prev, ...mapped]);
        } else {
          setInvestors(mapped);
        }
        setPagination(data.pagination || null);
      } else if (page === 1) {
        setInvestors([]);
        setPagination(null);
      }
    } catch (err) {
      console.error("Search error:", err);
      await loadFromDB();
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedSectors, selectedLocations, searchQuery]);

  // ── Fallback: load from DB ─────────────────────────
  const loadFromDB = async () => {
    const { data, error } = await supabase
      .from("investors")
      .select("*")
      .eq("is_active", true)
      .order("firm_name");
    if (!error && data) {
      setInvestors(data.map((d: any) => ({
        id: d.id,
        first_name: d.contact_name?.split(" ")[0] || "",
        last_name: d.contact_name?.split(" ").slice(1).join(" ") || "",
        contact_name: d.contact_name || d.firm_name,
        contact_email: d.contact_email || null,
        linkedin_url: d.linkedin_url || null,
        title: null,
        firm_name: d.firm_name,
        website_url: d.website_url || null,
        location_city: d.location_city || null,
        location_state: d.location_state || null,
        location_country: d.location_country || null,
        investor_type: d.investor_type || "vc",
        apollo_id: null,
        stages: d.stages || [],
        sectors: d.sectors || [],
        check_size_min: d.check_size_min || null,
        check_size_max: d.check_size_max || null,
        application_url: d.application_url || null,
        solo_founder_friendly: d.solo_founder_friendly || false,
        is_active: true,
      })));
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // ── Trigger search when filters change ─────────────
  useEffect(() => {
    // Wait for narrative signals to load before first search
    searchInvestors(1, false);
  }, [selectedSectors, selectedLocations, searchQuery, searchInvestors]);

  // ── Debounced search input ─────────────────────────
  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val);
    }, 500);
  };

  // ── Load more ──────────────────────────────────────
  const handleLoadMore = () => {
    if (!pagination || pagination.page >= pagination.total_pages) return;
    searchInvestors(pagination.page + 1, true);
  };

  // ── Pipeline actions ───────────────────────────────
  const addToPipeline = useCallback(async (inv: Investor) => {
    if (!userId) return;
    setAddingToPipeline(inv.id);
    const { error } = await supabase.from("pipeline_entries").insert({
      user_id: userId,
      investor_id: inv.id.startsWith("apollo-") ? null : inv.id,
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
    setSelectedLocations([]);
  };

  const hasFilters = selectedStages.length > 0 || selectedSectors.length > 0 || selectedLocations.length > 0;

  // ── Split results: recommended (first 6 not dismissed) + rest ───
  const visibleInvestors = useMemo(() => {
    return investors.filter(i => !dismissedIds.has(i.id));
  }, [investors, dismissedIds]);

  const recommended = visibleInvestors.slice(0, 6);
  const allOthers = visibleInvestors.slice(6);
  const totalCount = visibleInvestors.length;

  const hasMore = pagination && pagination.page < pagination.total_pages;

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-foreground">Investor Discovery</h2>
        <p className="text-sm text-secondary-foreground">
          {apolloAvailable
            ? "Search real investors matched to your stage, sector, and thesis."
            : "Showing cached investors. Connect Apollo to discover more."}
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, firm, sector, keywords..."
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40 transition-colors"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {loading ? "Searching..." : `${totalCount} found`}
          {pagination && pagination.total_entries > 0 && ` of ${pagination.total_entries.toLocaleString()}`}
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
      <p className="text-[10px] text-muted-foreground/60 mb-4">Contact information is sourced from public data and may not be current.</p>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-5 p-4 rounded-sm border border-border card-gradient space-y-4 animate-fade-in">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Sector / Industry</label>
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Location</label>
            <div className="flex flex-wrap gap-2">
              {LOCATION_OPTIONS.map(l => (
                <button key={l.value} onClick={() => toggleFilter(selectedLocations, l.value, setSelectedLocations)}
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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && totalCount === 0 && (
        <div className="text-center py-12 border border-border rounded-sm card-gradient">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No investors match your search.</p>
          <p className="text-xs text-muted-foreground">Try broadening your keywords or clearing filters.</p>
        </div>
      )}

      {/* Recommended section (first 6) */}
      {!loading && recommended.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-electric" />
            <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-electric">Recommended for You</h3>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm font-bold">{recommended.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map(inv => (
              <InvestorCard
                key={inv.id}
                inv={inv}
                inPipeline={pipelineIds.has(inv.id)}
                onAddToPipeline={() => addToPipeline(inv)}
                onRemoveFromPipeline={() => removeFromPipeline(inv)}
                onDismiss={() => dismissInvestor(inv)}
                isAdding={addingToPipeline === inv.id}
                isRemoving={removingFromPipeline === inv.id}
                isRecommended
              />
            ))}
          </div>
        </div>
      )}

      {/* All investors */}
      {!loading && allOthers.length > 0 && (
        <div>
          {recommended.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">All Investors</h3>
              <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm font-bold">{allOthers.length}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allOthers.map(inv => (
              <InvestorCard
                key={inv.id}
                inv={inv}
                inPipeline={pipelineIds.has(inv.id)}
                onAddToPipeline={() => addToPipeline(inv)}
                onRemoveFromPipeline={() => removeFromPipeline(inv)}
                onDismiss={() => dismissInvestor(inv)}
                isAdding={addingToPipeline === inv.id}
                isRemoving={removingFromPipeline === inv.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Load more button */}
      {!loading && hasMore && (
        <div className="flex justify-center mt-8 mb-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-sm border border-border text-secondary-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {loadingMore ? "Loading..." : `Load more investors (${pagination?.total_entries ? (pagination.total_entries - investors.length).toLocaleString() : ""} remaining)`}
          </button>
        </div>
      )}

      {/* Apollo fallback notice */}
      {!apolloAvailable && !loading && (
        <div className="mt-6 p-4 rounded-sm border border-border bg-muted/20 text-center">
          <p className="text-sm text-muted-foreground">
            🔌 <strong>Connect Apollo</strong> to discover 200+ real investors with verified contact info.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add your Apollo API key to unlock live investor search.</p>
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

      {/* Person name + title */}
      <div className="flex items-start justify-between gap-3 mb-2 pr-5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <h3 className="text-sm font-bold text-foreground leading-tight">{inv.contact_name}</h3>
          </div>
          {inv.title && (
            <p className="text-[11px] text-muted-foreground mt-0.5 ml-5">{inv.title}</p>
          )}
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-sm bg-electric/10 text-electric uppercase tracking-wide shrink-0">
          {TYPE_LABELS[inv.investor_type] || inv.investor_type}
        </span>
      </div>

      {/* Firm name */}
      <p className="text-xs font-medium text-secondary-foreground mb-1">{inv.firm_name}</p>

      {/* Location */}
      {(inv.location_city || inv.location_state) && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <MapPin className="h-3 w-3 shrink-0" />
          {[inv.location_city, inv.location_state].filter(Boolean).join(", ")}
        </p>
      )}

      {/* Stage tags (if available from DB) */}
      {inv.stages && inv.stages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {inv.stages.map(s => (
            <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-sm border border-border text-secondary-foreground">
              {STAGE_LABELS[s] || s}
            </span>
          ))}
        </div>
      )}

      {/* Sector tags (if available from DB) */}
      {inv.sectors && inv.sectors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {inv.sectors.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/40 text-muted-foreground">
              {SECTOR_LABELS[s] || s}
            </span>
          ))}
          {inv.sectors.length > 3 && <span className="text-[10px] text-muted-foreground">+{inv.sectors.length - 3}</span>}
        </div>
      )}

      {/* Contact info row */}
      {hasContact ? (
        <div className="flex items-center gap-2 mb-3">
          {inv.contact_email && (
            <div className="flex items-center gap-1">
              <a href={`mailto:${inv.contact_email}`} className="text-[10px] text-muted-foreground hover:text-electric transition-colors truncate max-w-[140px]" title={inv.contact_email}>
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
