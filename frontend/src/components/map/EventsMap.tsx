"use client";

import { useEffect, useRef } from "react";
import { islandLocations } from "@/data/events";
import { escapeHtml } from "@/lib/escape-html";
import type { CacaEvent } from "@/types/events";

type EventsMapProps = {
  events: CacaEvent[];
  mapId?: string;
};

export function EventsMap({ events, mapId = "map" }: EventsMapProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    let mapInstance: import("leaflet").Map | null = null;
    let cancelled = false;

    async function drawMap() {
      const L = await import("leaflet");

      if (cancelled || initializedRef.current) {
        return;
      }

      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      L.Marker.prototype.options.icon = DefaultIcon;

      mapInstance = L.map(mapId).setView([38.5, -28], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(mapInstance);

      events.forEach((event) => {
        const location = islandLocations.find((item) => item.value === event.location);

        if (!location || !mapInstance) {
          return;
        }

        L.marker([location.latitude, location.longitude])
          .addTo(mapInstance)
          .bindPopup(
            `<div class="map-popup-marker"><h4 style="margin:0;">${escapeHtml(event.title)}</h4><p style="margin:5px 0 0;">📅 ${escapeHtml(event.date)} | 📍 ${escapeHtml(location.label)}</p></div>`
          );
      });

      initializedRef.current = true;
    }

    drawMap();

    return () => {
      cancelled = true;
      initializedRef.current = false;
      mapInstance?.remove();
    };
  }, [events, mapId]);

  return <div id={mapId} aria-label="Mapa de eventos nos Açores" />;
}
