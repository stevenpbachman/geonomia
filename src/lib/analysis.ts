import { SpecimenRecord, LocationSummary } from "./types";

export function getLocationSummaries(records: SpecimenRecord[]): LocationSummary[] {
  const sorted = [...records].sort((a, b) => {
    const dateDiff = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    // Within same date, sort by record number numerically
    const numA = parseInt(a.recordNumber, 10) || 0;
    const numB = parseInt(b.recordNumber, 10) || 0;
    return numA - numB;
  });

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
  const pointFeatures = records
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
      },
      geometry: {
        type: "Point" as const,
        coordinates: [r.decimalLongitude!, r.decimalLatitude!],
      },
    }));

  // Convex hull polygon from georeferenced points
  const coords = pointFeatures.map((f) => f.geometry.coordinates);
  const polygonFeatures: any[] = [];

  if (coords.length >= 3) {
    const hull = convexHull(coords);
    if (hull.length >= 3) {
      polygonFeatures.push({
        type: "Feature" as const,
        properties: {
          type: "collection-extent",
          label: "Minimum convex polygon (georeferenced specimens)",
          pointCount: coords.length,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[...hull, hull[0]]],
        },
      });
    }
  }

  return {
    type: "FeatureCollection" as const,
    features: [...polygonFeatures, ...pointFeatures],
  };
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
