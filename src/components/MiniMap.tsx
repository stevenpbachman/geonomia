import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SpecimenRecord } from "@/lib/types";

interface Props {
  records: SpecimenRecord[];
}

export default function MiniMap({ records }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView([0, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "",
    }).addTo(map);

    const pts = records
      .filter(r => typeof r.decimalLatitude === "number" && typeof r.decimalLongitude === "number")
      .map(r => [r.decimalLatitude as number, r.decimalLongitude as number] as [number, number]);

    pts.forEach(([lat, lng]) => {
      L.circleMarker([lat, lng], {
        radius: 4,
        color: "hsl(180, 100%, 27%)",
        weight: 1,
        fillColor: "hsl(180, 100%, 27%)",
        fillOpacity: 0.8,
      }).addTo(map);
    });

    if (pts.length > 0) {
      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [12, 12], maxZoom: 8 });
    }

    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [records]);

  return (
    <div
      ref={containerRef}
      className="w-full h-32 rounded-md border overflow-hidden bg-muted"
      aria-label="Cluster overview map"
    />
  );
}
