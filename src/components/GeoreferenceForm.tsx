import { useState, useEffect } from "react";
import { SpecimenRecord, GeoreferenceSuggestion } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Crosshair, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  specimen: SpecimenRecord;
  mapClickCoords?: { lat: number; lng: number } | null;
  onSubmit: (suggestion: GeoreferenceSuggestion) => void;
  onCancel: () => void;
  onRequestMapClick: () => void;
}

export default function GeoreferenceForm({
  specimen,
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

    const suggestion: GeoreferenceSuggestion = {
      gbifID: specimen.gbifID,
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
    };

    onSubmit(suggestion);
    toast.success("Georeference suggestion saved");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Georeference</h3>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
        <strong>{specimen.scientificName}</strong> · #{specimen.recordNumber}<br />
        {specimen.locality}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Latitude *</label>
          <Input
            type="number"
            step="any"
            placeholder="-23.5505"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Longitude *</label>
          <Input
            type="number"
            step="any"
            placeholder="-46.6333"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={onRequestMapClick}
      >
        <Crosshair className="w-3.5 h-3.5" />
        Click map to set coordinates
      </Button>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Uncertainty (metres)</label>
        <Input
          type="number"
          step="any"
          placeholder="1000"
          value={uncertainty}
          onChange={(e) => setUncertainty(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Remarks</label>
        <Textarea
          placeholder="Notes on how this coordinate was determined..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="text-sm min-h-[50px]"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1 gap-2">
          <Save className="w-3.5 h-3.5" />
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
