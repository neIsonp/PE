"use client";

import { useEffect } from "react";
import { islandLocations } from "@/data/events";
import { escapeHtml } from "@/lib/escape-html";
import type { CacaEvent } from "@/types/events";

type EventsMapProps = {
  events: CacaEvent[];
  mapId?: string;
};

function getMarkerPosition(event: CacaEvent) {
  const location = islandLocations.find((item) => item.value === event.location);

  if (event.latitude != null && event.longitude != null) {
    return {
      latitude: event.latitude,
      longitude: event.longitude,
      label: location?.label ?? event.location,
      isExact: true
    };
  }

  if (!location) {
    return null;
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    label: location.label,
    isExact: false
  };
}

function offsetDuplicateMarker(latitude: number, longitude: number, duplicateIndex: number) {
  if (duplicateIndex === 0) {
    return { latitude, longitude };
  }

  const angle = duplicateIndex * 1.35;
  const radius = 0.008 + duplicateIndex * 0.002;

  return {
    latitude: latitude + Math.sin(angle) * radius,
    longitude: longitude + Math.cos(angle) * radius
  };
}

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
      const markerCounts = new Map<string, number>();

      events.forEach((event) => {
        const position = getMarkerPosition(event);

        if (!position || !mapInstance) {
          return;
        }

        const markerKey = `${position.latitude.toFixed(5)},${position.longitude.toFixed(5)}`;
        const duplicateIndex = markerCounts.get(markerKey) ?? 0;
        markerCounts.set(markerKey, duplicateIndex + 1);
        const visiblePosition = offsetDuplicateMarker(position.latitude, position.longitude, duplicateIndex);
        markerPositions.push([visiblePosition.latitude, visiblePosition.longitude]);

        const venue = event.venue?.trim();
        const locationLabel = venue
          ? `${escapeHtml(venue)}<br><span>${escapeHtml(position.label)}</span>`
          : escapeHtml(position.label);
        const precisionLabel = position.isExact ? "Local exato" : "Local aproximado";

        L.marker([visiblePosition.latitude, visiblePosition.longitude])
          .addTo(mapInstance)
          .bindPopup(
            `<div class="map-popup-marker"><h4>${escapeHtml(event.title)}</h4><p>${escapeHtml(event.date)} às ${escapeHtml(event.time)}</p><p>${locationLabel}</p><small>${precisionLabel}</small></div>`
          );
      });

      if (markerPositions.length > 0) {
        mapInstance.fitBounds(L.latLngBounds(markerPositions).pad(0.8), {
          maxZoom: 13
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
