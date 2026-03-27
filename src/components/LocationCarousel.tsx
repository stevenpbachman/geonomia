import { useEffect, useState, useMemo } from "react";
import { LocationSummary, GeoreferenceSuggestion, SpecimenRecord } from "@/lib/types";
import { MapPin, Calendar, Leaf, ChevronLeft, ChevronRight, User, Hash, AlertTriangle, ExternalLink, Crosshair, Save, PanelLeftOpen, PanelLeftClose, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Props {
  summaries: LocationSummary[];
  onLocationSelect?: (summary: LocationSummary | null) => void;
  suggestions?: GeoreferenceSuggestion[];
  mapClickCoords?: { lat: number; lng: number } | null;
  georefMode?: boolean;
  onRequestMapClick?: () => void;
  onGeorefSubmit?: (suggestions: GeoreferenceSuggestion[]) => void;
  mapSlot?: React.ReactNode;
}

function InlineGeorefForm({
  specimens,
  mapClickCoords,
  onRequestMapClick,
  onSubmit,
  disabled = false,
}: {
  specimens: SpecimenRecord[];
  mapClickCoords?: { lat: number; lng: number } | null;
  onRequestMapClick?: () => void;
  onSubmit?: (suggestions: GeoreferenceSuggestion[]) => void;
  disabled?: boolean;
}) {
  // Pre-fill from specimen coordinates
  const firstWithCoords = specimens.find(s => s.decimalLatitude !== null && s.decimalLongitude !== null);
  const defaultLat = firstWithCoords?.decimalLatitude?.toFixed(6) ?? "";
  const defaultLng = firstWithCoords?.decimalLongitude?.toFixed(6) ?? "";

  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [uncertainty, setUncertainty] = useState("");
  const [remarks, setRemarks] = useState("");

  // Reset when specimens change
  useEffect(() => {
    const s = specimens.find(sp => sp.decimalLatitude !== null && sp.decimalLongitude !== null);
    setLat(s?.decimalLatitude?.toFixed(6) ?? "");
    setLng(s?.decimalLongitude?.toFixed(6) ?? "");
    setUncertainty("");
    setRemarks("");
  }, [specimens]);

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

    const suggestions: GeoreferenceSuggestion[] = specimens.map((s) => ({
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

    onSubmit?.(suggestions);
    toast.success(`Georeference saved for ${suggestions.length} specimen${suggestions.length > 1 ? "s" : ""}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5 pt-2 border-t border-border mt-2">
      <fieldset disabled={disabled} className={disabled ? "opacity-50" : ""}>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="space-y-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Lat</label>
            <Input type="number" step="any" placeholder="" value={lat} onChange={(e) => setLat(e.target.value)} className="h-6 text-[11px]" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Lng</label>
            <Input type="number" step="any" placeholder="" value={lng} onChange={(e) => setLng(e.target.value)} className="h-6 text-[11px]" />
          </div>
        </div>
        <div className="flex gap-1.5 items-end mt-1.5">
          <div className="space-y-0.5 flex-1">
            <label className="text-[10px] font-medium text-muted-foreground">Uncertainty (m)</label>
            <Input type="number" step="any" placeholder="" value={uncertainty} onChange={(e) => setUncertainty(e.target.value)} className="h-6 text-[11px]" />
          </div>
          <Button type="button" variant="outline" size="sm" className="h-6 gap-1 text-[10px] px-2" onClick={onRequestMapClick}>
            <Crosshair className="w-3 h-3" /> Map
          </Button>
        </div>
        <div className="space-y-0.5 mt-1.5">
          <label className="text-[10px] font-medium text-muted-foreground">Remarks</label>
          <Textarea placeholder="Notes..." value={remarks} onChange={(e) => setRemarks(e.target.value)} className="text-[11px] min-h-[28px]" />
        </div>
        <Button type="submit" size="sm" className="w-full gap-1.5 h-6 text-[11px] mt-1.5">
          <Save className="w-3 h-3" /> Save
        </Button>
      </fieldset>
    </form>
  );
}

function SpecimenInfo({ specimen, suggestedIds }: { specimen: SpecimenRecord; suggestedIds: Set<string> }) {
  const hasSuggestion = suggestedIds.has(specimen.gbifID);
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-[11px]">
        <User className="w-2.5 h-2.5 text-primary flex-shrink-0" />
        <span className="font-medium truncate">{specimen.recordedBy}</span>
        <Hash className="w-2 h-2 flex-shrink-0" />
        <span className="font-mono font-semibold">{specimen.recordNumber}</span>
        {hasSuggestion && <span className="text-[9px] text-blue-500 font-medium ml-auto">✓</span>}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Leaf className="w-2.5 h-2.5 text-primary flex-shrink-0" />
        <em className="truncate">{specimen.scientificName.split(" ").slice(0, 2).join(" ")}</em>
        <a
          href={`https://www.gbif.org/occurrence/${specimen.gbifID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-0.5 rounded border border-border px-1 py-0 text-[9px] font-medium hover:bg-accent transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-2 h-2" /> GBIF
        </a>
      </div>
    </div>
  );
}

export default function LocationCarousel({
  summaries,
  onLocationSelect,
  suggestions = [],
  mapClickCoords,
  georefMode,
  onRequestMapClick,
  onGeorefSubmit,
  mapSlot,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const suggestedIds = useMemo(() => new Set(suggestions.map(s => s.gbifID)), [suggestions]);
  const suggestionMap = useMemo(() => {
    const m = new Map<string, GeoreferenceSuggestion>();
    suggestions.forEach(s => m.set(s.gbifID, s));
    return m;
  }, [suggestions]);

  useEffect(() => {
    setCurrentIndex(0);
    const first = summaries[0];
    onLocationSelect?.(first?.lat !== null && first?.lon !== null ? first : null);
  }, [summaries, onLocationSelect]);

  const loc = summaries[currentIndex];
  if (!loc) return null;

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < summaries.length - 1;
  const isUngeoreferenced = loc.lat === null || loc.lon === null;
  const hasSuggestion = isUngeoreferenced && loc.specimens.some(s => suggestedIds.has(s.gbifID));
  const needsGeoref = isUngeoreferenced && !hasSuggestion;

  const ungeorefSpecimens = loc.specimens.filter(
    s => s.decimalLatitude === null || s.decimalLongitude === null
  );

  const goTo = (idx: number) => {
    setCurrentIndex(idx);
    const s = summaries[idx];
    if (s?.lat !== null && s?.lon !== null) {
      onLocationSelect?.(s);
    } else {
      const sugSpec = s?.specimens.find(sp => suggestionMap.has(sp.gbifID));
      if (sugSpec) {
        const sug = suggestionMap.get(sugSpec.gbifID)!;
        onLocationSelect?.({ ...s, lat: sug.decimalLatitude, lon: sug.decimalLongitude });
      } else {
        onLocationSelect?.(null);
      }
    }
  };

  const ungeorefCount = summaries.filter(s => s.lat === null || s.lon === null).length;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Top row: sliding panel + map side by side */}
      <div className="flex w-full items-stretch" style={{ minHeight: 400 }}>
        {/* Side panel - slides left-to-right */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 ${
            panelOpen ? "w-[300px] mr-3" : "w-0"
          }`}
        >
          <div className="w-[300px] h-full flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 h-0">
              <div className={`rounded-lg border px-2.5 py-2 text-xs h-full flex flex-col ${
                editMode ? "ring-2 ring-primary/40" : ""
              } ${
                needsGeoref ? "bg-destructive/5 border-destructive/20" : hasSuggestion ? "bg-blue-500/5 border-blue-500/30" : "bg-card border-border"
              }`}>
                {/* Panel controls */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                      needsGeoref ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    }`}>
                      {currentIndex + 1}
                    </div>
                    <Button
                      variant={editMode ? "default" : "outline"}
                      size="sm"
                      className="h-5 gap-1 text-[10px] px-1.5"
                      onClick={() => setEditMode(!editMode)}
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      {editMode ? "Editing" : "Edit"}
                    </Button>
                    {needsGeoref && <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <a href={`https://www.gbif.org/occurrence/${loc.specimens[0]?.gbifID}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 rounded border border-border px-1 text-[9px] font-medium hover:bg-accent transition-colors flex-shrink-0">
                      <ExternalLink className="w-2 h-2" /> GBIF
                    </a>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setPanelOpen(false)}>
                      <PanelLeftClose className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Fixed fields */}
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
                  <span className="text-muted-foreground font-medium">Date</span>
                  <span className="font-mono">{loc.date}</span>

                  <span className="text-muted-foreground font-medium">Collector</span>
                  <span className="truncate">{loc.specimens[0]?.recordedBy}</span>

                </div>

                {/* Specimen number pills - always shown */}
                <Tabs defaultValue="0" className="w-full mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium flex-shrink-0">Number</span>
                    <TabsList className="h-6 p-0.5 flex-1">
                      {loc.specimens.map((s, i) => (
                        <TabsTrigger key={s.gbifID} value={String(i)} className="text-[10px] px-1.5 py-0 h-5 flex-1">
                          #{s.recordNumber}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  {loc.specimens.map((s, i) => (
                    <TabsContent key={s.gbifID} value={String(i)} className="mt-0.5">
                      <div className="text-[11px]">
                        <span className="text-muted-foreground font-medium mr-2">Species</span>
                        <em className="truncate">{s.scientificName.split(" ").slice(0, 2).join(" ")}</em>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Locality - fixed height, scrollable */}
                <div className="mt-1.5 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">Locality</span>
                  <div className="h-[32px] overflow-y-auto text-[11px] leading-tight border rounded px-1.5 py-1 bg-background">
                    {loc.locality}
                  </div>
                </div>

                {/* Georef form - always shown */}
                <div className="mt-auto pt-1.5">
                  <InlineGeorefForm
                    specimens={loc.specimens}
                    mapClickCoords={mapClickCoords}
                    onRequestMapClick={onRequestMapClick}
                    onSubmit={onGeorefSubmit}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Map + panel reopen button */}
        <div className="flex-1 min-w-0 relative">
          {mapSlot}
          {!panelOpen && (
            <div className="absolute top-2 left-2 z-[1000]">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 shadow-md"
                onClick={() => setPanelOpen(true)}
                title="Open panel"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal scrubber below */}
      <div className="px-1">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={!canPrev} onClick={() => goTo(currentIndex - 1)} className="h-6 w-6 flex-shrink-0">
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <div className="flex-1 relative h-4">
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] bg-border rounded-full" />
            {summaries.length > 1 && (
              <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[2px] bg-muted-foreground/30 rounded-full" style={{ width: `${(currentIndex / (summaries.length - 1)) * 100}%` }} />
            )}
            {summaries.map((s, i) => {
              const isUngeoref = s.lat === null || s.lon === null;
              const isSuggested = isUngeoref && s.specimens.some(sp => suggestedIds.has(sp.gbifID));
              const isCurrent = i === currentIndex;
              const pct = summaries.length > 1 ? (i / (summaries.length - 1)) * 100 : 50;
              return (
                <button key={i} onClick={() => goTo(i)} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-0.5" style={{ left: `${pct}%` }} title={`Stop ${i + 1}: ${s.locality}`}>
                  <div className={`rounded-full transition-all ${isCurrent ? "w-2.5 h-2.5 ring-2 ring-primary ring-offset-1 ring-offset-background" : "w-1.5 h-1.5"} ${isUngeoref ? (isSuggested ? "bg-blue-500" : "bg-destructive") : "bg-primary"}`} />
                </button>
              );
            })}
          </div>
          <Button variant="ghost" size="icon" disabled={!canNext} onClick={() => goTo(currentIndex + 1)} className="h-6 w-6 flex-shrink-0">
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 justify-center text-[9px] text-muted-foreground mt-1">
          <span className="flex items-center gap-0.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" /> OK</span>
          {suggestions.length > 0 && <span className="flex items-center gap-0.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" /> Sug</span>}
          {ungeorefCount > 0 && <span className="flex items-center gap-0.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" /> No ({ungeorefCount})</span>}
        </div>
      </div>
    </div>
  );
}
