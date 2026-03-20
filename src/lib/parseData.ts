import { SpecimenRecord } from "./types";

export function parseTSV(text: string): SpecimenRecord[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim());
  const records: SpecimenRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = values[idx] || ""));

    const lon = parseFloat(row.decimalLongitude);
    const lat = parseFloat(row.decimalLatitude);

    records.push({
      gbifID: row.gbifID || String(i),
      scientificName: row.scientificName || "",
      eventDate: (row.eventDate || "").replace("T00:00", ""),
      recordNumber: row.recordNumber || "",
      recordedBy: row.recordedBy || "",
      cluster_num_id: row.cluster_num_id || "",
      decimalLongitude: isNaN(lon) ? null : lon,
      decimalLatitude: isNaN(lat) ? null : lat,
      locality: row.locality || "",
    });
  }

  return records;
}

export function parseCSV(text: string): SpecimenRecord[] {
  // Simple CSV parse — handle quoted fields
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const records: SpecimenRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = values[idx] || ""));

    const lon = parseFloat(row.decimalLongitude);
    const lat = parseFloat(row.decimalLatitude);

    records.push({
      gbifID: row.gbifID || String(i),
      scientificName: row.scientificName || "",
      eventDate: (row.eventDate || "").replace("T00:00", ""),
      recordNumber: row.recordNumber || "",
      recordedBy: row.recordedBy || "",
      cluster_num_id: row.cluster_num_id || "",
      decimalLongitude: isNaN(lon) ? null : lon,
      decimalLatitude: isNaN(lat) ? null : lat,
      locality: row.locality || "",
    });
  }

  return records;
}
