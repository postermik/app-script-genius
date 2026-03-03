import { ArrowRight } from "lucide-react";

const STEPS = [
  { num: "01", title: "Describe", text: "Enter your company in plain language." },
  { num: "02", title: "Generate", text: "AI structures your narrative and builds your deck." },
  { num: "03", title: "Discover", text: "Get matched with relevant investors automatically." },
  { num: "04", title: "Raise", text: "Track outreach, share your data room, close your round." },
];

export function WorkflowSteps() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-[1100px] mx-auto">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-electric mb-3">
          How It Works
        </p>
        <h2 className="text-3xl font-bold text-foreground mb-16 tracking-tight">
          One platform. Four steps.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.num} className="relative flex flex-col">
              <div className="bg-card/50 border border-border rounded-sm p-6 hover:border-muted-foreground/20 transition-all flex-1">
                <span className="text-xs font-bold text-electric/50 tracking-wider">
                  {s.num}
                </span>
                <h3 className="text-base font-semibold text-foreground mt-2 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.text}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
