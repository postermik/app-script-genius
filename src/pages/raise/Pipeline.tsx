import { GitGraph } from "lucide-react";

export default function Pipeline() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-sm bg-electric/10">
          <GitGraph className="h-4 w-4 text-electric" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Pipeline</h2>
          <p className="text-sm text-secondary-foreground">Track your fundraising funnel from intro to close.</p>
        </div>
      </div>
      <div className="p-8 rounded-sm border border-border card-gradient text-center">
        <p className="text-sm text-muted-foreground">Pipeline tracker coming soon.</p>
      </div>
    </div>
  );
}
