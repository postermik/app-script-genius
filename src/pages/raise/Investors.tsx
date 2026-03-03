import { useState, useEffect, useMemo } from "react";
import { Search, Bookmark, BookmarkCheck, MapPin, ExternalLink, Filter, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDecksmith } from "@/context/DecksmithContext";

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
  micro_vc: "Micro VC",
  vc: "VC",
  accelerator: "Accelerator",
  angel: "Angel",
  corporate_vc: "Corporate VC",
};

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

function detectNarrativeFilters(output: any): { stages: string[]; sectors: string[] } {
  if (!output) return { stages: [], sectors: [] };
  const text = JSON.stringify(output).toLowerCase();
  const stages: string[] = [];
  const sectors: string[] = [];

  if (text.includes("pre-seed") || text.includes("pre_seed")) stages.push("pre_seed");
  if (text.includes("seed") && !text.includes("pre-seed") && !text.includes("pre_seed")) stages.push("seed");
  if (text.includes("series a")) stages.push("series_a");
  if (text.includes("series b")) stages.push("series_b");

  if (text.includes("artificial intelligence") || text.includes("machine learning") || text.includes("ai/ml") || text.includes("ai model")) sectors.push("ai_ml");
  if (text.includes("saas") || text.includes("software as a service")) sectors.push("saas");
  if (text.includes("fintech") || text.includes("financial technology")) sectors.push("fintech");
  if (text.includes("enterprise")) sectors.push("enterprise");
  if (text.includes("consumer")) sectors.push("consumer");
  if (text.includes("healthtech") || text.includes("health tech") || text.includes("healthcare")) sectors.push("healthtech");
  if (text.includes("edtech") || text.includes("education")) sectors.push("edtech");
  if (text.includes("marketplace")) sectors.push("marketplace");
  if (text.includes("creator")) sectors.push("creator_tools");

  return { stages: [...new Set(stages)], sectors: [...new Set(sectors)] };
}

export default function Investors() {
  const { output } = useDecksmith();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("rhetoric_saved_investors");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Filters
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedCheckSize, setSelectedCheckSize] = useState<number | null>(null);
  const [soloFriendly, setSoloFriendly] = useState(false);
  const [narrativeApplied, setNarrativeApplied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Auto-apply narrative filters on mount
  useEffect(() => {
    if (output && !narrativeApplied) {
      const detected = detectNarrativeFilters(output);
      if (detected.stages.length > 0 || detected.sectors.length > 0) {
        setSelectedStages(detected.stages);
        setSelectedSectors(detected.sectors);
        setNarrativeApplied(true);
      }
    }
  }, [output, narrativeApplied]);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

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
    setNarrativeApplied(false);
  };

  const hasFilters = selectedStages.length > 0 || selectedSectors.length > 0 || selectedCheckSize !== null || soloFriendly;

  const filtered = useMemo(() => {
    return investors.filter(inv => {
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
  }, [investors, search, selectedStages, selectedSectors, selectedCheckSize, soloFriendly]);

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
      {narrativeApplied && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-sm border border-electric/20 bg-electric/5">
          <Sparkles className="h-4 w-4 text-electric shrink-0" />
          <p className="text-sm text-foreground/80 flex-1">
            Showing investors matched to your latest narrative.
            <button onClick={clearFilters} className="ml-2 text-electric hover:underline text-sm font-medium">Clear auto-filters</button>
          </p>
        </div>
      )}

      {/* Search + filter toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search firms, sectors, keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-sm border transition-colors ${
            hasFilters ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasFilters && <span className="text-xs bg-electric text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">{selectedStages.length + selectedSectors.length + (selectedCheckSize !== null ? 1 : 0) + (soloFriendly ? 1 : 0)}</span>}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-5 p-4 rounded-sm border border-border card-gradient space-y-4 animate-fade-in">
          {/* Stage */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Stage</label>
            <div className="flex flex-wrap gap-2">
              {STAGE_OPTIONS.map(s => (
                <button key={s.value} onClick={() => toggleFilter(selectedStages, s.value, setSelectedStages)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedStages.includes(s.value) ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Sector</label>
            <div className="flex flex-wrap gap-2">
              {SECTOR_OPTIONS.map(s => (
                <button key={s.value} onClick={() => toggleFilter(selectedSectors, s.value, setSelectedSectors)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedSectors.includes(s.value) ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Check Size */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Check Size</label>
            <div className="flex flex-wrap gap-2">
              {CHECK_SIZE_RANGES.map((r, idx) => (
                <button key={idx} onClick={() => setSelectedCheckSize(selectedCheckSize === idx ? null : idx)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                    selectedCheckSize === idx ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Solo Founder + Clear */}
          <div className="flex items-center justify-between">
            <button onClick={() => setSoloFriendly(!soloFriendly)}
              className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                soloFriendly ? "border-electric/40 text-electric bg-electric/10" : "border-border text-secondary-foreground hover:text-foreground"
              }`}>
              Solo Founder Friendly
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">{filtered.length} investor{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 border border-border rounded-sm card-gradient">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No investors match your filters.</p>
          <p className="text-xs text-muted-foreground">Try broadening your search or clearing filters.</p>
        </div>
      )}

      {/* Investor grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(inv => (
            <div key={inv.id} className="p-5 rounded-sm border border-border card-gradient hover:border-muted-foreground/20 transition-colors">
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
                  <button onClick={() => toggleSave(inv.id)}
                    className={`p-1.5 rounded-sm transition-colors ${savedIds.has(inv.id) ? "text-electric bg-electric/10" : "text-muted-foreground hover:text-electric hover:bg-electric/5"}`}
                    title={savedIds.has(inv.id) ? "Saved" : "Save"}>
                    {savedIds.has(inv.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Stages */}
              {inv.stages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {inv.stages.map(s => {
                    const label = STAGE_OPTIONS.find(o => o.value === s)?.label || s;
                    return (
                      <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-sm border border-border text-secondary-foreground">
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Check size */}
              <p className="text-xs text-secondary-foreground mb-2">
                <span className="text-muted-foreground">Check size:</span> {formatCheckSize(inv.check_size_min, inv.check_size_max)}
              </p>

              {/* Description */}
              {inv.description && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{inv.description}</p>
              )}

              {/* Sectors */}
              {inv.sectors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {inv.sectors.slice(0, 5).map(s => {
                    const label = SECTOR_OPTIONS.find(o => o.value === s)?.label || s;
                    return (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/40 text-muted-foreground">
                        {label}
                      </span>
                    );
                  })}
                  {inv.sectors.length > 5 && <span className="text-[10px] text-muted-foreground">+{inv.sectors.length - 5}</span>}
                </div>
              )}

              {/* Solo founder + links */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3">
                  {inv.solo_founder_friendly && (
                    <span className="text-[10px] font-medium text-emerald">✓ Solo founder friendly</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {inv.website_url && (
                    <a href={inv.website_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-electric flex items-center gap-1 transition-colors">
                      <ExternalLink className="h-3 w-3" /> Website
                    </a>
                  )}
                  {inv.application_url && (
                    <a href={inv.application_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-electric hover:underline font-medium">
                      Apply
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
