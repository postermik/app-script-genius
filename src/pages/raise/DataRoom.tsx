import { FolderLock } from "lucide-react";

export default function DataRoom() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-sm bg-electric/10">
          <FolderLock className="h-4 w-4 text-electric" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Data Room</h2>
          <p className="text-sm text-secondary-foreground">Secure document sharing for due diligence.</p>
        </div>
      </div>
      <div className="p-8 rounded-sm border border-border card-gradient text-center">
        <p className="text-sm text-muted-foreground">Data room coming soon.</p>
      </div>
    </div>
  );
}
