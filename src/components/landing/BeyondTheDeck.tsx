import { Search, KanbanSquare, FolderOpen } from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Investor Discovery",
    description:
      "AI-matched investors based on your narrative. Stage, sector, check size: filtered automatically.",
  },
  {
    icon: KanbanSquare,
    title: "Pipeline Tracker",
    description:
      "Kanban-style CRM to manage outreach, track meetings, and monitor your raise progress.",
  },
  {
    icon: FolderOpen,
    title: "Data Room",
    description:
      "Create shareable links with your pitch materials. Track who viewed what and for how long.",
  },
];

export function BeyondTheDeck() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-[1100px] mx-auto">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">
          Beyond the Deck
        </p>
        <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
          From narrative to funded.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[560px] mb-14">
          Rhetoric doesn't stop at the deck. Find investors, track your raise,
          and share materials, all from one platform.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card/50 border border-border rounded-sm p-8 hover:border-muted-foreground/20 transition-all hover:-translate-y-0.5"
            >
              <f.icon className="h-5 w-5 text-electric mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
