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
  onSave: (event: CacaEvent) => Promise<void>;
  onCancelEdit: () => void;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export function EventForm({ editingEvent, isDisabled = false, onSave, onCancelEdit }: EventFormProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [weather, setWeather] = useState<Feedback>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingWeather, setIsCheckingWeather] = useState(false);
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
    } finally {
      setIsCheckingWeather(false);
    }
  }

  return (
    <div className="c-form event-form-card">
      <h3 className="c-form__title event-form-card__title">
        {editingEvent ? "Editar Evento" : "Registar Novo Evento"}
      </h3>
      <form id="event-form" className="event-form" onSubmit={handleSubmit}>
        <fieldset disabled={isDisabled || isSaving} aria-disabled={isDisabled || isSaving}>
          <div className="event-form-grid">
            <div className="c-form__group event-form-grid__wide">
              <label htmlFor="event-title" className="form-group__label">
                Título do Evento
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
                Data do Evento
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
                Hora do Evento
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
              <label htmlFor="event-location" className="form-group__label">
                Localização do Evento
              </label>
              <select
                id="event-location"
                name="event-location"
                className="c-form__input c-form__input--no-icon event-form__select"
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
              {isCheckingWeather ? "A consultar..." : "Ver Clima"}
            </button>
            {editingEvent ? (
              <button type="button" className="btn btn--outline" onClick={resetForm} disabled={isSaving}>
                Cancelar
              </button>
            ) : null}
            <button type="submit" id="btn-save-event" className="btn btn--primary" disabled={isSaving}>
              {isSaving ? "A guardar..." : editingEvent ? "Atualizar Evento" : "Guardar Evento"}
            </button>
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
