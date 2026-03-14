import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

function LoadingLine({ lines }: { lines: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % lines.length), 3000);
    return () => clearInterval(t);
  }, [lines.length]);
  return (
    <p className="text-[11px] text-muted-foreground/60 italic mt-3 transition-opacity duration-500">
      {lines[idx]}
    </p>
  );
}

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
    <LoadingLine lines={[
      "Building the slide that makes investors lean in...",
      "Writing headlines that do the work...",
      "Structuring the argument slide by slide...",
    ]} />
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
    <LoadingLine lines={[
      "Writing the email that gets a reply...",
      "Three variants. One lands.",
      "Crafting the cold open...",
    ]} />
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
    <LoadingLine lines={[
      "Writing the memo a partner will actually read...",
      "Building the investment case section by section...",
      "Structuring the argument for a 30-minute meeting...",
    ]} />
  </div>
  );
}

export function CoreNarrativeShimmer() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-32 bg-muted/40" />
        <Skeleton className="h-6 w-20 bg-muted/30" />
      </div>
      <div className="card-gradient rounded-sm border border-border divide-y divide-border">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 space-y-3">
            <Skeleton className="h-3 w-24 bg-muted/40" />
            <Skeleton className="h-3 w-full bg-muted/30" />
            <Skeleton className="h-3 w-5/6 bg-muted/30" />
            <Skeleton className="h-3 w-4/6 bg-muted/30" />
          </div>
        ))}
      </div>
    <LoadingLine lines={[
      "Framing your story for a skeptical partner...",
      "Finding the argument behind your business...",
      "Stress-testing your narrative logic...",
      "Sharpening the thesis...",
    ]} />
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
