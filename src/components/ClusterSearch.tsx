import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpecimenRecord } from "@/lib/types";
import {
  ClusterResult,
  searchClusters,
  fetchClusterOccurrences,
} from "@/lib/datasette";
import { Search, Loader2, ChevronRight } from "lucide-react";

interface Props {
  onDataLoaded: (records: SpecimenRecord[]) => void;
}

export default function ClusterSearch({ onDataLoaded }: Props) {
  const [collector, setCollector] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [results, setResults] = useState<ClusterResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setError(null);
    setSearching(true);
    try {
      const data = await searchClusters({
        collector: collector || undefined,
        yearStart: yearStart ? parseInt(yearStart) : undefined,
        yearEnd: yearEnd ? parseInt(yearEnd) : undefined,
      });
      setResults(data);
      if (data.length === 0) setError("No clusters found for this search.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (cluster: ClusterResult) => {
    setLoading(cluster.cluster_num_id);
    setError(null);
    try {
      const rows = await fetchClusterOccurrences(cluster.cluster_num_id);
      const records: SpecimenRecord[] = rows.map((r: any, i: number) => ({
        gbifID: String(r.gbifID ?? r.gbif_id ?? i),
        scientificName: r.scientificName ?? r.scientific_name ?? "",
        eventDate: (r.eventDate ?? r.event_date ?? "").replace("T00:00", ""),
        recordNumber: String(r.recordNumber ?? r.record_number ?? ""),
        recordedBy: r.recordedBy ?? r.recorded_by ?? "",
        cluster_num_id: String(r.cluster_num_id ?? ""),
        decimalLongitude: r.decimalLongitude ?? r.decimal_longitude ?? null,
        decimalLatitude: r.decimalLatitude ?? r.decimal_latitude ?? null,
        locality: r.locality ?? "",
        verbatimElevation: r.verbatimElevation ?? r.verbatim_elevation ?? r.minimumElevationInMeters ?? r.minimum_elevation_in_meters ?? null,
      }));
      if (records.length === 0) {
        setError("No occurrences found for this cluster.");
        return;
      }
      onDataLoaded(records);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load cluster");
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return d.split("T")[0];
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Search clusters</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">
              Collector name
            </label>
            <Input
              value={collector}
              onChange={(e) => setCollector(e.target.value)}
              placeholder="e.g. Lewis"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-muted-foreground mb-1 block">
              Year from
            </label>
            <Input
              type="number"
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              placeholder="1980"
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-muted-foreground mb-1 block">
              Year to
            </label>
            <Input
              type="number"
              value={yearEnd}
              onChange={(e) => setYearEnd(e.target.value)}
              placeholder="1990"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching} className="gap-2">
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {results && results.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Collector</th>
                  <th className="text-left px-3 py-2 font-medium">Date range</th>
                  <th className="text-left px-3 py-2 font-medium">Cluster</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((c) => (
                  <tr
                    key={c.cluster_num_id}
                    className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleSelect(c)}
                  >
                    <td className="px-3 py-2">{c.recordedBy_first_family}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatDate(c.eventDate_min)}
                      {c.eventDate_max && c.eventDate_max !== c.eventDate_min
                        ? ` → ${formatDate(c.eventDate_max)}`
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      #{c.cluster_num_id}
                    </td>
                    <td className="px-3 py-2">
                      {loading === c.cluster_num_id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.length === 200 && (
            <p className="text-xs text-muted-foreground px-3 py-2 border-t bg-muted/30">
              Showing first 200 results — refine your search for more specific results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
