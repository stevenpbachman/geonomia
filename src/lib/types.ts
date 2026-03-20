export interface SpecimenRecord {
  gbifID: string;
  scientificName: string;
  eventDate: string;
  recordNumber: string;
  recordedBy: string;
  cluster_num_id: string;
  decimalLongitude: number | null;
  decimalLatitude: number | null;
  locality: string;
}

export interface LocationSummary {
  locality: string;
  date: string;
  specimens: SpecimenRecord[];
  lat: number | null;
  lon: number | null;
}
