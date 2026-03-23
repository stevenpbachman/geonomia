import { useEffect, useState } from "react";
import { LocationSummary } from "@/lib/types";
import { MapPin, Calendar, Leaf, ChevronLeft, ChevronRight, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  summaries: LocationSummary[];
  onLocationSelect?: (summary: LocationSummary | null) => void;
}

export default function LocationCarousel({ summaries, onLocationSelect }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    const first = summaries[0];
    onLocationSelect?.(first?.lat !== null && first?.lon !== null ? first : null);
  }, [summaries, onLocationSelect]);

  const loc = summaries[currentIndex];
  if (!loc) return null;

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < summaries.length - 1;

  const goTo = (idx: number) => {
    setCurrentIndex(idx);
    const s = summaries[idx];
    onLocationSelect?.(s?.lat !== null && s?.lon !== null ? s : null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {summaries[0]?.date}
        </span>
        <input
          type="range"
          min={0}
          max={summaries.length - 1}
          value={currentIndex}
          onChange={(e) => goTo(Number(e.target.value))}
          className="flex-1 h-2 accent-primary cursor-pointer"
        />
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {summaries[summaries.length - 1]?.date}
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canPrev}
          onClick={() => goTo(currentIndex - 1)}
          className="flex-shrink-0 self-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 bg-card rounded-lg border p-5 shadow-sm min-h-[160px] transition-all duration-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-botanical-light flex items-center justify-center text-primary font-mono text-sm font-semibold">
              {currentIndex + 1}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono">{loc.date}</span>
                {loc.lat !== null && loc.lon !== null && (
                  <>
                    <span className="text-border">·</span>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    <span className="font-mono text-xs">
                      {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {loc.specimens.map((s) => (
                  <div
                    key={s.gbifID}
                    className="bg-muted rounded-md px-3 py-2 space-y-1"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="truncate">{s.recordedBy}</span>
                      <span className="text-border">·</span>
                      <Hash className="w-3 h-3 flex-shrink-0" />
                      <span className="font-mono font-semibold">{s.recordNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Leaf className="w-3 h-3 text-primary flex-shrink-0" />
                      <em>{s.scientificName.split(" ").slice(0, 2).join(" ")}</em>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground leading-snug">{loc.locality}</p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={!canNext}
          onClick={() => goTo(currentIndex + 1)}
          className="flex-shrink-0 self-center"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Stop {currentIndex + 1} of {summaries.length}
      </p>
    </div>
  );
}
