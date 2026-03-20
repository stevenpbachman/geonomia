import { SpecimenRecord } from "@/lib/types";
import { toGeoJSON } from "@/lib/analysis";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  records: SpecimenRecord[];
}

export default function GeoJSONExport({ records }: Props) {
  const geojson = toGeoJSON(records);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specimen-collection.geojson";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">GeoJSON Output</h3>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
          <Download className="w-3.5 h-3.5" />
          Download .geojson
        </Button>
      </div>
      <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-auto max-h-64 border">
        {JSON.stringify(geojson, null, 2)}
      </pre>
    </div>
  );
}
