import { useState, useMemo, useCallback } from "react";
import { SpecimenRecord, LocationSummary, GeoreferenceSuggestion } from "@/lib/types";
import { sampleData } from "@/lib/sampleData";
import { getLocationSummaries } from "@/lib/analysis";
import DataInput from "@/components/DataInput";
import ClusterSearch from "@/components/ClusterSearch";
import ItinerarySummary from "@/components/ItinerarySummary";
import SpecimenMap from "@/components/SpecimenMap";
import LocationCarousel from "@/components/LocationCarousel";
import CollectingTeams from "@/components/CollectingTeams";
import GeoJSONExport from "@/components/GeoJSONExport";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Database, Search, Upload, Download } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "georef-suggestions";

function loadSuggestions(): GeoreferenceSuggestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSuggestions(suggestions: GeoreferenceSuggestion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
}

export default function Index() {
  const [records, setRecords] = useState<SpecimenRecord[] | null>(null);
  const [showInput, setShowInput] = useState(true);
  const [highlightedLocation, setHighlightedLocation] = useState<LocationSummary | null>(null);

  // Georeferencing state
  const [mapClickCoords, setMapClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [georefMode, setGeorefMode] = useState(false);
  const [suggestions, setSuggestions] = useState<GeoreferenceSuggestion[]>(loadSuggestions);

  const handleLoad = (data: SpecimenRecord[]) => {
    setRecords(data);
    setShowInput(false);
  };

  const locationSummaries = useMemo(() => records ? getLocationSummaries(records) : [], [records]);

  const handleGeorefSubmit = useCallback((newSuggestions: GeoreferenceSuggestion[]) => {
    const ids = new Set(newSuggestions.map(s => s.gbifID));
    const updated = [...suggestions.filter(s => !ids.has(s.gbifID)), ...newSuggestions];
    setSuggestions(updated);
    saveSuggestions(updated);
    setGeorefMode(false);
    setMapClickCoords(null);
  }, [suggestions]);

  const handleRequestMapClick = useCallback(() => {
    setGeorefMode(true);
  }, []);

  const handleMapGeorefClick = useCallback((coords: { lat: number; lng: number }) => {
    setMapClickCoords(coords);
    setGeorefMode(false);
  }, []);

  const exportSuggestions = () => {
    if (suggestions.length === 0) {
      toast.info("No suggestions to export");
      return;
    }
    const headers = Object.keys(suggestions[0]).join(",");
    const rows = suggestions.map(s => Object.values(s).map(v => v === null ? "" : `"${v}"`).join(","));
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "georeference_suggestions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container max-w-5xl py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Specimen Itinerary</h1>
              <p className="text-sm text-muted-foreground">
                Visualise botanical collection sequences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {suggestions.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportSuggestions} className="gap-2">
                <Download className="w-3.5 h-3.5" />
                Georefs ({suggestions.length})
              </Button>
            )}
            {records && (
              <Button variant="outline" size="sm" onClick={() => setShowInput(!showInput)} className="gap-2">
                <Database className="w-3.5 h-3.5" />
                {showInput ? "Hide input" : "New data"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-6 space-y-6">
        {showInput && (
          <section className="scroll-reveal space-y-4">
            <Tabs defaultValue="search">
              <TabsList>
                <TabsTrigger value="search" className="gap-2">
                  <Search className="w-3.5 h-3.5" />
                  Search clusters
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  Upload CSV/TSV
                </TabsTrigger>
              </TabsList>
              <TabsContent value="search" className="mt-4">
                <ClusterSearch onDataLoaded={handleLoad} />
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                <DataInput onDataLoaded={handleLoad} />
                {!records && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => handleLoad(sampleData)}
                      className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                    >
                      Or load sample data (Lewis, G.P. — Brazil, Jan 1985)
                    </button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </section>
        )}

        {records && (
          <>
            <section className="scroll-reveal">
              <ItinerarySummary records={records} />
            </section>

            <section className="scroll-reveal space-y-2">
              <h2 className="text-lg font-semibold">Collection Map</h2>
              <SpecimenMap
                records={records}
                highlightedLocation={highlightedLocation}
                georefMode={georefMode}
                onGeorefClick={handleMapGeorefClick}
                suggestions={suggestions}
              />
            </section>

            <section className="scroll-reveal space-y-2">
              <h2 className="text-lg font-semibold">
                Locations Visited
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({locationSummaries.length} stops)
                </span>
              </h2>
              <LocationCarousel
                summaries={locationSummaries}
                onLocationSelect={setHighlightedLocation}
                suggestions={suggestions}
                mapClickCoords={mapClickCoords}
                georefMode={georefMode}
                onRequestMapClick={handleRequestMapClick}
                onGeorefSubmit={handleGeorefSubmit}
              />
            </section>

            <section className="scroll-reveal">
              <GeoJSONExport records={records} />
            </section>

            <section className="scroll-reveal">
              <CollectingTeams records={records} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
