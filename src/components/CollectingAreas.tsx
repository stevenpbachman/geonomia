import { SpecimenRecord } from "@/lib/types";
import { getLocationSummaries } from "@/lib/analysis";
import { MapPin, TreePine } from "lucide-react";

interface Props {
  records: SpecimenRecord[];
}

export default function CollectingAreas({ records }: Props) {
  const summaries = getLocationSummaries(records);

  // Extract broad geographic regions from locality strings
  // Look for state/region names, road references, reserves, etc.
  const allLocalities = summaries.map((s) => s.locality);
  const regions = extractRegions(allLocalities);

  const georef = summaries.filter((s) => s.lat !== null);
  const noGeoref = summaries.filter((s) => s.lat === null);

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-lg font-semibold mb-1">Collecting Areas Summary</h3>
        <p className="text-sm text-muted-foreground">
          The collector visited {summaries.length} distinct locality–date
          combinations across {regions.length} broad geographic{" "}
          {regions.length === 1 ? "area" : "areas"}.{" "}
          {georef.length > 0 && (
            <>
              {georef.length} of {summaries.length} stops are georeferenced
              ({noGeoref.length > 0
                ? `${noGeoref.length} lack coordinates`
                : "all georeferenced"}
              ).
            </>
          )}
        </p>
      </div>

      {/* Broad regions */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <TreePine className="w-4 h-4 text-primary" />
            Geographic areas visited
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc marker:text-primary">
            {regions.map((region, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{region.name}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  — {region.stops} stop{region.stops > 1 ? "s" : ""},{" "}
                  {region.specimens} specimen{region.specimens > 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chronological stop list */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" />
          Stops in chronological order ({summaries.length})
        </h4>
        <ul className="space-y-1.5 pl-5 list-disc marker:text-muted-foreground">
          {summaries.map((s, i) => (
            <li key={i} className="text-sm">
              <span className="font-mono text-xs text-muted-foreground mr-1.5">
                {s.date}
              </span>
              <span className={s.lat === null ? "italic" : ""}>
                {s.locality}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                ({s.specimens.length} specimen{s.specimens.length > 1 ? "s" : ""}
                {s.lat !== null
                  ? `, ${s.lat!.toFixed(2)}°, ${s.lon!.toFixed(2)}°`
                  : " — no coordinates"}
                )
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface RegionInfo {
  name: string;
  stops: number;
  specimens: number;
}

/**
 * Extract broad geographic regions from locality strings by identifying
 * common place-name fragments (states, roads, reserves, towns).
 */
function extractRegions(localities: string[]): RegionInfo[] {
  // Group by simplified region: take the last meaningful segment
  // (often the broadest geographic descriptor)
  const regionMap = new Map<string, { stops: number; specimens: number }>();

  for (const loc of localities) {
    const region = inferRegion(loc);
    const existing = regionMap.get(region) || { stops: 0, specimens: 0 };
    existing.stops += 1;
    existing.specimens += 1; // each locality entry is one stop
    regionMap.set(region, existing);
  }

  return Array.from(regionMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.stops - a.stops);
}

function inferRegion(locality: string): string {
  // Try to extract a state or broad region from Brazilian locality strings
  const brazilianStates = [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará",
    "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão",
    "Mato Grosso do Sul", "Mato Grosso", "Minas Gerais", "Pará",
    "Paraíba", "Paraná", "Pernambuco", "Piauí", "Piaui",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul",
    "Rondônia", "Roraima", "Santa Catarina", "São Paulo",
    "Sergipe", "Tocantins",
  ];

  for (const state of brazilianStates) {
    if (locality.toLowerCase().includes(state.toLowerCase())) {
      // Normalise Piaui → Piauí
      return state === "Piaui" ? "Piauí" : state;
    }
  }

  // Check for common region markers
  const roadMatch = locality.match(/Rod\.\s*(BR\s*\d+)/i);
  if (roadMatch) {
    // Try to find a town name near the road reference
    const townMatch = locality.match(/(?:near|from|to|direction of)\s+([A-Z][a-zà-ú]+(?:\s+[A-Z][a-zà-ú]+)*)/);
    if (townMatch) return `${townMatch[1]} region (${roadMatch[1]})`;
    return `${roadMatch[1]} corridor`;
  }

  // Check for reserve/park names
  const reserveMatch = locality.match(/(Reserva|Parque|Serra|Fazenda|Mata)\s+[^\s,;]+(?:\s+[^\s,;]+)*/i);
  if (reserveMatch) return reserveMatch[0];

  // Fall back to the locality itself (trimmed)
  const trimmed = locality.length > 60 ? locality.slice(0, 57) + "…" : locality;
  return trimmed;
}
