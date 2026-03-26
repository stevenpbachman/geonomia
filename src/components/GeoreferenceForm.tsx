import { useState, useEffect } from "react";
import { SpecimenRecord, GeoreferenceSuggestion } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Crosshair, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  specimen: SpecimenRecord;
  /** When the user clicks the map, this coordinate is passed in */
  mapClickCoords?: { lat: number; lng: number } | null;
  onSubmit: (suggestion: GeoreferenceSuggestion) => void;
  onCancel: () => void;
  onRequestMapClick: () => void;
}

const DATUM_OPTIONS = [
  "WGS84",
  "EPSG:4326",
  "NAD83",
  "NAD27",
  "unknown",
];

const PROTOCOL_OPTIONS = [
  "georeferencing best practices",
  "MaNIS/HerpNet/ORNIS Georeferencing Guidelines",
  "BioGeomancer",
  "Google Earth/Maps",
  "GPS",
  "locality description",
  "other",
];

export default function GeoreferenceForm({
  specimen,
  mapClickCoords,
  onSubmit,
  onCancel,
  onRequestMapClick,
}: Props) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [datum, setDatum] = useState("WGS84");
  const [uncertainty, setUncertainty] = useState("");
  const [precision, setPrecision] = useState("");
  const [spatialFit, setSpatialFit] = useState("");
  const [protocol, setProtocol] = useState("");
  const [sources, setSources] = useState("");
  const [remarks, setRemarks] = useState("");
  const [referencedBy, setReferencedBy] = useState("");

  // Fill coords from map click
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
    if (!referencedBy.trim()) {
      toast.error("Please enter your name (georeferencedBy)");
      return;
    }

    const suggestion: GeoreferenceSuggestion = {
      gbifID: specimen.gbifID,
      decimalLatitude: latNum,
      decimalLongitude: lngNum,
      geodeticDatum: datum,
      coordinateUncertaintyInMeters: uncertainty ? parseFloat(uncertainty) : null,
      coordinatePrecision: precision ? parseFloat(precision) : null,
      pointRadiusSpatialFit: spatialFit ? parseFloat(spatialFit) : null,
      georeferenceProtocol: protocol,
      georeferenceSources: sources,
      georeferenceRemarks: remarks,
      georeferencedBy: referencedBy.trim(),
      georeferencedDate: new Date().toISOString().split("T")[0],
    };

    onSubmit(suggestion);
    toast.success("Georeference suggestion saved locally");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Suggest Georeference</h3>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
        <strong>{specimen.scientificName}</strong> · #{specimen.recordNumber} · {specimen.locality}
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">decimalLatitude *</label>
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
          <label className="text-xs font-medium text-muted-foreground">decimalLongitude *</label>
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

      {/* Datum & uncertainty */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">geodeticDatum</label>
          <Select value={datum} onValueChange={setDatum}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATUM_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">coordinateUncertaintyInMeters</label>
          <Input
            type="number"
            step="any"
            placeholder="1000"
            value={uncertainty}
            onChange={(e) => setUncertainty(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">coordinatePrecision</label>
          <Input
            type="number"
            step="any"
            placeholder="0.0001"
            value={precision}
            onChange={(e) => setPrecision(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">pointRadiusSpatialFit</label>
          <Input
            type="number"
            step="any"
            placeholder=""
            value={spatialFit}
            onChange={(e) => setSpatialFit(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Protocol & sources */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">georeferenceProtocol</label>
        <Select value={protocol} onValueChange={setProtocol}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select protocol..." />
          </SelectTrigger>
          <SelectContent>
            {PROTOCOL_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">georeferenceSources</label>
        <Input
          placeholder="e.g. Google Earth, gazetteers, collector notes"
          value={sources}
          onChange={(e) => setSources(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">georeferenceRemarks</label>
        <Textarea
          placeholder="Notes on how this coordinate was determined..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="text-sm min-h-[60px]"
        />
      </div>

      {/* Who */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">georeferencedBy *</label>
        <Input
          placeholder="Your name"
          value={referencedBy}
          onChange={(e) => setReferencedBy(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1 gap-2">
          <Save className="w-3.5 h-3.5" />
          Save suggestion
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
