import { useState, useEffect, useCallback, useRef } from "react";
import {
  GitGraph, Plus, GripVertical, LayoutGrid, List, X,
  Search, ExternalLink, Calendar, Clock, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────

interface PipelineEntry {
  id: string;
  user_id: string;
  investor_id: string | null;
  firm_name: string;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  contact_linkedin: string | null;
  intro_source: string | null;
  first_touch_date: string | null;
  outreach_method: string | null;
  status: string;
  interest_level: string;
  meeting_date: string | null;
  meeting_notes: string | null;
  next_steps: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

interface DirectoryInvestor {
  id: string;
  firm_name: string;
  investor_type: string;
  location_city: string | null;
}

type ViewMode = "kanban" | "list";

// ── Constants ──────────────────────────────────────────

const STATUSES = [
  { value: "researching", label: "Researching", color: "text-muted-foreground" },
  { value: "contacted", label: "Contacted", color: "text-blue-400" },
  { value: "responded", label: "Responded", color: "text-purple-400" },
  { value: "meeting_scheduled", label: "Meeting", color: "text-amber-400" },
  { value: "term_sheet", label: "Term Sheet", color: "text-emerald" },
  { value: "closed", label: "Closed", color: "text-green-400" },
];

const INTEREST_LEVELS = [
  { value: "unknown", label: "Unknown", dot: "bg-muted-foreground" },
  { value: "cold", label: "Cold", dot: "bg-muted-foreground" },
  { value: "warm", label: "Warm", dot: "bg-amber-400" },
  { value: "hot", label: "Hot", dot: "bg-green-400" },
];

const STATUS_VALUES = STATUSES.map(s => s.value);

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function interestDot(level: string) {
  return INTEREST_LEVELS.find(i => i.value === level)?.dot || "bg-muted-foreground";
}

// ── Component ──────────────────────────────────────────

export default function Pipeline() {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [addOpen, setAddOpen] = useState(false);
  const [dragEntry, setDragEntry] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Data loading ──

  const loadEntries = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);
    const { data, error } = await supabase
      .from("pipeline_entries")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setEntries(data as PipelineEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── Actions ──

  const updateStatus = async (entryId: string, newStatus: string) => {
    const { error } = await supabase
      .from("pipeline_entries")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", entryId);
    if (error) { toast.error("Failed to update status"); return; }
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: newStatus, updated_at: new Date().toISOString() } : e));
  };

  const deleteEntry = async (entryId: string) => {
    await supabase.from("pipeline_entries").delete().eq("id", entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
    toast.success("Removed from pipeline");
  };

  const addEntry = async (entry: Partial<PipelineEntry>) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("pipeline_entries")
      .insert({ ...entry, user_id: userId, status: "researching", interest_level: "unknown" })
      .select()
      .single();
    if (error) { toast.error("Failed to add entry"); return; }
    setEntries(prev => [data as PipelineEntry, ...prev]);
    setAddOpen(false);
    toast.success("Added to pipeline");
  };

  // ── Drag handlers ──

  const handleDragStart = (id: string) => setDragEntry(id);
  const handleDragEnd = () => setDragEntry(null);
  const handleDrop = (status: string) => {
    if (dragEntry) {
      updateStatus(dragEntry, status);
      setDragEntry(null);
    }
  };

  // ── Render ──

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-electric/10">
            <GitGraph className="h-4 w-4 text-electric" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Pipeline</h2>
            <p className="text-sm text-secondary-foreground">
              {entries.length} investor{entries.length !== 1 ? "s" : ""} in your pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-sm">
            <button onClick={() => setViewMode("kanban")}
              className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-electric/10 text-electric" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-electric/10 text-electric" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-electric text-primary-foreground rounded-sm hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Investor
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && viewMode === "kanban" && (
        <KanbanBoard entries={entries} onDragStart={handleDragStart} onDragEnd={handleDragEnd}
          onDrop={handleDrop} dragEntry={dragEntry} onDelete={deleteEntry} onUpdateStatus={updateStatus} />
      )}

      {!loading && viewMode === "list" && (
        <ListView entries={entries} onDelete={deleteEntry} onUpdateStatus={updateStatus} />
      )}

      {addOpen && <AddInvestorModal onClose={() => setAddOpen(false)} onAdd={addEntry} />}
    </div>
  );
}

// ── Kanban Board ──────────────────────────────────────

function KanbanBoard({ entries, onDragStart, onDragEnd, onDrop, dragEntry, onDelete, onUpdateStatus }: {
  entries: PipelineEntry[];
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (status: string) => void;
  dragEntry: string | null;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
      {STATUSES.map(col => {
        const colEntries = entries.filter(e => e.status === col.value);
        return (
          <div key={col.value}
            className={`flex-shrink-0 w-[200px] rounded-sm border transition-colors ${
              dragEntry ? "border-electric/20 bg-electric/5" : "border-border"
            }`}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(col.value)}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b border-border">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-wide ${col.color}`}>{col.label}</span>
                <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-sm font-bold">{colEntries.length}</span>
              </div>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[120px]">
              {colEntries.map(entry => (
                <KanbanCard key={entry.id} entry={entry}
                  onDragStart={() => onDragStart(entry.id)}
                  onDragEnd={onDragEnd}
                  onDelete={() => onDelete(entry.id)} />
              ))}
              {colEntries.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-6">Drop here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ entry, onDragStart, onDragEnd, onDelete }: {
  entry: PipelineEntry; onDragStart: () => void; onDragEnd: () => void; onDelete: () => void;
}) {
  const days = daysSince(entry.updated_at);
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      className="p-3 rounded-sm border border-border card-gradient cursor-grab hover:border-muted-foreground/20 transition-colors group">
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <h4 className="text-xs font-semibold text-foreground leading-tight line-clamp-1">{entry.firm_name}</h4>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5">
          <X className="h-3 w-3" />
        </button>
      </div>
      {entry.contact_name && (
        <p className="text-[10px] text-secondary-foreground line-clamp-1 mb-1.5">{entry.contact_name}{entry.contact_title ? ` · ${entry.contact_title}` : ""}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${interestDot(entry.interest_level)}`} />
          <span className="text-[10px] text-muted-foreground capitalize">{entry.interest_level}</span>
        </div>
        {days !== null && (
          <span className={`text-[10px] flex items-center gap-0.5 ${days > 7 ? "text-amber-400" : "text-muted-foreground"}`}>
            <Clock className="h-2.5 w-2.5" /> {days}d
          </span>
        )}
      </div>
    </div>
  );
}

// ── List View ─────────────────────────────────────────

function ListView({ entries, onDelete, onUpdateStatus }: {
  entries: PipelineEntry[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Firm</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Contact</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Status</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Interest</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Last Activity</th>
            <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wide"></th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr><td colSpan={6} className="text-center text-muted-foreground text-xs py-12">No investors in your pipeline yet.</td></tr>
          )}
          {entries.map(entry => {
            const days = daysSince(entry.updated_at);
            const statusObj = STATUSES.find(s => s.value === entry.status);
            return (
              <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{entry.firm_name}</p>
                  {entry.intro_source && <p className="text-[10px] text-muted-foreground">via {entry.intro_source}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-secondary-foreground">{entry.contact_name || "-"}</p>
                  {entry.contact_title && <p className="text-[10px] text-muted-foreground">{entry.contact_title}</p>}
                </td>
                <td className="px-4 py-3">
                  <StatusDropdown value={entry.status} onChange={(s) => onUpdateStatus(entry.id, s)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${interestDot(entry.interest_level)}`} />
                    <span className="text-xs text-secondary-foreground capitalize">{entry.interest_level}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {days !== null && (
                    <span className={`text-xs ${days > 7 ? "text-amber-400" : "text-muted-foreground"}`}>{days}d ago</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onDelete(entry.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusDropdown({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = STATUSES.find(s => s.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`text-xs px-2 py-1 rounded-sm border border-border flex items-center gap-1 transition-colors hover:border-muted-foreground/30 ${current?.color || ""}`}>
        {current?.label || value} <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-40 bg-card border border-border rounded-sm shadow-lg z-30 animate-fade-in">
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => { onChange(s.value); setOpen(false); }}
              className={`w-full text-left text-xs px-3 py-2 hover:bg-accent transition-colors font-medium ${s.color}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Investor Modal ────────────────────────────────

function AddInvestorModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (entry: Partial<PipelineEntry>) => void;
}) {
  const [tab, setTab] = useState<"directory" | "manual">("directory");
  const [search, setSearch] = useState("");
  const [dirInvestors, setDirInvestors] = useState<DirectoryInvestor[]>([]);
  const [dirLoading, setDirLoading] = useState(false);

  // Manual form
  const [firmName, setFirmName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [introSource, setIntroSource] = useState("");

  useEffect(() => {
    if (tab === "directory") {
      setDirLoading(true);
      supabase.from("investors").select("id, firm_name, investor_type, location_city")
        .eq("is_active", true).order("firm_name").then(({ data }) => {
          setDirInvestors((data || []) as DirectoryInvestor[]);
          setDirLoading(false);
        });
    }
  }, [tab]);

  const filteredDir = dirInvestors.filter(i =>
    i.firm_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddFromDir = (inv: DirectoryInvestor) => {
    onAdd({ investor_id: inv.id, firm_name: inv.firm_name });
  };

  const handleManualAdd = () => {
    if (!firmName.trim()) { toast.error("Firm name is required"); return; }
    onAdd({
      firm_name: firmName.trim(),
      contact_name: contactName.trim() || null,
      contact_title: contactTitle.trim() || null,
      contact_email: contactEmail.trim() || null,
      intro_source: introSource.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-sm w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Add to Pipeline</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button onClick={() => setTab("directory")}
            className={`flex-1 text-xs font-medium py-3 transition-colors ${tab === "directory" ? "text-electric border-b-2 border-electric" : "text-muted-foreground hover:text-foreground"}`}>
            From Directory
          </button>
          <button onClick={() => setTab("manual")}
            className={`flex-1 text-xs font-medium py-3 transition-colors ${tab === "manual" ? "text-electric border-b-2 border-electric" : "text-muted-foreground hover:text-foreground"}`}>
            Manual Entry
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "directory" && (
            <div>
              <div className="relative mb-4">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search investors..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40" />
              </div>
              {dirLoading && <p className="text-xs text-muted-foreground text-center py-8">Loading...</p>}
              {!dirLoading && filteredDir.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No investors found. Try manual entry.</p>
              )}
              <div className="space-y-1.5">
                {filteredDir.map(inv => (
                  <button key={inv.id} onClick={() => handleAddFromDir(inv)}
                    className="w-full text-left px-4 py-3 rounded-sm border border-border hover:border-electric/30 hover:bg-electric/5 transition-colors">
                    <p className="text-sm font-medium text-foreground">{inv.firm_name}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.investor_type}{inv.location_city ? ` · ${inv.location_city}` : ""}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "manual" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Firm Name *</label>
                <input type="text" value={firmName} onChange={e => setFirmName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40"
                  placeholder="e.g. Sequoia Capital" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Name</label>
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40"
                    placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                  <input type="text" value={contactTitle} onChange={e => setContactTitle(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40"
                    placeholder="Partner" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40"
                  placeholder="jane@sequoia.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Intro Source</label>
                <input type="text" value={introSource} onChange={e => setIntroSource(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40"
                  placeholder="Warm intro via Alex" />
              </div>
              <button onClick={handleManualAdd}
                className="w-full py-2.5 bg-electric text-primary-foreground rounded-sm font-medium text-sm hover:opacity-90 transition-opacity">
                Add to Pipeline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
