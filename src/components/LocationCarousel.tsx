import { useState, useRef, useEffect } from "react";
import { LocationSummary } from "@/lib/types";
import { MapPin, Calendar, Leaf, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  summaries: LocationSummary[];
}

export default function LocationCarousel({ summaries }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLInputElement>(null);

  const loc = summaries[currentIndex];
  if (!loc) return null;

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < summaries.length - 1;

  return (
    <div className="space-y-3">
      {/* Scrubber bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {summaries[0]?.date}
        </span>
        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={summaries.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(Number(e.target.value))}
          className="flex-1 h-2 accent-primary cursor-pointer"
        />
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {summaries[summaries.length - 1]?.date}
        </span>
      </div>

      {/* Card with arrows */}
      <div className="flex items-stretch gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canPrev}
          onClick={() => setCurrentIndex((i) => i - 1)}
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
              {/* Date & coords */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono">{loc.date}</span>
                {loc.lat !== null && loc.lon !== null && (
                  <>
                    <span className="text-border">·</span>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-mono text-xs">
                      {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                    </span>
                  </>
                )}
              </div>

              {/* Locality */}
              <p className="text-sm font-medium leading-snug">{loc.locality}</p>

              {/* Specimens */}
              <div className="space-y-1.5">
                {loc.specimens.map((s) => (
                  <div
                    key={s.gbifID}
                    className="flex items-start gap-2 text-xs bg-muted rounded-md px-2.5 py-1.5"
                  >
                    <Leaf className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <em className="text-foreground">
                        {s.scientificName.split(" ").slice(0, 2).join(" ")}
                      </em>
                      <div className="flex items-center gap-2 text-muted-foreground mt-0.5 flex-wrap">
                        <span className="font-mono">#{s.recordNumber}</span>
                        <span className="text-border">·</span>
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{s.recordedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          disabled={!canNext}
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="flex-shrink-0 self-center"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Position indicator */}
      <p className="text-center text-xs text-muted-foreground">
        Stop {currentIndex + 1} of {summaries.length}
      </p>
    </div>
  );
}
