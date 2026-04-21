import { SpecimenRecord } from "@/lib/types";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  records: SpecimenRecord[];
  selectedGbifId?: string | null;
  onRowClick?: (record: SpecimenRecord) => void;
}

type SortKey = "recordNumber" | "eventDate" | "scientificName" | "recordedBy" | "locality" | "coords";
type SortDir = "asc" | "desc";

export default function OccurrencesTable({ records, selectedGbifId, onRowClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("eventDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const arr = [...records];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "recordNumber": {
          const na = parseInt(a.recordNumber, 10);
          const nb = parseInt(b.recordNumber, 10);
          if (!isNaN(na) && !isNaN(nb)) cmp = na - nb;
          else cmp = (a.recordNumber || "").localeCompare(b.recordNumber || "");
          break;
        }
        case "eventDate":
          cmp = (a.eventDate || "").localeCompare(b.eventDate || "");
          break;
        case "scientificName":
          cmp = (a.scientificName || "").localeCompare(b.scientificName || "");
          break;
        case "recordedBy":
          cmp = (a.recordedBy || "").localeCompare(b.recordedBy || "");
          break;
        case "locality":
          cmp = (a.locality || "").localeCompare(b.locality || "");
          break;
        case "coords": {
          const ga = a.decimalLatitude !== null && a.decimalLongitude !== null ? 1 : 0;
          const gb = b.decimalLatitude !== null && b.decimalLongitude !== null ? 1 : 0;
          cmp = gb - ga;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [records, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="max-h-[320px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted sticky top-0 z-10 shadow-sm">
            <tr className="text-left">
              <th className="px-2 py-1.5 font-medium cursor-pointer select-none hover:bg-muted/80" onClick={() => toggleSort("recordNumber")}>
                #{arrow("recordNumber")}
              </th>
              <th className="px-2 py-1.5 font-medium cursor-pointer select-none hover:bg-muted/80" onClick={() => toggleSort("eventDate")}>
                Date{arrow("eventDate")}
              </th>
              <th className="px-2 py-1.5 font-medium cursor-pointer select-none hover:bg-muted/80" onClick={() => toggleSort("scientificName")}>
                Species{arrow("scientificName")}
              </th>
              <th className="px-2 py-1.5 font-medium cursor-pointer select-none hover:bg-muted/80" onClick={() => toggleSort("recordedBy")}>
                Collector{arrow("recordedBy")}
              </th>
              <th className="px-2 py-1.5 font-medium cursor-pointer select-none hover:bg-muted/80" onClick={() => toggleSort("locality")}>
                Locality{arrow("locality")}
              </th>
              <th className="px-2 py-1.5 font-medium cursor-pointer select-none hover:bg-muted/80" onClick={() => toggleSort("coords")}>
                Coords{arrow("coords")}
              </th>
              <th className="px-2 py-1.5 font-medium">GBIF</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const isSelected = selectedGbifId === r.gbifID;
              const hasCoords = r.decimalLatitude !== null && r.decimalLongitude !== null;
              return (
                <tr
                  key={r.gbifID}
                  onClick={() => onRowClick?.(r)}
                  className={`border-t border-border cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-accent/50"
                  }`}
                >
                  <td className="px-2 py-1 font-mono font-medium">{r.recordNumber?.trim() || "—"}</td>
                  <td className="px-2 py-1 font-mono whitespace-nowrap">{r.eventDate?.trim() || "—"}</td>
                  <td className="px-2 py-1">
                    <em className="truncate block max-w-[200px]" title={r.scientificName}>
                      {r.scientificName?.split(" ").slice(0, 2).join(" ") || "—"}
                    </em>
                  </td>
                  <td className="px-2 py-1 truncate max-w-[140px]" title={r.recordedBy}>{r.recordedBy?.trim() || "—"}</td>
                  <td className="px-2 py-1 truncate max-w-[220px]" title={r.locality}>{r.locality?.trim() || "—"}</td>
                  <td className="px-2 py-1 font-mono whitespace-nowrap">
                    {hasCoords ? (
                      <span>{r.decimalLatitude!.toFixed(3)}, {r.decimalLongitude!.toFixed(3)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <a
                      href={`https://www.gbif.org/occurrence/${r.gbifID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-0.5 rounded border border-border px-1 py-0.5 text-[10px] font-medium hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
