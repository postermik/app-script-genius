import { useState, useEffect, useCallback } from "react";
import { X, Plus, Search, FolderLock, Send, Save, Eye, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OutreachCampaign, OutreachRecipient, DataRoomItem } from "@/pages/raise/Outreach";
import { DataRoomPicker } from "./DataRoomPicker";

interface Props {
  type: "update" | "cold";
  existing: OutreachCampaign | null;
  preAttachedDataRoom: DataRoomItem | null;
  onSave: (campaign: OutreachCampaign) => void;
  onSend: (campaign: OutreachCampaign) => void;
  onCancel: () => void;
}

interface PipelineContact {
  id: string;
  firm_name: string;
  contact_name: string | null;
  contact_email: string | null;
  investor_id: string | null;
}

const MERGE_FIELDS = [
  { tag: "{investor_name}", label: "Investor Name" },
  { tag: "{firm_name}", label: "Firm Name" },
  { tag: "{company_name}", label: "Your Company" },
];

export function OutreachComposer({ type, existing, preAttachedDataRoom, onSave, onSend, onCancel }: Props) {
  const [subject, setSubject] = useState(existing?.subject || "");
  const [body, setBody] = useState(existing?.body || "");
  const [recipients, setRecipients] = useState<OutreachRecipient[]>(existing?.recipients || []);
  const [attachedDataRooms, setAttachedDataRooms] = useState<OutreachCampaign["attachedDataRooms"]>(existing?.attachedDataRooms || []);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [showDataRoomPicker, setShowDataRoomPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [pipelineContacts, setPipelineContacts] = useState<PipelineContact[]>([]);
  const [contactSearch, setContactSearch] = useState("");

  // Load pipeline contacts
  useEffect(() => {
    supabase.from("pipeline_entries")
      .select("id, firm_name, contact_name, contact_email, investor_id")
      .order("firm_name")
      .then(({ data }) => {
        if (data) setPipelineContacts(data as PipelineContact[]);
      });
  }, []);

  // Pre-attach data room
  useEffect(() => {
    if (preAttachedDataRoom && !attachedDataRooms.find(d => d.id === preAttachedDataRoom.id)) {
      setAttachedDataRooms(prev => [...prev, { id: preAttachedDataRoom.id, title: preAttachedDataRoom.title, slug: preAttachedDataRoom.slug }]);
    }
  }, [preAttachedDataRoom]);

  const campaignId = existing?.id || crypto.randomUUID();

  const buildCampaign = (status: "draft" | "sent"): OutreachCampaign => ({
    id: campaignId,
    type,
    subject,
    body,
    recipients,
    attachedDataRooms,
    status,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSaveDraft = () => {
    if (!subject.trim() && !body.trim()) { toast.error("Add a subject or body to save"); return; }
    onSave(buildCampaign("draft"));
  };

  const handleSend = () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (recipients.length === 0) { toast.error("Add at least one recipient"); return; }
    onSend(buildCampaign("sent"));
  };

  const addRecipient = (r: OutreachRecipient) => {
    if (recipients.find(x => x.email === r.email)) { toast.error("Already added"); return; }
    setRecipients(prev => [...prev, r]);
  };

  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r.email !== email));
  };

  const addManualEmail = () => {
    const email = manualEmail.trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { toast.error("Invalid email"); return; }
    addRecipient({ id: crypto.randomUUID(), name: email.split("@")[0], email });
    setManualEmail("");
  };

  const handleDataRoomSelect = (room: DataRoomItem) => {
    if (attachedDataRooms.find(d => d.id === room.id)) return;
    setAttachedDataRooms(prev => [...prev, { id: room.id, title: room.title, slug: room.slug }]);
    setShowDataRoomPicker(false);
  };

  const removeDataRoom = (id: string) => {
    setAttachedDataRooms(prev => prev.filter(d => d.id !== id));
  };

  const insertMergeField = (tag: string) => {
    setBody(prev => prev + tag);
  };

  const filteredContacts = pipelineContacts.filter(c => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    return c.firm_name.toLowerCase().includes(q) || (c.contact_name || "").toLowerCase().includes(q) || (c.contact_email || "").toLowerCase().includes(q);
  });

  const previewBody = (recipient: OutreachRecipient) => {
    return body
      .replace(/\{investor_name\}/g, recipient.name || "")
      .replace(/\{firm_name\}/g, recipient.firmName || "")
      .replace(/\{company_name\}/g, "Your Company");
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(!showPreview)} className="text-xs px-3 py-1.5 border border-border rounded-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <Eye className="h-3 w-3" /> Preview
          </button>
          <button onClick={handleSaveDraft} className="text-xs px-3 py-1.5 border border-border rounded-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <Save className="h-3 w-3" /> Save Draft
          </button>
          <button onClick={handleSend} className="text-xs px-3 py-1.5 bg-electric text-primary-foreground rounded-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <Send className="h-3 w-3" /> Send
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Recipients */}
        <div className="border border-border rounded-sm p-4 card-gradient">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</label>
            <button onClick={() => setShowRecipientPicker(!showRecipientPicker)} className="text-xs text-electric hover:underline flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add Recipients
            </button>
          </div>

          {/* Current recipients */}
          {recipients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {recipients.map(r => (
                <span key={r.email} className="inline-flex items-center gap-1 text-xs bg-muted/30 border border-border rounded-sm px-2 py-1 text-foreground">
                  {r.name} <span className="text-muted-foreground">({r.email})</span>
                  <button onClick={() => removeRecipient(r.email)} className="text-muted-foreground hover:text-destructive ml-0.5">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {recipients.length === 0 && !showRecipientPicker && (
            <p className="text-xs text-muted-foreground/60">No recipients added yet.</p>
          )}

          {/* Recipient picker */}
          {showRecipientPicker && (
            <div className="mt-3 border-t border-border pt-3 space-y-3 animate-fade-in">
              {/* Manual email input */}
              <div className="flex gap-2">
                <input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addManualEmail()}
                  placeholder="Type email address..."
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40" />
                <button onClick={addManualEmail} className="text-xs px-3 py-2 border border-border rounded-sm text-muted-foreground hover:text-foreground transition-colors">Add</button>
              </div>

              {/* Pipeline contacts */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Or add from your pipeline:</p>
                <div className="relative mb-2">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search pipeline..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40" />
                </div>
                <div className="max-h-[160px] overflow-y-auto space-y-1">
                  {filteredContacts.map(c => {
                    const alreadyAdded = recipients.some(r => r.email === c.contact_email);
                    return (
                      <button key={c.id} disabled={!c.contact_email || alreadyAdded}
                        onClick={() => c.contact_email && addRecipient({
                          id: c.id,
                          name: c.contact_name || c.firm_name,
                          email: c.contact_email,
                          firmName: c.firm_name,
                          investorId: c.investor_id || undefined,
                          pipelineEntryId: c.id,
                        })}
                        className={`w-full text-left px-3 py-2 rounded-sm text-xs transition-colors ${
                          alreadyAdded ? "opacity-40 cursor-not-allowed" : !c.contact_email ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/30"
                        }`}
                      >
                        <span className="font-medium text-foreground">{c.firm_name}</span>
                        {c.contact_name && <span className="text-muted-foreground"> - {c.contact_name}</span>}
                        {c.contact_email ? (
                          <span className="text-muted-foreground ml-1">({c.contact_email})</span>
                        ) : (
                          <span className="text-muted-foreground/50 ml-1">(no email)</span>
                        )}
                        {alreadyAdded && <span className="text-electric ml-1">✓</span>}
                      </button>
                    );
                  })}
                  {filteredContacts.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 text-center py-4">No pipeline contacts found.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder={type === "update" ? "Q1 2026 Investor Update" : "Introduction: [Your Company]"}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40" />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Body</label>
            {type === "cold" && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-1">Merge:</span>
                {MERGE_FIELDS.map(f => (
                  <button key={f.tag} onClick={() => insertMergeField(f.tag)}
                    className="text-[10px] px-1.5 py-0.5 border border-border rounded-sm text-muted-foreground hover:text-electric hover:border-electric/30 transition-colors">
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
            placeholder={type === "update"
              ? "Hi investors,\n\nHere's our latest progress update...\n\nKey Highlights:\n- \n- \n\nMetrics:\n- \n\nLooking Ahead:\n- \n\nBest regards"
              : "Hi {investor_name},\n\nI'm reaching out because {firm_name} invests in companies like ours...\n\nBest regards"
            }
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric/40 resize-y font-mono leading-relaxed" />
        </div>

        {/* Data Room attachments */}
        <div className="border border-border rounded-sm p-4 card-gradient">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <FolderLock className="h-3.5 w-3.5" /> Data Room Attachments
            </label>
            <button onClick={() => setShowDataRoomPicker(true)} className="text-xs text-electric hover:underline flex items-center gap-1">
              <Plus className="h-3 w-3" /> Attach from Data Room
            </button>
          </div>

          {attachedDataRooms.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">No data room items attached. Recipients will receive trackable links to attached materials.</p>
          ) : (
            <div className="space-y-1.5">
              {attachedDataRooms.map(dr => (
                <div key={dr.id} className="flex items-center justify-between px-3 py-2 rounded-sm bg-muted/20 border border-border">
                  <div className="flex items-center gap-2">
                    <FolderLock className="h-3.5 w-3.5 text-electric" />
                    <span className="text-xs font-medium text-foreground">{dr.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">/room/{dr.slug}</span>
                  </div>
                  <button onClick={() => removeDataRoom(dr.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-card border border-border rounded-sm w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Email Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                <p className="text-sm font-medium text-foreground">{subject || "(No subject)"}</p>
              </div>
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">To</p>
                <p className="text-sm text-foreground">{recipients.length > 0 ? recipients.map(r => r.email).join(", ") : "(No recipients)"}</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-2">Body {type === "cold" && recipients.length > 0 ? `(preview for ${recipients[0].name})` : ""}</p>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-background rounded-sm border border-border p-4">
                  {type === "cold" && recipients.length > 0 ? previewBody(recipients[0]) : body || "(Empty)"}
                </div>
              </div>
              {attachedDataRooms.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Attachments</p>
                  <div className="space-y-1">
                    {attachedDataRooms.map(dr => (
                      <div key={dr.id} className="flex items-center gap-2 text-xs text-electric">
                        <FolderLock className="h-3 w-3" /> {dr.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Room picker modal */}
      {showDataRoomPicker && (
        <DataRoomPicker
          onSelect={handleDataRoomSelect}
          onClose={() => setShowDataRoomPicker(false)}
          excludeIds={attachedDataRooms.map(d => d.id)}
        />
      )}
    </div>
  );
}
