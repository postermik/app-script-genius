import { useState, useEffect, useCallback } from "react";
import { Mail, Send, FileText, Plus, Search, Clock, Users, Eye, MousePointer, ChevronRight, Trash2, Edit3, X, FolderLock, Check, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OutreachComposer } from "@/components/raise/OutreachComposer";
import { CampaignDetail } from "@/components/raise/CampaignDetail";
import { DataRoomPicker } from "@/components/raise/DataRoomPicker";

// ── Types ──────────────────────────────────────────────

export interface OutreachRecipient {
  id: string;
  name: string;
  email: string;
  firmName?: string;
  investorId?: string;
  pipelineEntryId?: string;
}

export interface OutreachCampaign {
  id: string;
  type: "update" | "cold";
  subject: string;
  body: string;
  recipients: OutreachRecipient[];
  attachedDataRooms: { id: string; title: string; slug: string }[];
  status: "draft" | "sent";
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  // Mock analytics
  analytics?: {
    delivered: number;
    opened: number;
    clicked: number;
    recipientStats: {
      recipientId: string;
      delivered: boolean;
      opened: boolean;
      openedAt?: string;
      clicked: boolean;
    }[];
  };
}

export interface DataRoomItem {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
}

type SubTab = "updates" | "cold";
type View = "list" | "compose" | "detail";

// ── Storage helpers ────────────────────────────────────

const STORAGE_KEY = "rhetoric_outreach_campaigns";

function loadCampaigns(): OutreachCampaign[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveCampaigns(campaigns: OutreachCampaign[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

function generateMockAnalytics(recipients: OutreachRecipient[]): OutreachCampaign["analytics"] {
  const recipientStats = recipients.map(r => {
    const delivered = Math.random() > 0.05;
    const opened = delivered && Math.random() > 0.3;
    const clicked = opened && Math.random() > 0.5;
    return {
      recipientId: r.id,
      delivered,
      opened,
      openedAt: opened ? new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() : undefined,
      clicked,
    };
  });
  return {
    delivered: recipientStats.filter(r => r.delivered).length,
    opened: recipientStats.filter(r => r.opened).length,
    clicked: recipientStats.filter(r => r.clicked).length,
    recipientStats,
  };
}

// ── Component ──────────────────────────────────────────

export default function Outreach() {
  const [subTab, setSubTab] = useState<SubTab>("updates");
  const [view, setView] = useState<View>("list");
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>(loadCampaigns);
  const [editingCampaign, setEditingCampaign] = useState<OutreachCampaign | null>(null);
  const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);
  const [preAttachedDataRoom, setPreAttachedDataRoom] = useState<DataRoomItem | null>(null);

  // Listen for "send via outreach" events from Data Room
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.dataRoom) {
        setPreAttachedDataRoom(e.detail.dataRoom);
        setView("compose");
        setEditingCampaign(null);
      }
    };
    window.addEventListener("outreach:attach-data-room" as any, handler as any);
    return () => window.removeEventListener("outreach:attach-data-room" as any, handler as any);
  }, []);

  const filteredCampaigns = campaigns.filter(c => c.type === (subTab === "updates" ? "update" : "cold"));
  const drafts = filteredCampaigns.filter(c => c.status === "draft");
  const sent = filteredCampaigns.filter(c => c.status === "sent");

  const handleSave = useCallback((campaign: OutreachCampaign) => {
    setCampaigns(prev => {
      const exists = prev.find(c => c.id === campaign.id);
      const updated = exists ? prev.map(c => c.id === campaign.id ? campaign : c) : [...prev, campaign];
      saveCampaigns(updated);
      return updated;
    });
    setView("list");
    setEditingCampaign(null);
    toast.success(campaign.status === "sent" ? "Campaign sent!" : "Draft saved");
  }, []);

  const handleSend = useCallback((campaign: OutreachCampaign) => {
    const sentCampaign: OutreachCampaign = {
      ...campaign,
      status: "sent",
      sentAt: new Date().toISOString(),
      analytics: generateMockAnalytics(campaign.recipients),
    };
    handleSave(sentCampaign);
    toast.success(`Sent to ${campaign.recipients.length} recipient${campaign.recipients.length !== 1 ? "s" : ""}`);
  }, [handleSave]);

  const handleDelete = useCallback((id: string) => {
    setCampaigns(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveCampaigns(updated);
      return updated;
    });
    if (viewingCampaignId === id) {
      setViewingCampaignId(null);
      setView("list");
    }
    toast.success("Campaign deleted");
  }, [viewingCampaignId]);

  const viewingCampaign = campaigns.find(c => c.id === viewingCampaignId);

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-foreground">Outreach</h2>
        <p className="text-sm text-secondary-foreground">Manage investor communications and follow-ups.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => { setSubTab("updates"); setView("list"); setViewingCampaignId(null); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            subTab === "updates" ? "border-electric text-electric" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="h-3.5 w-3.5 inline mr-1.5" />Investor Updates
        </button>
        <button
          onClick={() => { setSubTab("cold"); setView("list"); setViewingCampaignId(null); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            subTab === "cold" ? "border-electric text-electric" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="h-3.5 w-3.5 inline mr-1.5" />Cold Outreach
        </button>
      </div>

      {/* Views */}
      {view === "list" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/30 border border-border flex items-center justify-center mb-4">
            {subTab === "updates"
              ? <Mail className="h-5 w-5 text-muted-foreground" />
              : <Send className="h-5 w-5 text-muted-foreground" />}
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {subTab === "updates" ? "Investor Updates" : "Cold Outreach"} coming soon
          </p>
          <p className="text-xs text-muted-foreground max-w-[320px] leading-relaxed">
            {subTab === "updates"
              ? "Send portfolio updates directly to your investors from Rhetoric. Until then, use your pitch email from the Outputs tab."
              : "Send personalized cold outreach to investors at scale. Until then, copy your pitch email from the Outputs tab and send it yourself."}
          </p>
        </div>
      )}

      {view === "compose" && (
        <OutreachComposer
          type={subTab === "updates" ? "update" : "cold"}
          existing={editingCampaign}
          preAttachedDataRoom={preAttachedDataRoom}
          onSave={handleSave}
          onSend={handleSend}
          onCancel={() => { setView("list"); setEditingCampaign(null); setPreAttachedDataRoom(null); }}
        />
      )}

      {view === "detail" && viewingCampaign && (
        <CampaignDetail
          campaign={viewingCampaign}
          onBack={() => { setView("list"); setViewingCampaignId(null); }}
        />
      )}
    </div>
  );
}

// ── Campaign Row ───────────────────────────────────────

function CampaignRow({ campaign, onClick, onEdit, onDelete }: {
  campaign: OutreachCampaign;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const isDraft = campaign.status === "draft";
  const date = isDraft ? campaign.updatedAt : campaign.sentAt;

  return (
    <div
      onClick={onClick || onEdit}
      className="flex items-center gap-4 p-4 rounded-sm border border-border card-gradient hover:border-muted-foreground/20 transition-colors cursor-pointer group"
    >
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">
          {campaign.subject || "(No subject)"}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> {campaign.recipients.length} recipient{campaign.recipients.length !== 1 ? "s" : ""}
          </span>
          {date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(date).toLocaleDateString()}
            </span>
          )}
          {campaign.attachedDataRooms.length > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FolderLock className="h-3 w-3" /> {campaign.attachedDataRooms.length} attachment{campaign.attachedDataRooms.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Analytics preview for sent */}
      {!isDraft && campaign.analytics && (
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1" title="Opened">
            <Eye className="h-3 w-3" /> {campaign.analytics.opened}/{campaign.analytics.delivered}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1" title="Clicked">
            <MousePointer className="h-3 w-3" /> {campaign.analytics.clicked}
          </span>
        </div>
      )}

      {isDraft && onEdit && (
        <button onClick={e => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      )}

      <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}
