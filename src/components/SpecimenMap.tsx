import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import * as GeocoderModule from "leaflet-control-geocoder";
import { SpecimenRecord, LocationSummary } from "@/lib/types";
import { toGeoJSON } from "@/lib/analysis";
import { loadFinestGADM, GADMResult } from "@/lib/gadm";
import { Button } from "@/components/ui/button";
import { Ruler, X, Crosshair, Layers } from "lucide-react";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const Geocoder = (GeocoderModule as any).geocoders
  ? GeocoderModule
  : (GeocoderModule as any).default || GeocoderModule;

interface Props {
  records: SpecimenRecord[];
  highlightedLocation?: LocationSummary | null;
  /** When true, next map click fires onGeorefClick instead of normal behavior */
  georefMode?: boolean;
  onGeorefClick?: (coords: { lat: number; lng: number }) => void;
}

const TILE_LAYERS: Record<string, { url: string; attribution: string; name: string }> = {
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
  topo: {
    name: "Topographic",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenTopoMap contributors',
  },
  terrain: {
    name: "Terrain",
    url: "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.jpg",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a>',
  },
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export default function SpecimenMap({ records, highlightedLocation, georefMode, onGeorefClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const highlightRef = useRef<L.CircleMarker | null>(null);
  const [activeLayer, setActiveLayer] = useState("osm");
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const measurePointsRef = useRef<L.LatLng[]>([]);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const measureHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);
  const [measureDistance, setMeasureDistance] = useState<string | null>(null);
  const [showGADM, setShowGADM] = useState(false);
  const [gadmData, setGadmData] = useState<GADMResult | null>(null);
  const [gadmLoading, setGadmLoading] = useState(false);
  const gadmLayerRef = useRef<L.GeoJSON | null>(null);

  const geojson = toGeoJSON(records);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    if (geojson.features.length === 0) return;

    const map = L.map(containerRef.current).setView([0, 0], 3);
    mapRef.current = map;

    const layer = TILE_LAYERS[activeLayer];
    tileLayerRef.current = L.tileLayer(layer.url, { attribution: layer.attribution }).addTo(map);

    // Geocoder search — position top-center
    try {
      const geocoderControl = (Geocoder as any).geocoder
        ? (Geocoder as any).geocoder({ defaultMarkGeocode: false, position: "topleft" })
        : new ((Geocoder as any).Geocoder || (L.Control as any).Geocoder)({ defaultMarkGeocode: false, position: "topleft" });

      geocoderControl.on("markgeocode", (e: any) => {
        const bbox = e.geocode.bbox;
        const poly = L.polygon([
          bbox.getSouthEast(),
          bbox.getNorthEast(),
          bbox.getNorthWest(),
          bbox.getSouthWest(),
        ]);
        map.fitBounds(poly.getBounds());
        L.marker(e.geocode.center).addTo(map)
          .bindPopup(e.geocode.name)
          .openPopup();
      });
      geocoderControl.addTo(map);

      // Move geocoder to the top-center custom container
      const geocoderEl = containerRef.current?.querySelector(".leaflet-control-geocoder") as HTMLElement;
      const topCenterContainer = containerRef.current?.querySelector(".leaflet-top-center") as HTMLElement;
      if (geocoderEl && topCenterContainer) {
        topCenterContainer.appendChild(geocoderEl);
      }
    } catch {
      // Geocoder failed to initialize — skip
    }

    // Measure layer group
    measureLayerRef.current = L.layerGroup().addTo(map);

    // Scale control
    L.control.scale({ metric: true, imperial: false }).addTo(map);

    // Specimen data
    L.geoJSON(geojson as any, {
      pointToLayer: (_feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 7,
          fillColor: "hsl(152, 35%, 32%)",
          color: "hsl(40, 15%, 99%)",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }),
      style: (feature) => {
        if (feature?.geometry.type === "Polygon") {
          return {
            color: "hsl(28, 60%, 55%)",
            weight: 2,
            fillColor: "hsl(28, 60%, 55%)",
            fillOpacity: 0.1,
            dashArray: "6 4",
          };
        }
        return {};
      },
      onEachFeature: (feature, layer) => {
        if (feature.geometry.type === "Point") {
          const p = feature.properties;
          layer.bindPopup(
            `<div style="font-family:DM Sans,sans-serif;max-width:260px">
              <strong style="color:hsl(152,35%,32%)">${p.scientificName}</strong><br/>
              <span style="color:hsl(150,10%,45%);font-size:0.85em">${p.eventDate} · #${p.recordNumber}</span><br/>
              <span style="font-size:0.85em">${p.locality}</span>
            </div>`
          );
        }
      },
    }).addTo(map);

    const points = geojson.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates as [number, number]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(
        points.map(([lng, lat]) => [lat, lng] as [number, number])
      );
      map.fitBounds(bounds.pad(0.3));
    }

    // Create top-center control container if it doesn't exist
    const mapContainer = map.getContainer();
    let topCenter = mapContainer.querySelector(".leaflet-top-center") as HTMLElement;
    if (!topCenter) {
      topCenter = document.createElement("div");
      topCenter.className = "leaflet-top-center";
      topCenter.style.cssText = "position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:1000;pointer-events:auto;";
      mapContainer.appendChild(topCenter);
    }
    // Try moving geocoder again after container creation
    const geocoderEl = mapContainer.querySelector(".leaflet-control-geocoder") as HTMLElement;
    if (geocoderEl && topCenter) {
      topCenter.appendChild(geocoderEl);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      measureLayerRef.current = null;
    };
  }, [records]);

  // Load GADM data when records change
  useEffect(() => {
    const points = geojson.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates as [number, number])
      .map(([lng, lat]) => [lat, lng] as [number, number]);

    if (points.length === 0) {
      setGadmData(null);
      setGadmLoading(false);
      return;
    }

    let cancelled = false;
    setGadmLoading(true);

    loadFinestGADM(points)
      .then((result) => {
        if (!cancelled) {
          setGadmData(result);
          setGadmLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGadmData(null);
          setGadmLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [records]);

  // Toggle GADM layer on/off
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (gadmLayerRef.current) {
      gadmLayerRef.current.remove();
      gadmLayerRef.current = null;
    }

    if (showGADM && gadmData) {
      const layer = L.geoJSON(gadmData.geojson, {
        style: () => ({
          color: "hsl(270, 50%, 55%)",
          weight: 2,
          fillColor: "hsl(270, 50%, 70%)",
          fillOpacity: 0.15,
          dashArray: "4 3",
        }),
        onEachFeature: (feature, layer) => {
          const p = feature.properties ?? {};
          const name = p.shapeName || p.NAME_4 || p.NAME_3 || p.NAME_2 || p.NAME_1 || p.NAME_0 || "Unknown";
          const type = p.shapeType || p.TYPE_4 || p.TYPE_3 || p.TYPE_2 || p.TYPE_1 || p.TYPE_0 || "";
          layer.bindPopup(
            `<div style="font-family:DM Sans,sans-serif">
              <strong>${name}</strong>${type ? ` <span style="color:#888;font-size:0.85em">(${type})</span>` : ""}
            </div>`
          );
        },
      }).addTo(map);
      gadmLayerRef.current = layer;
    }
  }, [showGADM, gadmData]);

  // Switch tile layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileLayerRef.current) return;
    const layer = TILE_LAYERS[activeLayer];
    tileLayerRef.current.setUrl(layer.url);
    tileLayerRef.current.options.attribution = layer.attribution;
    map.attributionControl.removeAttribution("");
  }, [activeLayer]);

  // Highlight selected location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (highlightRef.current) {
      highlightRef.current.remove();
      highlightRef.current = null;
    }

    if (highlightedLocation?.lat != null && highlightedLocation?.lon != null) {
      const marker = L.circleMarker(
        [highlightedLocation.lat, highlightedLocation.lon],
        {
          radius: 14,
          fillColor: "hsl(45, 90%, 55%)",
          color: "hsl(45, 90%, 40%)",
          weight: 3,
          opacity: 1,
          fillOpacity: 0.4,
        }
      ).addTo(map);
      highlightRef.current = marker;
      map.panTo([highlightedLocation.lat, highlightedLocation.lon], { animate: true });
    }
  }, [highlightedLocation]);

  // Measure tool
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (measureHandlerRef.current) {
      map.off("click", measureHandlerRef.current);
      measureHandlerRef.current = null;
    }

    if (!measuring) {
      if (containerRef.current) containerRef.current.style.cursor = "";
      return;
    }

    if (containerRef.current) containerRef.current.style.cursor = "crosshair";
    measurePointsRef.current = [];
    measureLayerRef.current?.clearLayers();
    setMeasureDistance(null);

    const handler = (e: L.LeafletMouseEvent) => {
      const pts = measurePointsRef.current;
      pts.push(e.latlng);

      L.circleMarker(e.latlng, {
        radius: 5,
        fillColor: "hsl(200, 80%, 50%)",
        color: "hsl(200, 80%, 30%)",
        weight: 2,
        fillOpacity: 1,
      }).addTo(measureLayerRef.current!);

      if (pts.length > 1) {
        L.polyline([pts[pts.length - 2], pts[pts.length - 1]], {
          color: "hsl(200, 80%, 50%)",
          weight: 3,
          dashArray: "8 4",
        }).addTo(measureLayerRef.current!);

        let total = 0;
        for (let i = 1; i < pts.length; i++) {
          total += pts[i - 1].distanceTo(pts[i]);
        }
        setMeasureDistance(formatDistance(total));
      }
    };

    measureHandlerRef.current = handler;
    map.on("click", handler);

    return () => {
      map.off("click", handler);
    };
  }, [measuring]);

  const clearMeasure = () => {
    setMeasuring(false);
    measurePointsRef.current = [];
    measureLayerRef.current?.clearLayers();
    setMeasureDistance(null);
  };

  // Georef placement mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !georefMode || measuring) return;

    if (containerRef.current) containerRef.current.style.cursor = "crosshair";

    const handler = (e: L.LeafletMouseEvent) => {
      onGeorefClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on("click", handler);

    return () => {
      map.off("click", handler);
      if (containerRef.current) containerRef.current.style.cursor = "";
    };
  }, [georefMode, measuring, onGeorefClick]);

  if (geojson.features.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg bg-muted">
        <p className="text-muted-foreground">No georeferenced records to display</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Layer switcher */}
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1">
        {Object.entries(TILE_LAYERS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setActiveLayer(key)}
            className={`px-2 py-1 text-xs rounded shadow-sm border transition-colors ${
              activeLayer === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-card-foreground border-border hover:bg-accent"
            }`}
          >
            {val.name}
          </button>
        ))}
        {/* GADM admin boundaries toggle */}
        <div className="mt-1 border-t border-border pt-1">
          <button
            onClick={() => setShowGADM(!showGADM)}
            disabled={gadmLoading || !gadmData}
            className={`px-2 py-1 text-xs rounded shadow-sm border transition-colors w-full flex items-center gap-1 ${
              showGADM
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-card-foreground border-border hover:bg-accent"
            } ${gadmLoading || !gadmData ? "opacity-50 cursor-wait" : ""}`}
          >
            <Layers className="w-3 h-3" />
            {gadmLoading ? "Loading…" : gadmData ? `GADM L${gadmData.level}` : "No GADM"}
          </button>
        </div>
      </div>

      {/* Measure tool */}
      <div className="absolute top-2 left-12 z-[1000] flex items-center gap-2">
        <Button
          size="sm"
          variant={measuring ? "default" : "outline"}
          className="h-8 gap-1.5 text-xs shadow-sm"
          onClick={() => {
            if (measuring) {
              clearMeasure();
            } else {
              setMeasuring(true);
            }
          }}
        >
          <Ruler className="w-3.5 h-3.5" />
          {measuring ? "Stop measuring" : "Measure"}
        </Button>
        {measureDistance && (
          <div className="bg-card border rounded px-2 py-1 text-xs font-medium shadow-sm flex items-center gap-1.5">
            {measureDistance}
            <button onClick={clearMeasure} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Georef mode indicator */}
      {georefMode && !measuring && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg animate-pulse flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5" />
          Click map to place georeference
        </div>
      )}

      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden border shadow-sm"
        style={{ height: 440 }}
      />
    </div>
  );
}
