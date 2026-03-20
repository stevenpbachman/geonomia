import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SpecimenRecord } from "@/lib/types";
import { toGeoJSON } from "@/lib/analysis";

// Fix default marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function FitBounds({ geojson }: { geojson: ReturnType<typeof toGeoJSON> }) {
  const map = useMap();
  useEffect(() => {
    const points = geojson.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => f.geometry.coordinates as [number, number]);
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(([lng, lat]) => [lat, lng] as [number, number]));
      map.fitBounds(bounds.pad(0.3));
    }
  }, [geojson, map]);
  return null;
}

interface Props {
  records: SpecimenRecord[];
}

export default function SpecimenMap({ records }: Props) {
  const geojson = toGeoJSON(records);
  const geoRef = useRef<L.GeoJSON | null>(null);

  if (geojson.features.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg bg-muted">
        <p className="text-muted-foreground">No georeferenced records to display</p>
      </div>
    );
  }

  const pointStyle = () => ({
    radius: 7,
    fillColor: "hsl(152, 35%, 32%)",
    color: "hsl(40, 15%, 99%)",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.85,
  });

  const polygonStyle = {
    color: "hsl(28, 60%, 55%)",
    weight: 2,
    fillColor: "hsl(28, 60%, 55%)",
    fillOpacity: 0.1,
    dashArray: "6 4",
  };

  return (
    <div className="rounded-lg overflow-hidden border shadow-sm" style={{ height: 480 }}>
      <MapContainer
        center={[0, 0]}
        zoom={3}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={JSON.stringify(geojson)}
          ref={geoRef as any}
          data={geojson as any}
          pointToLayer={(feature, latlng) => L.circleMarker(latlng, pointStyle())}
          style={(feature) =>
            feature?.geometry.type === "Polygon" ? polygonStyle : {}
          }
          onEachFeature={(feature, layer) => {
            if (feature.geometry.type === "Point") {
              const p = feature.properties;
              layer.bindPopup(
                `<div style="font-family:DM Sans,sans-serif;max-width:240px">
                  <strong style="color:hsl(152,35%,32%)">${p.scientificName}</strong><br/>
                  <span style="color:hsl(150,10%,45%);font-size:0.85em">${p.eventDate} · #${p.recordNumber}</span><br/>
                  <span style="font-size:0.85em">${p.locality}</span>
                </div>`
              );
            }
          }}
        />
        <FitBounds geojson={geojson} />
      </MapContainer>
    </div>
  );
}
