import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { Search, Filter, Sparkles, Building2, MapPin, Banknote } from "lucide-react";
import { toast } from "sonner";

const STAGES = ["Pre-seed", "Seed", "Series A", "Series B+"];
const CHECK_SIZES = ["$25K–$100K", "$100K–$500K", "$500K–$1M", "$1M+"];
const LOCATIONS = ["US", "SF", "NYC", "Remote", "International"];
const INDUSTRIES = ["SaaS", "Fintech", "AI", "Climate", "Consumer", "Marketplace", "Healthcare", "Crypto"];

const SAMPLE_INVESTORS = [
  { name: "Sarah Chen", firm: "Lux Ventures", stage: "Seed", checkSize: "$500K–$1M", location: "SF", industry: "AI", matchPct: 92 },
  { name: "Marcus Webb", firm: "Notation Capital", stage: "Pre-seed", checkSize: "$100K–$500K", location: "NYC", industry: "SaaS", matchPct: 87 },
  { name: "Priya Sharma", firm: "First Round", stage: "Series A", checkSize: "$1M+", location: "SF", industry: "Fintech", matchPct: 81 },
  { name: "David Park", firm: "Forerunner Ventures", stage: "Seed", checkSize: "$500K–$1M", location: "SF", industry: "Consumer", matchPct: 76 },
  { name: "Aisha Johnson", firm: "Susa Ventures", stage: "Seed", checkSize: "$100K–$500K", location: "SF", industry: "SaaS", matchPct: 74 },
  { name: "Tom Nguyen", firm: "Precursor Ventures", stage: "Pre-seed", checkSize: "$25K–$100K", location: "Remote", industry: "Marketplace", matchPct: 68 },
];

export default function Resources() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { subscribed, loading: subLoading } = useSubscription();

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth?next=/resources", { replace: true });
        return;
      }
      setReady(true);
    });
  }, [navigate]);

  useEffect(() => {
    if (ready && !subLoading && !subscribed) {
      toast.error("Resources requires a paid plan. Upgrade to access.");
      navigate("/dashboard", { replace: true });
    }
  }, [ready, subLoading, subscribed, navigate]);

  if (!ready || subLoading) return null;
  if (!subscribed) return null;

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const hasFilters = selectedStages.length + selectedSizes.length + selectedLocations.length + selectedIndustries.length > 0;

  const filtered = SAMPLE_INVESTORS.filter(inv => {
    if (search && !inv.name.toLowerCase().includes(search.toLowerCase()) && !inv.firm.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedStages.length && !selectedStages.includes(inv.stage)) return false;
    if (selectedSizes.length && !selectedSizes.includes(inv.checkSize)) return false;
    if (selectedLocations.length && !selectedLocations.includes(inv.location)) return false;
    if (selectedIndustries.length && !selectedIndustries.includes(inv.industry)) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 px-6 pt-16 pb-8">
        <div className="max-w-[1000px] mx-auto">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">Investor Database</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
            Find the right investors.
          </h1>
          <p className="text-base text-muted-foreground max-w-[550px] leading-relaxed mb-10">
            Search and filter investors by stage, check size, location, and industry focus.
          </p>

          <div className="border border-electric/20 rounded-sm p-6 mb-8 bg-card/50 glow-blue-subtle">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-electric" />
              <p className="text-sm font-medium text-foreground">AI Recommended Investors</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Generate a narrative first. We'll analyze your thesis, stage, and business model to surface high-fit investors with match confidence.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-sm font-medium hover:opacity-90 transition-opacity glow-blue"
            >
              Go to Dashboard
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search investors, firms, or industries..."
                className="w-full bg-card border border-border rounded-sm pl-11 pr-4 py-3 text-foreground text-sm focus:outline-none focus:border-electric/40 transition-colors placeholder:text-muted-foreground/40"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-sm text-sm transition-colors ${
                showFilters || hasFilters ? "border-electric/30 text-foreground bg-accent" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasFilters && (
                <span className="text-[10px] bg-electric text-primary-foreground px-1.5 py-0.5 rounded-sm font-medium">
                  {selectedStages.length + selectedSizes.length + selectedLocations.length + selectedIndustries.length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="border border-border rounded-sm p-6 mb-8 bg-card animate-fade-in space-y-5">
              <FilterGroup label="Stage" options={STAGES} selected={selectedStages} toggle={(v) => toggleFilter(selectedStages, setSelectedStages, v)} />
              <FilterGroup label="Check Size" options={CHECK_SIZES} selected={selectedSizes} toggle={(v) => toggleFilter(selectedSizes, setSelectedSizes, v)} />
              <FilterGroup label="Location" options={LOCATIONS} selected={selectedLocations} toggle={(v) => toggleFilter(selectedLocations, setSelectedLocations, v)} />
              <FilterGroup label="Industry" options={INDUSTRIES} selected={selectedIndustries} toggle={(v) => toggleFilter(selectedIndustries, setSelectedIndustries, v)} />
              {hasFilters && (
                <button onClick={() => { setSelectedStages([]); setSelectedSizes([]); setSelectedLocations([]); setSelectedIndustries([]); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((inv) => (
              <div key={inv.name} className="bg-card/50 border border-border rounded-sm p-5 hover:border-muted-foreground/20 hover:-translate-y-0.5 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-foreground">
                      {inv.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {inv.firm}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-electric tabular-nums">{inv.matchPct}%</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground">{inv.stage}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground flex items-center gap-0.5">
                    <Banknote className="h-2.5 w-2.5" />{inv.checkSize}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-sm border border-border text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />{inv.location}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[11px] text-muted-foreground">
                    Focus: {inv.industry} · Recent investments in early-stage tools
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, options, selected, toggle }: { label: string; options: string[]; selected: string[]; toggle: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt} onClick={() => toggle(opt)}
            className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
              selected.includes(opt)
                ? "border-electric/30 text-foreground bg-accent"
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
