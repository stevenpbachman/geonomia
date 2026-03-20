import { LocationSummary } from "@/lib/types";
import { MapPin, Calendar, Leaf } from "lucide-react";

interface Props {
  summaries: LocationSummary[];
}

export default function LocationSummaries({ summaries }: Props) {
  return (
    <div className="space-y-3">
      {summaries.map((loc, i) => (
        <div
          key={i}
          className="bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-botanical-light flex items-center justify-center text-primary font-mono text-sm font-medium">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-mono">{loc.date}</span>
                {loc.lat !== null && loc.lon !== null && (
                  <>
                    <span className="text-border">·</span>
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">
                      {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm font-medium leading-snug mb-2">{loc.locality}</p>
              <div className="flex flex-wrap gap-1.5">
                {loc.specimens.map((s) => (
                  <span
                    key={s.gbifID}
                    className="inline-flex items-center gap-1 text-xs bg-botanical-light text-primary px-2 py-0.5 rounded-md"
                  >
                    <Leaf className="w-3 h-3" />
                    <em>{s.scientificName.split(" ").slice(0, 2).join(" ")}</em>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
