import { useState, useEffect, useCallback } from "react";
import {
  FolderLock, Plus, Copy, Check, ExternalLink, Eye, Clock,
  Users, X, Lock, Unlock, Trash2, ToggleLeft, ToggleRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DataRoomRow {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  is_active: boolean;
  password_protected: boolean;
  included_projects: string[];
  custom_intro: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectOption {
  id: string;
  title: string;
  mode: string;
  updated_at: string;
}

interface ViewStats {
  total: number;
  unique: number;
  avgDuration: number;
  recentViews: { viewer_email: string | null; viewed_at: string; duration_seconds: number | null }[];
}

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
}

export default function DataRoom() {
  const [rooms, setRooms] = useState<DataRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [viewStats, setViewStats] = useState<Record<string, ViewStats>>({});

  const loadRooms = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);
    const { data, error } = await supabase
      .from("data_rooms")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setRooms(data.map((d: any) => ({ ...d, included_projects: d.included_projects || [] })));
    setLoading(false);
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  const loadViewStats = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from("data_room_views")
      .select("viewer_email, viewed_at, duration_seconds")
      .eq("data_room_id", roomId)
      .order("viewed_at", { ascending: false })
      .limit(50);
    if (data) {
      const unique = new Set(data.map(v => v.viewer_email || "anonymous")).size;
      const durations = data.filter(v => v.duration_seconds).map(v => v.duration_seconds!);
      const avg = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      setViewStats(prev => ({
        ...prev,
        [roomId]: { total: data.length, unique, avgDuration: avg, recentViews: data.slice(0, 10) as any },
      }));
    }
  }, []);

  useEffect(() => {
    if (selectedRoom) loadViewStats(selectedRoom);
  }, [selectedRoom, loadViewStats]);

  const deleteRoom = async (id: string) => {
    await supabase.from("data_rooms").delete().eq("id", id);
    setRooms(prev => prev.filter(r => r.id !== id));
    if (selectedRoom === id) setSelectedRoom(null);
    toast.success("Data room deleted");
  };

  const toggleActive = async (room: DataRoomRow) => {
    const { error } = await supabase.from("data_rooms").update({ is_active: !room.is_active }).eq("id", room.id);
    if (!error) {
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_active: !r.is_active } : r));
      toast.success(room.is_active ? "Data room deactivated" : "Data room activated");
    }
  };

  const createRoom = async (data: { title: string; included_projects: string[]; custom_intro: string; password: string }) => {
    if (!userId) return;
    const slug = generateSlug();
    const { data: row, error } = await supabase
      .from("data_rooms")
      .insert({
        user_id: userId,
        title: data.title,
        slug,
        included_projects: data.included_projects,
        custom_intro: data.custom_intro || null,
        password_protected: !!data.password,
        password_hash: data.password || null,
      })
      .select()
      .single();
    if (error) { toast.error("Failed to create data room"); return; }
    setRooms(prev => [{ ...(row as any), included_projects: (row as any).included_projects || [] }, ...prev]);
    setCreateOpen(false);
    toast.success("Data room created!");
  };

  const roomUrl = (slug: string) => `${window.location.origin}/room/${slug}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-electric/10">
            <FolderLock className="h-4 w-4 text-electric" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Data Room</h2>
            <p className="text-sm text-secondary-foreground">Create shareable links for investor due diligence.</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-electric text-primary-foreground rounded-sm hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Create Data Room
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <div className="text-center py-16 border border-border rounded-sm card-gradient">
          <FolderLock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No data rooms yet.</p>
          <p className="text-xs text-muted-foreground">Create one to share your pitch materials with investors.</p>
        </div>
      )}

      {!loading && rooms.length > 0 && (
        <div className="space-y-4">
          {rooms.map(room => {
            const stats = viewStats[room.id];
            const isExpanded = selectedRoom === room.id;
            return (
              <div key={room.id} className="border border-border rounded-sm card-gradient">
                {/* Room header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground">{room.title}</h3>
                        {room.password_protected && <Lock className="h-3 w-3 text-muted-foreground" />}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${room.is_active ? "bg-emerald/10 text-emerald" : "bg-muted/40 text-muted-foreground"}`}>
                          {room.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{room.included_projects.length} project{room.included_projects.length !== 1 ? "s" : ""} included</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => toggleActive(room)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title={room.is_active ? "Deactivate" : "Activate"}>
                        {room.is_active ? <ToggleRight className="h-4 w-4 text-emerald" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                      <button onClick={() => deleteRoom(room.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Shareable link */}
                  <CopyLinkRow url={roomUrl(room.slug)} />

                  {/* Quick stats + expand */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                      {stats && (
                        <>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {stats.total} views</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {stats.unique} unique</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {stats.avgDuration}s avg</span>
                        </>
                      )}
                    </div>
                    <button onClick={() => { setSelectedRoom(isExpanded ? null : room.id); }}
                      className="text-xs text-electric hover:underline font-medium">
                      {isExpanded ? "Hide analytics" : "View analytics"}
                    </button>
                  </div>
                </div>

                {/* Expanded analytics */}
                {isExpanded && stats && (
                  <div className="border-t border-border p-5 animate-fade-in">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">View History</h4>
                    {stats.recentViews.length === 0 && (
                      <p className="text-xs text-muted-foreground py-4 text-center">No views yet. Share the link to start tracking.</p>
                    )}
                    {stats.recentViews.length > 0 && (
                      <div className="space-y-2">
                        {stats.recentViews.map((v, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <div>
                              <p className="text-xs text-foreground">{v.viewer_email || "Anonymous viewer"}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(v.viewed_at).toLocaleString()}</p>
                            </div>
                            {v.duration_seconds && (
                              <span className="text-xs text-muted-foreground">{v.duration_seconds}s</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {createOpen && <CreateDataRoomModal onClose={() => setCreateOpen(false)} onCreate={createRoom} />}
    </div>
  );
}

// ── Copy Link Row ──────────────────────────────────────

function CopyLinkRow({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-sm bg-muted/20 border border-border">
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-foreground truncate flex-1 font-mono">{url}</span>
      <button onClick={copy}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-sm bg-electric/10 text-electric border border-electric/20 hover:bg-electric/15 transition-colors shrink-0">
        {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
      </button>
    </div>
  );
}

// ── Create Data Room Modal ─────────────────────────────

function CreateDataRoomModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: { title: string; included_projects: string[]; custom_intro: string; password: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customIntro, setCustomIntro] = useState("");
  const [password, setPassword] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    supabase.from("projects").select("id, title, mode, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setProjects((data || []) as ProjectOption[]);
        setLoadingProjects(false);
      });
  }, []);

  const toggleProject = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (selected.size === 0) { toast.error("Select at least one project"); return; }
    onCreate({ title: title.trim(), included_projects: [...selected], custom_intro: customIntro.trim(), password: password.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-sm w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Create Data Room</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Room Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40"
              placeholder="e.g. Series A Materials — Q1 2026" />
          </div>

          {/* Project selection */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Include Projects * <span className="text-muted-foreground font-normal">({selected.size} selected)</span>
            </label>
            {loadingProjects && <p className="text-xs text-muted-foreground py-4 text-center">Loading projects...</p>}
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {projects.map(p => (
                <button key={p.id} onClick={() => toggleProject(p.id)}
                  className={`w-full text-left px-4 py-3 rounded-sm border transition-colors ${
                    selected.has(p.id) ? "border-electric/40 bg-electric/5" : "border-border hover:border-muted-foreground/30"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{p.mode?.replace("_", " ")}</p>
                    </div>
                    {selected.has(p.id) && <Check className="h-4 w-4 text-electric" />}
                  </div>
                </button>
              ))}
              {!loadingProjects && projects.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No projects found. Generate a narrative first.</p>
              )}
            </div>
          </div>

          {/* Custom intro */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Intro Message (optional)</label>
            <textarea value={customIntro} onChange={e => setCustomIntro(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40 resize-none"
              placeholder="Welcome message shown at the top of the data room..." />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Password Protection (optional)
            </label>
            <input type="text" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground focus:outline-none focus:border-electric/40"
              placeholder="Leave empty for no password" />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4">
          <button onClick={handleCreate}
            className="w-full py-2.5 bg-electric text-primary-foreground rounded-sm font-medium text-sm hover:opacity-90 transition-opacity">
            Create Data Room
          </button>
        </div>
      </div>
    </div>
  );
}
