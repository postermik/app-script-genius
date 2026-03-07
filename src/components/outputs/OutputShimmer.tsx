import { Skeleton } from "@/components/ui/skeleton";

export function SlideShimmer() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-48 bg-muted/50" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card-gradient rounded-sm border border-border p-5 space-y-3">
          <Skeleton className="h-4 w-3/4 bg-muted/40" />
          <Skeleton className="h-3 w-full bg-muted/30" />
          <Skeleton className="h-3 w-5/6 bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

export function PitchShimmer() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="card-gradient rounded-sm border border-border p-6 space-y-4">
          <Skeleton className="h-3 w-32 bg-muted/40" />
          <Skeleton className="h-4 w-full bg-muted/30" />
          <Skeleton className="h-4 w-5/6 bg-muted/30" />
          <Skeleton className="h-4 w-4/6 bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

export function QAShimmer() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-64 bg-muted/40 mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="card-gradient rounded-sm border border-border p-4 space-y-2">
          <Skeleton className="h-4 w-4/5 bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

export function EmailShimmer() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card-gradient rounded-sm border border-border p-5 space-y-3">
          <Skeleton className="h-3 w-24 bg-muted/40" />
          <Skeleton className="h-4 w-3/4 bg-muted/30" />
          <Skeleton className="h-3 w-full bg-muted/30" />
          <Skeleton className="h-3 w-5/6 bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

export function MemoShimmer() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card-gradient rounded-sm border border-border p-5 space-y-3">
          <Skeleton className="h-4 w-40 bg-muted/40" />
          <Skeleton className="h-3 w-full bg-muted/30" />
          <Skeleton className="h-3 w-5/6 bg-muted/30" />
          <Skeleton className="h-3 w-4/6 bg-muted/30" />
        </div>
      ))}
    </div>
  );
}

export function ScoreShimmer() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full bg-muted/40" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32 bg-muted/40" />
          <Skeleton className="h-3 w-48 bg-muted/30" />
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-32 bg-muted/40" />
          <Skeleton className="h-2 w-full rounded-full bg-muted/30" />
        </div>
      ))}
    </div>
  );
}
