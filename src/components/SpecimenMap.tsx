import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SpecimenRecord } from "@/lib/types";
import { toGeoJSON } from "@/lib/analysis";

// Fix default marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  records: SpecimenRecord[];
}

export default function SpecimenMap({ records }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const geojson = toGeoJSON(records);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    if (geojson.features.length === 0) return;

    const map = L.map(containerRef.current).setView([0, 0], 3);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const geoLayer = L.geoJSON(geojson as any, {
      pointToLayer: (feature, latlng) => {
        const isInferred = feature.properties?.layer === "inferred";
        return L.circleMarker(latlng, {
          radius: isInferred ? 6 : 7,
          fillColor: isInferred ? "hsl(280, 50%, 55%)" : "hsl(152, 35%, 32%)",
          color: isInferred ? "hsl(280, 30%, 85%)" : "hsl(40, 15%, 99%)",
          weight: isInferred ? 1.5 : 2,
          opacity: 1,
          fillOpacity: isInferred ? 0.6 : 0.85,
          dashArray: isInferred ? "3 3" : undefined,
        });
      },
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
        if (feature?.properties?.type === "itinerary-route") {
          return {
            color: "hsl(280, 50%, 55%)",
            weight: 2,
            opacity: 0.6,
            dashArray: "8 6",
          };
        }
        return {};
      },
      onEachFeature: (feature, layer) => {
        if (feature.geometry.type === "Point") {
          const p = feature.properties;
          const isInferred = p.layer === "inferred";
          const titleColor = isInferred ? "hsl(280,50%,55%)" : "hsl(152,35%,32%)";
          const badge = isInferred
            ? '<span style="background:hsl(280,50%,92%);color:hsl(280,50%,35%);padding:1px 6px;border-radius:4px;font-size:0.75em;margin-left:4px">interpolated</span>'
            : '';
          layer.bindPopup(
            `<div style="font-family:DM Sans,sans-serif;max-width:260px">
              <strong style="color:${titleColor}">${p.scientificName}</strong>${badge}<br/>
              <span style="color:hsl(150,10%,45%);font-size:0.85em">${p.eventDate} · #${p.recordNumber}</span><br/>
              <span style="font-size:0.85em">${p.locality}</span>
              ${isInferred ? '<br/><em style="font-size:0.75em;color:hsl(280,40%,50%)">Position estimated from neighbouring stops</em>' : ''}
            </div>`
          );
        }
      },
    }).addTo(map);

    // Fit bounds
    const points = geojson.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates as [number, number]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(
        points.map(([lng, lat]) => [lat, lng] as [number, number])
      );
      map.fitBounds(bounds.pad(0.3));
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [records]);

  if (geojson.features.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg bg-muted">
        <p className="text-muted-foreground">No georeferenced records to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden border shadow-sm"
      style={{ height: 480 }}
    />
  );
}
