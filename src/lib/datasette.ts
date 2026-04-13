const DATASETTE_BASE = import.meta.env.DEV
  ? "/datasette"
  : "https://nickynicolson-geonomia-my.hf.space";
const DB = "geonomia";

export interface ClusterResult {
  cluster_num_id: string;
  recordedBy_first_family: string;
  eventDate_min: string;
  eventDate_max: string;
  cluster_num_id_count: number;
  eventDate_unique_count: number;
}

export async function searchClusters({
  collector,
  yearStart,
  yearEnd,
}: {
  collector?: string;
  yearStart?: number;
  yearEnd?: number;
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

  if (conditions.length === 0) return [];

  const where = conditions.join(" and ");
  const sql = `select cluster_num_id, recordedBy_first_family, eventDate_min, eventDate_max, cluster_num_id_count, eventDate_unique_count from cluster where ${where} order by eventDate_min limit 200`;

  const qs = new URLSearchParams({ sql, _shape: "array", ...params });
  const res = await fetch(`${DATASETTE_BASE}/${DB}.json?${qs}`);
  if (!res.ok) throw new Error(`Datasette error: ${res.status}`);
  return await res.json();
}

export async function fetchClusterOccurrences(
  clusterNumId: string
): Promise<Record<string, unknown>[]> {
  const sql = `select * from occ where cluster_num_id = :cid`;
  const qs = new URLSearchParams({ sql, _shape: "array", cid: clusterNumId });
  const res = await fetch(`${DATASETTE_BASE}/${DB}.json?${qs}`);
  if (!res.ok) throw new Error(`Datasette error: ${res.status}`);
  return await res.json();
}
