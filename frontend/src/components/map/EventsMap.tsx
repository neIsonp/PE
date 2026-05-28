"use client";

import { useEffect } from "react";
import { islandLocations } from "@/data/events";
import { escapeHtml } from "@/lib/escape-html";
import type { CacaEvent } from "@/types/events";

type EventsMapProps = {
  events: CacaEvent[];
  mapId?: string;
};

export function EventsMap({ events, mapId = "map" }: EventsMapProps) {
  useEffect(() => {
    let mapInstance: import("leaflet").Map | null = null;
    let cancelled = false;
    let resizeTimer: number | null = null;

    async function drawMap() {
      const L = await import("leaflet");

      if (cancelled) {
        return;
      }

      const DefaultIcon = L.icon({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      L.Marker.prototype.options.icon = DefaultIcon;

      const azoresBounds = L.latLngBounds(
        [36.85, -31.45],
        [39.85, -24.35]
      );

      mapInstance = L.map(mapId, {
        scrollWheelZoom: false
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(mapInstance);

      const markerPositions: [number, number][] = [];

      events.forEach((event) => {
        const location = islandLocations.find((item) => item.value === event.location);

        if (!location || !mapInstance) {
          return;
        }

        markerPositions.push([location.latitude, location.longitude]);

        L.marker([location.latitude, location.longitude])
          .addTo(mapInstance)
          .bindPopup(
            `<div class="map-popup-marker"><h4>${escapeHtml(event.title)}</h4><p>${escapeHtml(event.date)} às ${escapeHtml(event.time)}</p><p>${escapeHtml(location.label)}</p></div>`
          );
      });

      if (markerPositions.length > 0) {
        mapInstance.fitBounds(L.latLngBounds(markerPositions).pad(0.8), {
          maxZoom: 9
        });
      } else {
        mapInstance.fitBounds(azoresBounds, {
          padding: [24, 24],
          maxZoom: 8
        });
      }

      resizeTimer = window.setTimeout(() => {
        mapInstance?.invalidateSize();
      }, 150);
    }

    drawMap();

    return () => {
      cancelled = true;
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      mapInstance?.remove();
    };
  }, [events, mapId]);

  return (
    <div
      id={mapId}
      className="events-map-canvas"
      role="region"
      tabIndex={0}
      aria-label="Mapa de eventos nos Açores"
    />
  );
}
