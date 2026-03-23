import { useState } from "react";
import { SpecimenRecord, LocationSummary } from "@/lib/types";
import { sampleData } from "@/lib/sampleData";
import { getLocationSummaries } from "@/lib/analysis";
import DataInput from "@/components/DataInput";
import ItinerarySummary from "@/components/ItinerarySummary";
import SpecimenMap from "@/components/SpecimenMap";
import LocationCarousel from "@/components/LocationCarousel";
import CollectingTeams from "@/components/CollectingTeams";
import GeoJSONExport from "@/components/GeoJSONExport";
import { Button } from "@/components/ui/button";
import { Leaf, Database } from "lucide-react";

export default function Index() {
  const [records, setRecords] = useState<SpecimenRecord[] | null>(null);
  const [showInput, setShowInput] = useState(true);
  const [highlightedLocation, setHighlightedLocation] = useState<LocationSummary | null>(null);

  const handleLoad = (data: SpecimenRecord[]) => {
    setRecords(data);
    setShowInput(false);
  };

  const locationSummaries = records ? getLocationSummaries(records) : [];

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
          {records && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInput(!showInput)}
              className="gap-2"
            >
              <Database className="w-3.5 h-3.5" />
              {showInput ? "Hide input" : "New data"}
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-5xl py-8 space-y-8">
        {showInput && (
          <section className="scroll-reveal space-y-4">
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
          </section>
        )}

        {records && (
          <>
            <section className="scroll-reveal">
              <ItinerarySummary records={records} />
            </section>

            <section className="scroll-reveal space-y-3">
              <h2 className="text-lg font-semibold">Collection Map</h2>
              <p className="text-sm text-muted-foreground">
                Green markers = georeferenced specimens · Dashed orange polygon = MCP · Yellow highlight = selected stop
              </p>
              <SpecimenMap records={records} highlightedLocation={highlightedLocation} />
            </section>

            <section className="scroll-reveal space-y-3">
              <h2 className="text-lg font-semibold">
                Locations Visited
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({locationSummaries.length} stops)
                </span>
              </h2>
              <LocationCarousel
                summaries={locationSummaries}
                onLocationSelect={setHighlightedLocation}
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
