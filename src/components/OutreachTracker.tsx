import { useState } from "react";
import { useDecksmith } from "@/context/DecksmithContext";
import { Plus, Trash2, Download } from "lucide-react";
import type { OutreachEntry } from "@/types/narrative";

const STATUSES: { value: OutreachEntry["status"]; label: string }[] = [
  { value: "not_contacted", label: "Not Contacted" },
  { value: "contacted", label: "Contacted" },
  { value: "warm_intro", label: "Warm Intro" },
  { value: "meeting_scheduled", label: "Meeting Scheduled" },
  { value: "passed", label: "Passed" },
  { value: "invested", label: "Invested" },
];

const STATUS_COLORS: Record<string, string> = {
  not_contacted: "text-muted-foreground", contacted: "text-blue-400", warm_intro: "text-yellow-400",
  meeting_scheduled: "text-green-400", passed: "text-destructive", invested: "text-green-500",
};

export function OutreachTracker() {
  const { outreachTracker, addOutreachEntry, updateOutreachEntry, removeOutreachEntry, isPro } = useDecksmith();
  const [newName, setNewName] = useState("");
  const [newFirm, setNewFirm] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    addOutreachEntry({ investorName: newName, firm: newFirm, status: "not_contacted", notes: "", updatedAt: new Date().toISOString() });
    setNewName(""); setNewFirm("");
  };

  const handleExportCSV = () => {
    if (!isPro) return;
    const headers = "Investor,Firm,Status,Notes,Last Updated\n";
    const rows = outreachTracker.map(e => `"${e.investorName}","${e.firm || ""}","${e.status}","${e.notes}","${e.updatedAt}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "outreach_tracker.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">Outreach Tracker</p>
        {outreachTracker.length > 0 && (
          <button onClick={handleExportCSV} disabled={!isPro} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-30" title={isPro ? "Export CSV" : "Pro only"}>
            <Download className="h-3 w-3" />Export CSV
          </button>
        )}
      </div>
      <div className="flex gap-2 mb-4">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Investor name" className="flex-1 bg-background border border-border rounded-sm px-3 py-2 text-foreground text-xs focus:outline-none focus:border-muted-foreground/40" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <input value={newFirm} onChange={(e) => setNewFirm(e.target.value)} placeholder="Firm" className="flex-1 bg-background border border-border rounded-sm px-3 py-2 text-foreground text-xs focus:outline-none focus:border-muted-foreground/40" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <button onClick={handleAdd} className="text-xs bg-foreground text-background px-3 py-2 rounded-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
      </div>
      {outreachTracker.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 py-4 text-center">No outreach entries yet. Add investors to track your fundraising pipeline.</p>
      ) : (
        <div className="space-y-0">
          {outreachTracker.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{entry.investorName}</p>
                {entry.firm && <p className="text-[11px] text-muted-foreground">{entry.firm}</p>}
              </div>
              <select value={entry.status} onChange={(e) => updateOutreachEntry(i, { ...entry, status: e.target.value as OutreachEntry["status"], updatedAt: new Date().toISOString() })} className={`text-[11px] bg-background border border-border rounded-sm px-2 py-1 ${STATUS_COLORS[entry.status]}`}>
                {STATUSES.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
              <input value={entry.notes} onChange={(e) => updateOutreachEntry(i, { ...entry, notes: e.target.value, updatedAt: new Date().toISOString() })} placeholder="Notes..." className="w-36 bg-background border border-border rounded-sm px-2 py-1 text-[11px] text-foreground focus:outline-none" />
              <button onClick={() => removeOutreachEntry(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
