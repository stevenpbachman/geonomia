/**
 * Load administrative boundaries by spatially querying specimen points.
 * We first determine the country from world country polygons, then fetch the
 * finest available admin layer for that country and keep only polygons that
 * contain at least one specimen point.
 */

const GEO_BOUNDARIES_API = "https://www.geoboundaries.org/api/current/gbOpen";
const COUNTRY_BOUNDARIES_URL = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const FETCH_TIMEOUT_MS = 15000;

type LatLngPoint = [number, number]; // [lat, lng]

type GeoJSONFeature = {
  geometry?: {
    type: string;
    coordinates: any;
  } | null;
  properties?: Record<string, any>;
};

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

let countriesPromise: Promise<GeoJSONFeatureCollection | null> | null = null;
const adminLayerCache = new Map<string, Promise<GeoJSONFeatureCollection | null>>();

async function fetchJSON<T>(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadCountryBoundaries(): Promise<GeoJSONFeatureCollection | null> {
  if (!countriesPromise) {
    countriesPromise = fetchJSON<GeoJSONFeatureCollection>(COUNTRY_BOUNDARIES_URL);
  }
  return countriesPromise;
}

async function fetchBoundaryLevel(iso3: string, level: number): Promise<GeoJSONFeatureCollection | null> {
  const cacheKey = `${iso3}-ADM${level}`;
  if (!adminLayerCache.has(cacheKey)) {
    adminLayerCache.set(
      cacheKey,
      (async () => {
        const meta = await fetchJSON<Record<string, any>>(`${GEO_BOUNDARIES_API}/${iso3}/ADM${level}/`);
        const geometryUrl = meta?.simplifiedGeometryGeoJSON || meta?.gjDownloadURL;
        if (!geometryUrl) return null;
        return fetchJSON<GeoJSONFeatureCollection>(geometryUrl);
      })()
    );
  }

  return adminLayerCache.get(cacheKey) ?? null;
}

function pointInRing(point: LatLngPoint, ring: [number, number][]): boolean {
  const x = point[1];
  const y = point[0];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point: LatLngPoint, polygon: [number, number][][]): boolean {
  if (!polygon.length || !pointInRing(point, polygon[0])) return false;

  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(point, polygon[i])) return false;
  }

  return true;
}

function geometryContainsPoint(geometry: GeoJSONFeature["geometry"], point: LatLngPoint): boolean {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates as [number, number][][]);
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as [number, number][][][]).some((polygon) => pointInPolygon(point, polygon));
  }

  return false;
}

function filterFeaturesByPoints(
  geojson: GeoJSONFeatureCollection,
  points: LatLngPoint[]
): { geojson: GeoJSONFeatureCollection; matchedPointCount: number } {
  const matchedFeatures = geojson.features.filter((feature) =>
    points.some((point) => geometryContainsPoint(feature.geometry, point))
  );

  const matchedPointCount = points.filter((point) =>
    matchedFeatures.some((feature) => geometryContainsPoint(feature.geometry, point))
  ).length;

  return {
    geojson: {
      type: "FeatureCollection",
      features: matchedFeatures,
    },
    matchedPointCount,
  };
}

async function getCountryISO3FromPoints(points: LatLngPoint[]): Promise<string | null> {
  const countries = await loadCountryBoundaries();
  if (!countries?.features?.length) return null;

  const matchedCountries = new Set<string>();

  for (const point of points) {
    const match = countries.features.find((feature) => geometryContainsPoint(feature.geometry, point));
    const iso3 = match?.properties?.["ISO3166-1-Alpha-3"];
    if (iso3) matchedCountries.add(iso3);
  }

  if (matchedCountries.size === 1) {
    return [...matchedCountries][0];
  }

  return null;
}

export interface GADMResult {
  geojson: GeoJSONFeatureCollection;
  level: number;
  country: string;
}

/**
 * Load the finest admin boundary level available for the points' country.
 * Returns only the polygons that spatially contain at least one point.
 */
export async function loadFinestGADM(
  points: LatLngPoint[],
  maxLevel = 4
): Promise<GADMResult | null> {
  if (points.length === 0) return null;

  const iso3 = await getCountryISO3FromPoints(points);
  if (!iso3) return null;

  let bestPartial: GADMResult | null = null;
  let bestMatchedPointCount = -1;

  for (let level = maxLevel; level >= 1; level--) {
    const geojson = await fetchBoundaryLevel(iso3, level);
    if (!geojson?.features?.length) continue;

    const filtered = filterFeaturesByPoints(geojson, points);
    if (!filtered.geojson.features.length) continue;

    if (filtered.matchedPointCount === points.length) {
      return { geojson: filtered.geojson, level, country: iso3 };
    }

    if (filtered.matchedPointCount > bestMatchedPointCount) {
      bestMatchedPointCount = filtered.matchedPointCount;
      bestPartial = { geojson: filtered.geojson, level, country: iso3 };
    }
  }

  return bestPartial;
}
