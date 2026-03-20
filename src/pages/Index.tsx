import { useState } from "react";
import { SpecimenRecord } from "@/lib/types";
import { sampleData } from "@/lib/sampleData";
import { getLocationSummaries } from "@/lib/analysis";
import DataInput from "@/components/DataInput";
import LocationSummaries from "@/components/LocationSummaries";
import ItinerarySummary from "@/components/ItinerarySummary";
import SpecimenMap from "@/components/SpecimenMap";
import GeoJSONExport from "@/components/GeoJSONExport";
import { Button } from "@/components/ui/button";
import { Leaf, Database } from "lucide-react";

export default function Index() {
  const [records, setRecords] = useState<SpecimenRecord[] | null>(null);
  const [showInput, setShowInput] = useState(true);

  const handleLoad = (data: SpecimenRecord[]) => {
    setRecords(data);
    setShowInput(false);
  };

  const locationSummaries = records ? getLocationSummaries(records) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Data Input */}
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
            {/* Overall Summary */}
            <section className="scroll-reveal">
              <ItinerarySummary records={records} />
            </section>

            {/* Map */}
            <section className="scroll-reveal space-y-3">
              <h2 className="text-lg font-semibold">Collection Map</h2>
              <SpecimenMap records={records} />
            </section>

            {/* Location Summaries */}
            <section className="scroll-reveal space-y-3">
              <h2 className="text-lg font-semibold">
                Locations Visited
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({locationSummaries.length} stops)
                </span>
              </h2>
              <LocationSummaries summaries={locationSummaries} />
            </section>

            {/* GeoJSON */}
            <section className="scroll-reveal">
              <GeoJSONExport records={records} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
