"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { islandLocations } from "@/data/events";

type EventLocationPickerProps = {
  latitude: string;
  longitude: string;
  isDisabled?: boolean;
  onChange: (coordinates: { latitude: number; longitude: number }) => void;
};

function getInitialCoordinates(latitude: string, longitude: string) {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude)) {
    return {
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      zoom: 14
    };
  }

  const island = islandLocations[7]; // Ponta Delgada

  return {
    latitude: island.latitude,
    longitude: island.longitude,
    zoom: 8
  };
}

export function EventLocationPicker({
  latitude,
  longitude,
  isDisabled = false,
  onChange
}: EventLocationPickerProps) {
  const mapId = `event-location-picker-${useId().replace(/:/g, "")}`;

  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    let resizeTimer: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const initialCoordinates = getInitialCoordinates(latitude, longitude);

    async function drawPicker() {
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

      const mapInstance = L.map(mapId, {
        scrollWheelZoom: true,
        zoomControl: !isDisabled
      }).setView([initialCoordinates.latitude, initialCoordinates.longitude], initialCoordinates.zoom);
      
      mapRef.current = mapInstance;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(mapInstance);

      const marker = L.marker([initialCoordinates.latitude, initialCoordinates.longitude], {
        draggable: !isDisabled
      }).addTo(mapInstance);
      
      markerRef.current = marker;

      const updateCoordinates = (latlng: import("leaflet").LatLng) => {
        onChangeRef.current({
          latitude: Number(latlng.lat.toFixed(6)),
          longitude: Number(latlng.lng.toFixed(6))
        });
      };

      if (!isDisabled) {
        mapInstance.on("click", (event) => {
          marker?.setLatLng(event.latlng);
          updateCoordinates(event.latlng);
        });

        marker.on("dragend", () => {
          const markerPosition = marker?.getLatLng();

          if (markerPosition) {
            updateCoordinates(markerPosition);
          }
        });
      }

      resizeTimer = window.setTimeout(() => {
        mapInstance?.invalidateSize();
      }, 160);

      const mapElement = document.getElementById(mapId);
      if (mapElement) {
        resizeObserver = new ResizeObserver(() => {
          mapInstance?.invalidateSize();
        });
        resizeObserver.observe(mapElement);
      }
    }

    void drawPicker();

    return () => {
      cancelled = true;
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isDisabled, mapId]); // only recreate map when disabled state or container id changes

  // Second useEffect to react to prop changes
  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    
    if (Number.isFinite(lat) && Number.isFinite(lng) && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (currentPos.lat !== lat || currentPos.lng !== lng) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current?.setView([lat, lng]);
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="event-location-picker">
      <div
        id={mapId}
        className="event-location-picker__map"
        aria-label="Selecionar localização exata do evento no mapa"
        role="application"
      />
      <p className="event-location-picker__hint">
        Clique no mapa ou arraste o marcador para definir o ponto exato apresentado na agenda pública.
      </p>
    </div>
  );
}
