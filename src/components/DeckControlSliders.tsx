import type { DeckControls } from "@/types/narrative";
import { Slider } from "@/components/ui/slider";

interface Props {
  controls: DeckControls;
  onChange: (controls: DeckControls) => void;
}

export function DeckControlSliders({ controls, onChange }: Props) {
  return (
    <div className="border border-border rounded-sm p-5 bg-card/50 space-y-5">
      <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">Deck Controls</p>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Text Density</span>
            <span className="text-[11px] text-foreground/60 tabular-nums">
              {controls.textDensity < 33 ? "Minimal" : controls.textDensity < 66 ? "Balanced" : "Detailed"}
            </span>
          </div>
          <Slider
            value={[controls.textDensity]}
            onValueChange={([v]) => onChange({ ...controls, textDensity: v })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Visual Weight</span>
            <span className="text-[11px] text-foreground/60 tabular-nums">
              {controls.visualWeight < 33 ? "Minimal" : controls.visualWeight < 66 ? "Balanced" : "Graphic-Heavy"}
            </span>
          </div>
          <Slider
            value={[controls.visualWeight]}
            onValueChange={([v]) => onChange({ ...controls, visualWeight: v })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Tone</span>
            <span className="text-[11px] text-foreground/60 tabular-nums">
              {controls.tone < 33 ? "Conservative" : controls.tone < 66 ? "Balanced" : "Bold"}
            </span>
          </div>
          <Slider
            value={[controls.tone]}
            onValueChange={([v]) => onChange({ ...controls, tone: v })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
