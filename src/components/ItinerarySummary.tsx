import { SpecimenRecord } from "@/lib/types";
import { getItinerarySummary } from "@/lib/analysis";
import { Leaf, MapPin, Calendar, Users, Globe } from "lucide-react";

interface Props {
  records: SpecimenRecord[];
}

export default function ItinerarySummary({ records }: Props) {
  const summary = getItinerarySummary(records);

  const stats = [
    { icon: Leaf, label: "Specimens", value: summary.totalSpecimens },
    { icon: Leaf, label: "Unique taxa", value: summary.uniqueSpecies },
    { icon: MapPin, label: "Localities", value: summary.uniqueLocalities },
    { icon: Calendar, label: "Collecting days", value: summary.collectingDays },
    { icon: Globe, label: "Georeferenced", value: summary.georeferenced },
  ];

  const clusterIds = Array.from(
    new Set(records.map(r => r.cluster_num_id).filter((c): c is string => !!c))
  );

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-lg font-semibold">Itinerary Overview</h3>
          {clusterIds.map(id => (
            <span
              key={id}
              className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-mono font-medium"
            >
              Cluster #{id}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.primaryCollector} collected {summary.totalSpecimens} specimens
          across {summary.uniqueLocalities} localities
          {summary.dateRange && (
            <> from{" "}
              <span className="font-mono">{summary.dateRange.start}</span> to{" "}
              <span className="font-mono">{summary.dateRange.end}</span>
            </>
          )}
          , documenting {summary.uniqueSpecies} distinct taxa.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-muted rounded-lg p-3 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
            <div className="text-xl font-semibold tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {summary.latRange && summary.lonRange && (
        <p className="text-xs text-muted-foreground font-mono">
          Extent: {summary.latRange[0].toFixed(2)}° to {summary.latRange[1].toFixed(2)}° lat,{" "}
          {summary.lonRange[0].toFixed(2)}° to {summary.lonRange[1].toFixed(2)}° lon
        </p>
      )}
    </div>
  );
}
