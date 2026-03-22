import { SpecimenRecord, LocationSummary } from "./types";

export function getLocationSummaries(records: SpecimenRecord[]): LocationSummary[] {
  const sorted = [...records].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const grouped = new Map<string, SpecimenRecord[]>();
  for (const r of sorted) {
    const key = `${r.eventDate}||${r.locality}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const summaries: LocationSummary[] = [];
  for (const [key, specimens] of grouped) {
    const [date, locality] = key.split("||");
    const withCoords = specimens.find(
      (s) => s.decimalLatitude !== null && s.decimalLongitude !== null
    );
    summaries.push({
      locality,
      date,
      specimens,
      lat: withCoords?.decimalLatitude ?? null,
      lon: withCoords?.decimalLongitude ?? null,
    });
  }

  return summaries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function getItinerarySummary(records: SpecimenRecord[]) {
  const sorted = [...records].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const dates = sorted.map((r) => r.eventDate).filter(Boolean);
  const uniqueDates = [...new Set(dates)];
  const uniqueLocalities = [...new Set(sorted.map((r) => r.locality))];
  const uniqueSpecies = [...new Set(sorted.map((r) => r.scientificName))];
  const collectors = [...new Set(sorted.map((r) => r.recordedBy))];
  const withCoords = sorted.filter(
    (r) => r.decimalLatitude !== null && r.decimalLongitude !== null
  );

  const latRange = withCoords.length
    ? [
        Math.min(...withCoords.map((r) => r.decimalLatitude!)),
        Math.max(...withCoords.map((r) => r.decimalLatitude!)),
      ]
    : null;
  const lonRange = withCoords.length
    ? [
        Math.min(...withCoords.map((r) => r.decimalLongitude!)),
        Math.max(...withCoords.map((r) => r.decimalLongitude!)),
      ]
    : null;

  return {
    totalSpecimens: sorted.length,
    dateRange: uniqueDates.length
      ? { start: uniqueDates[0], end: uniqueDates[uniqueDates.length - 1] }
      : null,
    collectingDays: uniqueDates.length,
    uniqueLocalities: uniqueLocalities.length,
    uniqueSpecies: uniqueSpecies.length,
    collectors,
    georeferenced: withCoords.length,
    latRange,
    lonRange,
    primaryCollector: collectors[0] || "Unknown",
    clusterIds: [...new Set(sorted.map((r) => r.cluster_num_id))],
  };
}

export function toGeoJSON(records: SpecimenRecord[]) {
  const sorted = [...records].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const pointFeatures = sorted
    .filter((r) => r.decimalLatitude !== null && r.decimalLongitude !== null)
    .map((r) => ({
      type: "Feature" as const,
      properties: {
        gbifID: r.gbifID,
        scientificName: r.scientificName,
        eventDate: r.eventDate,
        recordNumber: r.recordNumber,
        recordedBy: r.recordedBy,
        locality: r.locality,
        layer: "observed",
      },
      geometry: {
        type: "Point" as const,
        coordinates: [r.decimalLongitude!, r.decimalLatitude!],
      },
    }));

  // Interpolate positions for non-georeferenced records
  const inferredFeatures = interpolateNonGeoref(sorted);

  // Convex hull polygon from observed points
  const coords = pointFeatures.map((f) => f.geometry.coordinates);
  const polygonFeatures: any[] = [];

  if (coords.length >= 3) {
    const hull = convexHull(coords);
    if (hull.length >= 3) {
      polygonFeatures.push({
        type: "Feature" as const,
        properties: {
          type: "collection-extent",
          label: "Collection area (georeferenced)",
          pointCount: coords.length,
          layer: "observed",
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[...hull, hull[0]]],
        },
      });
    }
  }

  // Route line connecting all stops chronologically (observed + inferred)
  const allChronoCoords = sorted
    .map((r) => {
      if (r.decimalLatitude !== null && r.decimalLongitude !== null) {
        return [r.decimalLongitude, r.decimalLatitude];
      }
      const inferred = inferredFeatures.find(
        (f) => f.properties.gbifID === r.gbifID
      );
      return inferred ? inferred.geometry.coordinates : null;
    })
    .filter(Boolean) as number[][];

  // Deduplicate consecutive identical coords
  const routeCoords = allChronoCoords.filter(
    (c, i) => i === 0 || c[0] !== allChronoCoords[i - 1][0] || c[1] !== allChronoCoords[i - 1][1]
  );

  const routeFeatures: any[] = [];
  if (routeCoords.length >= 2) {
    routeFeatures.push({
      type: "Feature" as const,
      properties: {
        type: "itinerary-route",
        label: "Collecting route",
        layer: "route",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: routeCoords,
      },
    });
  }

  return {
    type: "FeatureCollection" as const,
    features: [...polygonFeatures, ...routeFeatures, ...inferredFeatures, ...pointFeatures],
  };
}

/** Interpolate lat/lon for non-georeferenced records from chronological neighbours */
function interpolateNonGeoref(sorted: SpecimenRecord[]) {
  const features: {
    type: "Feature";
    properties: any;
    geometry: { type: "Point"; coordinates: [number, number] };
  }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.decimalLatitude !== null && r.decimalLongitude !== null) continue;

    // Find nearest previous and next georeferenced record
    let prev: SpecimenRecord | null = null;
    let next: SpecimenRecord | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (sorted[j].decimalLatitude !== null) { prev = sorted[j]; break; }
    }
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].decimalLatitude !== null) { next = sorted[j]; break; }
    }

    let coords: [number, number] | null = null;
    if (prev && next) {
      // Interpolate midpoint with small jitter to avoid overlap
      const jitter = (Math.random() - 0.5) * 0.15;
      coords = [
        (prev.decimalLongitude! + next.decimalLongitude!) / 2 + jitter,
        (prev.decimalLatitude! + next.decimalLatitude!) / 2 + jitter,
      ];
    } else if (prev) {
      coords = [prev.decimalLongitude! + 0.15, prev.decimalLatitude! + 0.15];
    } else if (next) {
      coords = [next.decimalLongitude! - 0.15, next.decimalLatitude! - 0.15];
    }

    if (coords) {
      features.push({
        type: "Feature",
        properties: {
          gbifID: r.gbifID,
          scientificName: r.scientificName,
          eventDate: r.eventDate,
          recordNumber: r.recordNumber,
          recordedBy: r.recordedBy,
          locality: r.locality,
          layer: "inferred",
          note: "Position interpolated — not georeferenced",
        },
        geometry: { type: "Point", coordinates: coords },
      });
    }
  }
  return features;
}

function convexHull(points: number[][]): number[][] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 2) return pts;

  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: number[][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper: number[][] = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }

  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}
