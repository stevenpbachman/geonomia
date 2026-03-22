import { SpecimenRecord } from "@/lib/types";
import { getLocationSummaries } from "@/lib/analysis";
import { MapPin, MapPinOff } from "lucide-react";

interface Props {
  records: SpecimenRecord[];
}

export default function CollectingAreas({ records }: Props) {
  const summaries = getLocationSummaries(records);

  const georef = summaries.filter((s) => s.lat !== null);
  const noGeoref = summaries.filter((s) => s.lat === null);

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-lg font-semibold mb-1">Collecting Areas Summary</h3>
        <p className="text-sm text-muted-foreground">
          The collector visited {summaries.length} distinct locality–date
          combinations.{" "}
          {georef.length > 0 && (
            <>{georef.length} are georeferenced and shown as points on the map. </>
          )}
          {noGeoref.length > 0 && (
            <>
              {noGeoref.length} lack coordinates — their approximate positions
              are interpolated from chronologically adjacent stops and shown as
              dashed markers.
            </>
          )}
        </p>
      </div>

      {/* Georeferenced */}
      {georef.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            Georeferenced localities ({georef.length})
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc marker:text-primary">
            {georef.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-mono text-xs text-muted-foreground mr-1.5">
                  {s.date}
                </span>
                <span>{s.locality}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({s.specimens.length} specimen{s.specimens.length > 1 ? "s" : ""},{" "}
                  {s.lat!.toFixed(2)}°, {s.lon!.toFixed(2)}°)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Non-georeferenced */}
      {noGeoref.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <MapPinOff className="w-4 h-4 text-accent-foreground" />
            Non-georeferenced localities ({noGeoref.length})
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc marker:text-muted-foreground">
            {noGeoref.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-mono text-xs text-muted-foreground mr-1.5">
                  {s.date}
                </span>
                <span className="italic">{s.locality}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({s.specimens.length} specimen{s.specimens.length > 1 ? "s" : ""} — position interpolated)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
