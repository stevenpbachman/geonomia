import { useEffect, useState, useMemo } from "react";
import { LocationSummary, GeoreferenceSuggestion } from "@/lib/types";
import { MapPin, Calendar, Leaf, ChevronLeft, ChevronRight, User, Hash, AlertTriangle, ExternalLink, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  summaries: LocationSummary[];
  onLocationSelect?: (summary: LocationSummary | null) => void;
  onGeoreferenceRequest?: (specimen: import("@/lib/types").SpecimenRecord) => void;
  suggestions?: GeoreferenceSuggestion[];
}

export default function LocationCarousel({ summaries, onLocationSelect, onGeoreferenceRequest }: Props) {
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
  const isUngeoreferenced = loc.lat === null || loc.lon === null;

  const goTo = (idx: number) => {
    setCurrentIndex(idx);
    const s = summaries[idx];
    onLocationSelect?.(s?.lat !== null && s?.lon !== null ? s : null);
  };

  const ungeorefCount = summaries.filter(s => s.lat === null || s.lon === null).length;

  return (
    <div className="space-y-3">
      {/* Scrubber with stop indicators */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
            {summaries[0]?.date}
          </span>
          <div className="flex-1 relative h-6">
            {/* Track line */}
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] bg-border rounded-full" />
            {/* Progress line up to current */}
            {summaries.length > 1 && (
              <div
                className="absolute top-1/2 left-0 -translate-y-1/2 h-[2px] bg-muted-foreground/30 rounded-full"
                style={{ width: `${(currentIndex / (summaries.length - 1)) * 100}%` }}
              />
            )}
            {/* Stop dots */}
            {summaries.map((s, i) => {
              const isUngeoref = s.lat === null || s.lon === null;
              const isCurrent = i === currentIndex;
              const pct = summaries.length > 1 ? (i / (summaries.length - 1)) * 100 : 50;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-1"
                  style={{ left: `${pct}%` }}
                  title={`Stop ${i + 1}: ${s.locality}${isUngeoref ? " (no coords)" : ""}`}
                >
                  <div
                    className={`rounded-full transition-all ${
                      isCurrent
                        ? "w-3 h-3 ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : "w-2 h-2"
                    } ${
                      isUngeoref ? "bg-destructive" : "bg-primary"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
            {summaries[summaries.length - 1]?.date}
          </span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 justify-center text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            Georeferenced
          </span>
          {ungeorefCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
              No coordinates ({ungeorefCount})
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canPrev}
          onClick={() => goTo(currentIndex - 1)}
          className="h-full min-h-[160px] self-stretch"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className={`rounded-lg border p-5 shadow-sm min-h-[160px] transition-all duration-200 ${
          isUngeoreferenced
            ? "bg-destructive/5 border-destructive/30"
            : "bg-card border-border"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-semibold ${
              isUngeoreferenced
                ? "bg-destructive/10 text-destructive"
                : "bg-botanical-light text-primary"
            }`}>
              {currentIndex + 1}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono">{loc.date}</span>
                {loc.lat !== null && loc.lon !== null ? (
                  <>
                    <span className="text-border">·</span>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    <span className="font-mono text-xs">
                      {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-border">·</span>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-destructive" />
                    <span className="text-xs text-destructive font-medium">No coordinates</span>
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
                      <div className="ml-auto flex items-center gap-1.5">
                        <a
                          href={`https://www.gbif.org/occurrence/${s.gbifID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
                          title="View specimen on GBIF"
                        >
                          <ExternalLink className="w-3 h-3" />
                          GBIF
                        </a>
                        {(s.decimalLatitude === null || s.decimalLongitude === null) && onGeoreferenceRequest && (
                          <button
                            onClick={() => onGeoreferenceRequest(s)}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/20 transition-colors"
                            title="Suggest coordinates for this specimen"
                          >
                            <Crosshair className="w-3 h-3" />
                            Georeference
                          </button>
                        )}
                      </div>
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
          className="h-full min-h-[160px] self-stretch"
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
