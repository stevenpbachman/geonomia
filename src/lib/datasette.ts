import { CountryCode, getDatasetteBase, getDatasetteDb } from "./countries";

export interface ClusterResult {
  cluster_num_id: string;
  recordedBy_first_family: string;
  eventDate_min: string;
  eventDate_max: string;
  cluster_num_id_count: number;
  eventDate_unique_count: number;
  georef_completeness: number;
  country: CountryCode;
}

export async function searchClusters({
  country,
  collector,
  yearStart,
  yearEnd,
  georefMin,
  georefMax,
  numberMin,
  numberMax,
}: {
  country: CountryCode;
  collector?: string;
  yearStart?: number;
  yearEnd?: number;
  georefMin?: number;
  georefMax?: number;
  numberMin?: number;
  numberMax?: number;
}): Promise<ClusterResult[]> {
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (collector?.trim()) {
    conditions.push("recordedBy_first_family like :collector");
    params.collector = `%${collector.trim()}%`;
  }
  if (yearStart) {
    conditions.push("eventDate_min >= :dateStart");
    params.dateStart = `${yearStart}-01-01`;
  }
  if (yearEnd) {
    conditions.push("eventDate_max <= :dateEnd");
    params.dateEnd = `${yearEnd}-12-31`;
  }
  if (georefMin !== undefined) {
    conditions.push("georef_completeness >= :georefMin");
    params.georefMin = String(georefMin);
  }
  if (georefMax !== undefined) {
    conditions.push("georef_completeness <= :georefMax");
    params.georefMax = String(georefMax);
  }
  if (numberMin !== undefined) {
    conditions.push("recordNumber_mainNumber_min >= :numberMin");
    params.numberMin = String(numberMin);
  }
  if (numberMax !== undefined) {
    conditions.push("recordNumber_mainNumber_max <= :numberMax");
    params.numberMax = String(numberMax);
  }

  if (conditions.length === 0) return [];

  const where = conditions.join(" and ");
  const sql = `select cluster_num_id, recordedBy_first_family, eventDate_min, eventDate_max, cluster_num_id_count, eventDate_unique_count, georef_completeness from cluster where ${where} order by eventDate_min limit 200`;

  const qs = new URLSearchParams({ sql, _shape: "array", ...params });
  const res = await fetch(`${getDatasetteBase(country)}/${getDatasetteDb(country)}.json?${qs}`);
  if (!res.ok) throw new Error(`Datasette error: ${res.status}`);
  const rows = (await res.json()) as Omit<ClusterResult, "country">[];
  return rows.map((r) => ({ ...r, country }));
}

export async function fetchClusterOccurrences(
  clusterNumId: string,
  country: CountryCode,
): Promise<Record<string, unknown>[]> {
  const sql = `select * from occ where cluster_num_id = :cid`;
  const qs = new URLSearchParams({ sql, _shape: "array", cid: clusterNumId });
  const res = await fetch(`${getDatasetteBase(country)}/${getDatasetteDb(country)}.json?${qs}`);
  if (!res.ok) throw new Error(`Datasette error: ${res.status}`);
  return await res.json();
}
