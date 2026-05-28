"use client";

import { useEffect, useId, useRef } from "react";

type EventMapDisplayProps = {
  latitude?: number | null;
  longitude?: number | null;
};

export function EventMapDisplay({ latitude, longitude }: EventMapDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function drawMap() {
      if (!containerRef.current) return;
      const L = await import("leaflet");
      if (cancelled) return;

      const DefaultIcon = L.icon({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      L.Marker.prototype.options.icon = DefaultIcon;

      const validLat = typeof latitude === 'number' && Number.isFinite(latitude) ? latitude : 37.745906;
      const validLng = typeof longitude === 'number' && Number.isFinite(longitude) ? longitude : -25.663789;

      const mapInstance = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: false,
        dragging: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false
      }).setView([validLat, validLng], 14);

      mapRef.current = mapInstance;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(mapInstance);

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        L.marker([latitude, longitude]).addTo(mapInstance);
      }
    }

    void drawMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{ height: "160px", width: "100%", borderTopLeftRadius: "12px", borderTopRightRadius: "12px", zIndex: 0 }}
      aria-label="Localização do evento no mapa"
    />
  );
}
