const DATASETTE_BASE = "http://10.152.129.252:8001";
const DB = "geonomia";

export interface ClusterResult {
  cluster_num_id: string;
  recordedBy_first_family: string;
  eventDate_min: string;
  eventDate_max: string;
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
  const sql = `select cluster_num_id, recordedBy_first_family, eventDate_min, eventDate_max from cluster where ${where} order by eventDate_min limit 200`;

  const url = new URL(`${DATASETTE_BASE}/${DB}.json`);
  url.searchParams.set("sql", sql);
  url.searchParams.set("_shape", "array");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Datasette error: ${res.status}`);
  return await res.json();
}

export async function fetchClusterOccurrences(
  clusterNumId: string
): Promise<Record<string, unknown>[]> {
  const sql = `select * from occ where cluster_num_id = :cid order by eventDate, recordNumber`;
  const url = new URL(`${DATASETTE_BASE}/${DB}.json`);
  url.searchParams.set("sql", sql);
  url.searchParams.set("_shape", "array");
  url.searchParams.set("cid", clusterNumId);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Datasette error: ${res.status}`);
  return await res.json();
}
