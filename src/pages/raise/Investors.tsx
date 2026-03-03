import { Search } from "lucide-react";

export default function Investors() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-sm bg-electric/10">
          <Search className="h-4 w-4 text-electric" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Investor Discovery</h2>
          <p className="text-sm text-secondary-foreground">Find and research investors matched to your raise.</p>
        </div>
      </div>
      <div className="p-8 rounded-sm border border-border card-gradient text-center">
        <p className="text-sm text-muted-foreground">Investor discovery tools coming soon.</p>
      </div>
    </div>
  );
}
