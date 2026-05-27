"use client";

import { FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { islandLocations, locationGroups } from "@/data/events";
import { getForecast } from "@/lib/weather";
import type { CacaEvent } from "@/types/events";

const eventSchema = z.object({
  title: z.string().trim().min(3, "Indique um título com pelo menos 3 caracteres."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indique uma data válida."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Indique uma hora válida."),
  location: z.string().min(1, "Escolha a localização."),
  description: z.string().trim().max(500).default("")
});

type EventFormProps = {
  editingEvent: CacaEvent | null;
  isDisabled?: boolean;
  onSave: (event: CacaEvent) => void;
  onCancelEdit: () => void;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export function EventForm({ editingEvent, isDisabled = false, onSave, onCancelEdit }: EventFormProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [weather, setWeather] = useState<Feedback>(null);
  const [values, setValues] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: ""
  });

  useEffect(() => {
    if (!editingEvent) {
      return;
    }

    setValues({
      title: editingEvent.title,
      date: editingEvent.date,
      time: editingEvent.time,
      location: editingEvent.location,
      description: editingEvent.description ?? ""
    });
  }, [editingEvent]);

  function updateValue(field: keyof typeof values, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  function resetForm() {
    setValues({
      title: "",
      date: "",
      time: "",
      location: "",
      description: ""
    });
    setFeedback(null);
    setWeather(null);
    onCancelEdit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedEvent = eventSchema.safeParse(values);

    if (!parsedEvent.success) {
      setFeedback({
        type: "error",
        message: parsedEvent.error.issues[0]?.message ?? "Verifique os dados do evento."
      });
      return;
    }

    onSave({
      id: editingEvent?.id ?? crypto.randomUUID(),
      ...parsedEvent.data
    });
    setFeedback({
      type: "success",
      message: editingEvent ? "Evento atualizado com sucesso." : "Evento criado com sucesso."
    });
    setValues({
      title: "",
      date: "",
      time: "",
      location: "",
      description: ""
    });
    setWeather(null);
    onCancelEdit();
  }

  async function handleWeather() {
    try {
      const parsedEvent = eventSchema.pick({ date: true, time: true, location: true, title: true }).safeParse({
        ...values,
        title: values.title || "Evento"
      });

      if (!parsedEvent.success) {
        setWeather({
          type: "error",
          message: "Escolha a data, hora e ilha para consultar o clima."
        });
        return;
      }

      const forecast = await getForecast(values.location, values.date, values.time);
      setWeather({
        type: "success",
        message: `${forecast.locationLabel}: ${forecast.temperature}°C, ${forecast.label}.`
      });
    } catch (error) {
      setWeather({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível obter a previsão."
      });
    }
  }

  return (
    <div className="c-form" style={{ maxWidth: 800, margin: "0 auto" }}>
      <h3 className="c-form__title" style={{ marginBottom: 24 }}>
        {editingEvent ? "Editar Evento" : "Registar Novo Evento"}
      </h3>
      <form id="event-form" onSubmit={handleSubmit}>
        <fieldset disabled={isDisabled} aria-disabled={isDisabled}>
          <div className="event-form-grid">
            <div className="c-form__group">
              <label htmlFor="event-title" className="sr-only">
                Título do Evento
              </label>
              <input
                type="text"
                id="event-title"
                className="c-form__input"
                placeholder="Título do Evento *"
                aria-label="Título do Evento"
                style={{ paddingLeft: 20 }}
                value={values.title}
                onChange={(event) => updateValue("title", event.target.value)}
                required
              />
            </div>

            <div className="c-form__group">
              <label htmlFor="event-date" className="sr-only">
                Data do Evento
              </label>
              <input
                type="date"
                id="event-date"
                className="c-form__input"
                aria-label="Data do Evento"
                style={{ paddingLeft: 20 }}
                value={values.date}
                onChange={(event) => updateValue("date", event.target.value)}
                required
              />
            </div>

            <div className="c-form__group">
              <label htmlFor="event-time" className="sr-only">
                Hora do Evento
              </label>
              <input
                type="time"
                id="event-time"
                className="c-form__input"
                aria-label="Hora do Evento"
                style={{ paddingLeft: 20 }}
                value={values.time}
                onChange={(event) => updateValue("time", event.target.value)}
                required
              />
            </div>

            <div className="c-form__group">
              <label htmlFor="event-location" className="sr-only">
                Localização do Evento
              </label>
              <select
                id="event-location"
                name="event-location"
                className="c-form__input"
                aria-label="Localização do Evento"
                style={{ paddingLeft: 20 }}
                value={values.location}
                onChange={(event) => updateValue("location", event.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione a Ilha/Local *
                </option>
                {locationGroups.map((group) => (
                  <optgroup label={group} key={group}>
                    {islandLocations
                      .filter((location) => location.group === group)
                      .map((location) => (
                        <option value={location.value} key={location.value}>
                          {location.label}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="c-form__group">
            <label htmlFor="event-description" className="sr-only">
              Descrição do evento
            </label>
            <textarea
              id="event-description"
              className="c-form__input c-form__textarea"
              rows={3}
              placeholder="Descrição detalhada do evento..."
              aria-label="Descrição do evento"
              style={{ paddingLeft: 20 }}
              value={values.description}
              onChange={(event) => updateValue("description", event.target.value)}
            />
          </div>

          <div className="form-actions" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem", flexWrap: "wrap" }}>
            <button type="button" id="check-weather" className="btn btn--outline" onClick={handleWeather}>
              Ver Clima
            </button>
            {editingEvent ? (
              <button type="button" className="btn btn--outline" onClick={resetForm}>
                Cancelar
              </button>
            ) : null}
            <button type="submit" id="btn-save-event" className="btn btn--primary">
              {editingEvent ? "Atualizar Evento" : "Guardar Evento"}
            </button>
          </div>
        </fieldset>
      </form>

      {weather ? (
        <div className={`weather-info-box weather-${weather.type === "success" ? "success" : "error"}-box`} role="status">
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
