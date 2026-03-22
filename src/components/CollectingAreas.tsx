import { SpecimenRecord } from "@/lib/types";
import { getLocationSummaries } from "@/lib/analysis";
import { TreePine } from "lucide-react";

interface Props {
  records: SpecimenRecord[];
}

export default function CollectingAreas({ records }: Props) {
  const summaries = getLocationSummaries(records);
  const allLocalities = summaries.map((s) => s.locality);
  const regions = extractRegions(allLocalities, summaries);

  const georef = summaries.filter((s) => s.lat !== null);
  const noGeoref = summaries.filter((s) => s.lat === null);

  // Build narrative
  const narrative = buildNarrative(regions, summaries, georef, noGeoref, records);

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <TreePine className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Collecting Areas</h3>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
        {narrative.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}

interface RegionInfo {
  name: string;
  stops: number;
  specimens: number;
  dates: string[];
  localities: string[];
}

function buildNarrative(
  regions: RegionInfo[],
  summaries: { date: string; locality: string; lat: number | null }[],
  georef: typeof summaries,
  noGeoref: typeof summaries,
  records: SpecimenRecord[]
): string[] {
  const paras: string[] = [];

  // Opening sentence
  const dateRange = summaries.length
    ? `${summaries[0].date} to ${summaries[summaries.length - 1].date}`
    : "";
  paras.push(
    `Over ${summaries.length} collecting stops${dateRange ? ` (${dateRange})` : ""}, ` +
    `the collector gathered ${records.length} specimens across ${regions.length} broad geographic ` +
    `${regions.length === 1 ? "area" : "areas"}. ` +
    `${georef.length} of ${summaries.length} stops are georeferenced` +
    `${noGeoref.length > 0 ? `, while ${noGeoref.length} lack coordinates` : ""}.`
  );

  // Per-region descriptions
  for (const region of regions) {
    const dateSpan =
      region.dates.length > 1
        ? `from ${region.dates[0]} to ${region.dates[region.dates.length - 1]}`
        : `on ${region.dates[0]}`;

    const localitySummary =
      region.localities.length <= 2
        ? region.localities.join(" and ")
        : `${region.localities.slice(0, 2).join(", ")} and ${region.localities.length - 2} other ${region.localities.length - 2 === 1 ? "site" : "sites"}`;

    paras.push(
      `In the ${region.name} area, ${region.specimens} specimen${region.specimens > 1 ? "s were" : " was"} ` +
      `collected ${dateSpan} across ${region.stops} stop${region.stops > 1 ? "s" : ""}, ` +
      `including ${localitySummary}.`
    );
  }

  return paras;
}

function extractRegions(
  localities: string[],
  summaries: { date: string; locality: string; lat: number | null; specimens: { gbifID: string }[] }[]
): RegionInfo[] {
  const regionMap = new Map<string, RegionInfo>();

  for (let i = 0; i < localities.length; i++) {
    const loc = localities[i];
    const s = summaries[i];
    const region = inferRegion(loc);
    if (!regionMap.has(region)) {
      regionMap.set(region, { name: region, stops: 0, specimens: 0, dates: [], localities: [] });
    }
    const r = regionMap.get(region)!;
    r.stops += 1;
    r.specimens += s.specimens.length;
    r.dates.push(s.date);
    if (!r.localities.includes(truncateLocality(loc))) {
      r.localities.push(truncateLocality(loc));
    }
  }

  return Array.from(regionMap.values()).sort((a, b) => {
    // Sort by earliest date
    return a.dates[0].localeCompare(b.dates[0]);
  });
}

function truncateLocality(loc: string): string {
  return loc.length > 50 ? loc.slice(0, 47) + "…" : loc;
}

function inferRegion(locality: string): string {
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
      return state === "Piaui" ? "Piauí" : state;
    }
  }

  const roadMatch = locality.match(/(?:Rod\.?\s*)?BR[\s-]*(\d+)/i);
  if (roadMatch) {
    // Try to find nearby place names
    const placeMatch = locality.match(/(?:near|from|to|direction of|–)\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/);
    if (placeMatch) return `${placeMatch[1]} (BR-${roadMatch[1]})`;
    return `BR-${roadMatch[1]} corridor`;
  }

  const reserveMatch = locality.match(/(Reserva|Parque|Serra|Fazenda|Mata)\s+[^\s,;]+(?:\s+[^\s,;]+)*/i);
  if (reserveMatch) return reserveMatch[0];

  return locality.length > 40 ? locality.slice(0, 37) + "…" : locality;
}
