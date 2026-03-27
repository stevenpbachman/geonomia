import { useState, useEffect } from "react";
import { SpecimenRecord, GeoreferenceSuggestion } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Crosshair, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  specimen: SpecimenRecord;
  /** All specimens at the same locality, so we can apply georef to all */
  localitySpecimens?: SpecimenRecord[];
  mapClickCoords?: { lat: number; lng: number } | null;
  onSubmit: (suggestions: GeoreferenceSuggestion[]) => void;
  onCancel: () => void;
  onRequestMapClick: () => void;
}

export default function GeoreferenceForm({
  specimen,
  localitySpecimens = [],
  mapClickCoords,
  onSubmit,
  onCancel,
  onRequestMapClick,
}: Props) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [uncertainty, setUncertainty] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (mapClickCoords) {
      setLat(mapClickCoords.lat.toFixed(6));
      setLng(mapClickCoords.lng.toFixed(6));
    }
  }, [mapClickCoords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Please enter valid coordinates");
      return;
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      toast.error("Coordinates out of range");
      return;
    }

    // Apply to all specimens at the same locality
    const targets = localitySpecimens.length > 0 ? localitySpecimens : [specimen];
    const suggestions: GeoreferenceSuggestion[] = targets.map((s) => ({
      gbifID: s.gbifID,
      decimalLatitude: latNum,
      decimalLongitude: lngNum,
      geodeticDatum: "WGS84",
      coordinateUncertaintyInMeters: uncertainty ? parseFloat(uncertainty) : null,
      coordinatePrecision: null,
      pointRadiusSpatialFit: null,
      georeferenceProtocol: "",
      georeferenceSources: "",
      georeferenceRemarks: remarks,
      georeferencedBy: "",
      georeferencedDate: new Date().toISOString().split("T")[0],
    }));

    onSubmit(suggestions);
    const count = suggestions.length;
    toast.success(`Georeference saved for ${count} specimen${count > 1 ? "s" : ""}`);
  };

  const targetCount = localitySpecimens.length || 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-card border rounded-lg p-3 shadow-sm h-full overflow-y-auto resize-x" style={{ minWidth: 260, maxWidth: 420 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Georeference</h3>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-1.5">
        <strong>{specimen.locality}</strong>
        {targetCount > 1 && (
          <span className="ml-1 text-primary font-medium">· {targetCount} specimens</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <label className="text-[11px] font-medium text-muted-foreground">Lat *</label>
          <Input
            type="number"
            step="any"
            placeholder="-23.5505"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-[11px] font-medium text-muted-foreground">Lng *</label>
          <Input
            type="number"
            step="any"
            placeholder="-46.6333"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <div className="space-y-0.5 flex-1">
          <label className="text-[11px] font-medium text-muted-foreground">Uncertainty (m)</label>
          <Input
            type="number"
            step="any"
            placeholder="1000"
            value={uncertainty}
            onChange={(e) => setUncertainty(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px] whitespace-nowrap"
          onClick={onRequestMapClick}
        >
          <Crosshair className="w-3 h-3" />
          Click map
        </Button>
      </div>

      <div className="space-y-0.5">
        <label className="text-[11px] font-medium text-muted-foreground">Remarks</label>
        <Textarea
          placeholder="Notes..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="text-xs min-h-[40px]"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1 gap-1.5 h-7 text-xs">
          <Save className="w-3 h-3" />
          Save{targetCount > 1 ? ` (${targetCount})` : ""}
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
