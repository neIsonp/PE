"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { islandLocations, locationGroups } from "@/data/events";
import { getForecast } from "@/lib/weather";
import type { CacaEvent } from "@/types/events";
import { EventLocationPicker } from "./EventLocationPicker";

const coordinateRange = {
  latitude: { min: 36, max: 40 },
  longitude: { min: -32, max: -24 }
};

function getClosestIsland(latitude: number, longitude: number): string {
  let closest = islandLocations[0];
  let minDistance = Infinity;

  for (const island of islandLocations) {
    const dLat = island.latitude - latitude;
    const dLng = island.longitude - longitude;
    const distance = dLat * dLat + dLng * dLng;
    if (distance < minDistance) {
      minDistance = distance;
      closest = island;
    }
  }
  return closest.value;
}

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Indique um título com pelo menos 3 caracteres."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indique uma data válida."),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Indique uma hora válida."),
    venue: z.string().trim().min(2, "Indique o nome do espaço, sala ou endereço do evento.").max(160),
    latitude: z.string().trim().min(1, "Indique a latitude clicando no mapa."),
    longitude: z.string().trim().min(1, "Indique a longitude clicando no mapa."),
    description: z.string().trim().max(500).default("")
  })
  .superRefine((event, context) => {
    const latitude = Number(event.latitude);
    const longitude = Number(event.longitude);

    if (!Number.isFinite(latitude) || latitude < coordinateRange.latitude.min || latitude > coordinateRange.latitude.max) {
      context.addIssue({
        code: "custom",
        message: "A latitude deve estar dentro da região dos Açores.",
        path: ["latitude"]
      });
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < coordinateRange.longitude.min ||
      longitude > coordinateRange.longitude.max
    ) {
      context.addIssue({
        code: "custom",
        message: "A longitude deve estar dentro da região dos Açores.",
        path: ["longitude"]
      });
    }
  })
  .transform((event) => {
    const lat = Number(event.latitude);
    const lng = Number(event.longitude);
    
    return {
      title: event.title,
      date: event.date,
      time: event.time,
      location: getClosestIsland(lat, lng),
      venue: event.venue,
      latitude: lat,
      longitude: lng,
      description: event.description
    };
  });

type EventFormProps = {
  editingEvent: CacaEvent | null;
  isDisabled?: boolean;
  onSave: (event: CacaEvent) => Promise<void>;
  onCancelEdit: () => void;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const emptyValues = {
  title: "",
  date: "",
  time: "",
  venue: "",
  latitude: "",
  longitude: "",
  description: ""
};

export function EventForm({ editingEvent, isDisabled = false, onSave, onCancelEdit }: EventFormProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [weather, setWeather] = useState<Feedback>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingWeather, setIsCheckingWeather] = useState(false);
  const [values, setValues] = useState(emptyValues);

  const openStreetMapQuery = encodeURIComponent(
    [values.venue, "Açores"].filter(Boolean).join(", ")
  );

  useEffect(() => {
    if (!editingEvent) {
      setValues(emptyValues);
      return;
    }

    setValues({
      title: editingEvent.title,
      date: editingEvent.date,
      time: editingEvent.time,
      venue: editingEvent.venue ?? "",
      latitude: editingEvent.latitude != null ? String(editingEvent.latitude) : "",
      longitude: editingEvent.longitude != null ? String(editingEvent.longitude) : "",
      description: editingEvent.description ?? ""
    });
  }, [editingEvent]);

  function updateValue(field: keyof typeof values, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateCoordinates(coordinates: { latitude: number; longitude: number }) {
    setValues((current) => ({
      ...current,
      latitude: coordinates.latitude.toFixed(6),
      longitude: coordinates.longitude.toFixed(6)
    }));
  }


  function resetForm() {
    setValues(emptyValues);
    setFeedback(null);
    setWeather(null);
    onCancelEdit();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedEvent = eventSchema.safeParse(values);

    if (!parsedEvent.success) {
      setFeedback({
        type: "error",
        message: parsedEvent.error.issues[0]?.message ?? "Verifique os dados do evento."
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: editingEvent?.id ?? crypto.randomUUID(),
        ...parsedEvent.data
      });
      setFeedback({
        type: "success",
        message: editingEvent ? "Evento atualizado com localização exata." : "Evento criado com localização exata."
      });
      setValues(emptyValues);
      setWeather(null);
      onCancelEdit();
    } catch {
      setFeedback({
        type: "error",
        message: "Não foi possível guardar o evento."
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleWeather() {
    setIsCheckingWeather(true);
    try {
      const parsedEvent = eventSchema.safeParse({
        ...values,
        title: values.title || "Evento CACA",
        venue: values.venue || "Local do evento",
        description: values.description ?? ""
      });

      if (!parsedEvent.success) {
        setWeather({
          type: "error",
          message: "Escolha data, hora e clique no mapa para consultar o clima."
        });
        return;
      }

      const forecast = await getForecast({
        date: parsedEvent.data.date,
        time: parsedEvent.data.time,
        venue: parsedEvent.data.venue,
        latitude: parsedEvent.data.latitude,
        longitude: parsedEvent.data.longitude
      });

      setWeather({
        type: "success",
        message: `${forecast.locationLabel}: ${forecast.temperature}°C, ${forecast.label}.`
      });
    } catch (error) {
      setWeather({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível obter a previsão."
      });
    } finally {
      setIsCheckingWeather(false);
    }
  }

  return (
    <div className="c-form event-form-card" style={{ position: 'relative' }}>

      <form id="event-form" className="event-form" onSubmit={handleSubmit}>
        <fieldset disabled={isDisabled || isSaving} aria-disabled={isDisabled || isSaving} className="event-form-layout">
          <div className="event-form-layout__fields">
            <div className="event-form-grid">
            <div className="c-form__group event-form-grid__wide">
              <label htmlFor="event-title" className="form-group__label">
                Título do evento
              </label>
              <input
                type="text"
                id="event-title"
                name="event-title"
                className="c-form__input c-form__input--no-icon"
                placeholder="Ex.: Workshop de Investigação Clínica"
                value={values.title}
                onChange={(event) => updateValue("title", event.target.value)}
                required
              />
            </div>

            <div className="c-form__group">
              <label htmlFor="event-date" className="form-group__label">
                Data
              </label>
              <input
                type="date"
                id="event-date"
                name="event-date"
                className="c-form__input c-form__input--no-icon"
                value={values.date}
                onChange={(event) => updateValue("date", event.target.value)}
                required
              />
            </div>

            <div className="c-form__group">
              <label htmlFor="event-time" className="form-group__label">
                Hora
              </label>
              <input
                type="time"
                id="event-time"
                name="event-time"
                className="c-form__input c-form__input--no-icon"
                value={values.time}
                onChange={(event) => updateValue("time", event.target.value)}
                required
              />
            </div>


            <div className="c-form__group event-form-grid__wide">
              <label htmlFor="event-venue" className="form-group__label">
                Local exato
              </label>
              <input
                type="text"
                id="event-venue"
                name="event-venue"
                className="c-form__input c-form__input--no-icon"
                placeholder="Ex.: Hospital, auditório, sala ou endereço"
                value={values.venue}
                onChange={(event) => updateValue("venue", event.target.value)}
                required
              />
              <small className="event-form__hint">
                Este texto aparece na agenda e evita eventos genéricos sem contexto real.
              </small>
            </div>

            <div className="c-form__group">
              <label htmlFor="event-latitude" className="form-group__label">
                Latitude
              </label>
              <input
                type="number"
                id="event-latitude"
                name="event-latitude"
                className="c-form__input c-form__input--no-icon"
                min={coordinateRange.latitude.min}
                max={coordinateRange.latitude.max}
                step="0.000001"
                placeholder="37.745906"
                value={values.latitude}
                onChange={(event) => updateValue("latitude", event.target.value)}
              />
            </div>

            <div className="c-form__group">
              <label htmlFor="event-longitude" className="form-group__label">
                Longitude
              </label>
              <input
                type="number"
                id="event-longitude"
                name="event-longitude"
                className="c-form__input c-form__input--no-icon"
                min={coordinateRange.longitude.min}
                max={coordinateRange.longitude.max}
                step="0.000001"
                placeholder="-25.663789"
                value={values.longitude}
                onChange={(event) => updateValue("longitude", event.target.value)}
              />
            </div>

            <div className="event-location-actions">
              <a
                className="event-location-actions__link"
                href={`https://www.openstreetmap.org/search?query=${openStreetMapQuery}`}
                target="_blank"
                rel="noreferrer"
              >
                Pesquisar local no OpenStreetMap
              </a>
            </div>
            </div>

            <div className="c-form__group event-form-grid__full">
              <label htmlFor="event-description" className="form-group__label">
                Descrição do evento
              </label>
              <textarea
                id="event-description"
                name="event-description"
                className="c-form__input c-form__input--no-icon c-form__textarea"
                rows={5}
                placeholder="Descrição detalhada do evento..."
                value={values.description}
                onChange={(event) => updateValue("description", event.target.value)}
              />
            </div>

            <div className="form-actions event-form__actions">
              <button
                type="button"
                id="check-weather"
                className="btn btn--outline"
                onClick={handleWeather}
                disabled={isCheckingWeather || isSaving}
              >
                {isCheckingWeather ? "A consultar..." : "Pré-visualizar clima"}
              </button>
              {editingEvent ? (
                <button type="button" className="btn btn--outline" onClick={resetForm} disabled={isSaving}>
                  Cancelar edição
                </button>
              ) : null}
              <button type="submit" id="btn-save-event" className="btn btn--primary" disabled={isSaving}>
                {isSaving ? "A guardar..." : editingEvent ? "Atualizar evento" : "Guardar evento"}
              </button>
            </div>
          </div>

          <div className="event-form-layout__map">
            <EventLocationPicker
              latitude={values.latitude}
              longitude={values.longitude}
              isDisabled={isDisabled || isSaving}
              onChange={updateCoordinates}
            />
          </div>
        </fieldset>
      </form>

      {weather ? (
        <div
          className={`weather-info-box weather-${weather.type === "success" ? "success" : "error"}-box`}
          role="status"
        >
          {weather.message}
        </div>
      ) : null}
      {feedback ? (
        <div className={`form-feedback form-feedback--${feedback.type}`} role="status">
          {feedback.message}
        </div>
      ) : null}
    </div>
  );
}
