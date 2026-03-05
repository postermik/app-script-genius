import { ArrowLeft, Mail, Eye, MousePointer, Check, X, Clock, Users } from "lucide-react";
import type { OutreachCampaign } from "@/pages/raise/Outreach";

interface Props {
  campaign: OutreachCampaign;
  onBack: () => void;
}

export function CampaignDetail({ campaign, onBack }: Props) {
  const analytics = campaign.analytics;

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors mb-5">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to outreach
      </button>

      <div className="mb-6">
        <h2 className="text-base font-bold text-foreground">{campaign.subject || "(No subject)"}</h2>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Sent {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> {campaign.recipients.length} recipient{campaign.recipients.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Analytics summary */}
      {analytics && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-sm border border-border card-gradient text-center">
            <div className="text-2xl font-bold text-foreground">{analytics.delivered}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Mail className="h-3 w-3" /> Delivered
            </div>
          </div>
          <div className="p-4 rounded-sm border border-border card-gradient text-center">
            <div className="text-2xl font-bold text-electric">{analytics.opened}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" /> Opened
            </div>
          </div>
          <div className="p-4 rounded-sm border border-border card-gradient text-center">
            <div className="text-2xl font-bold text-emerald">{analytics.clicked}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <MousePointer className="h-3 w-3" /> Clicked
            </div>
          </div>
        </div>
      )}

      {/* Recipient breakdown */}
      <div className="border border-border rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/10">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recipients</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Name</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Email</th>
              <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Delivered</th>
              <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Opened</th>
              <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Clicked</th>
              <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">Last Opened</th>
            </tr>
          </thead>
          <tbody>
            {campaign.recipients.map(r => {
              const stats = analytics?.recipientStats.find(s => s.recipientId === r.id);
              return (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    {r.firmName && <p className="text-[10px] text-muted-foreground">{r.firmName}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{r.email}</td>
                  <td className="px-4 py-3 text-center">
                    {stats?.delivered ? <Check className="h-4 w-4 text-emerald mx-auto" /> : <X className="h-4 w-4 text-destructive mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {stats?.opened ? <Eye className="h-4 w-4 text-electric mx-auto" /> : <span className="text-xs text-muted-foreground">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {stats?.clicked ? <MousePointer className="h-4 w-4 text-emerald mx-auto" /> : <span className="text-xs text-muted-foreground">-</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {stats?.openedAt ? new Date(stats.openedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Email body */}
      <div className="mt-6 border border-border rounded-sm p-5 card-gradient">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Email Content</h3>
        <div className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{campaign.body}</div>
      </div>
    </div>
  );
}
