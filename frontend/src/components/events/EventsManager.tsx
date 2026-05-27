"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EventForm } from "./EventForm";
import { EventsList } from "./EventsList";
import { EventsMap } from "@/components/map/EventsMap";
import { createEvent, deleteEvent, fetchEvents, updateEvent } from "@/lib/api-client";
import { getToken } from "@/lib/storage";
import type { CacaEvent } from "@/types/events";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

function toEventPayload(event: CacaEvent) {
  return {
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    description: event.description ?? ""
  };
}

export function EventsManager() {
  const [events, setEvents] = useState<CacaEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CacaEvent | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(getToken()));
    refreshEvents();
  }, []);

  async function refreshEvents() {
    try {
      const response = await fetchEvents();
      setEvents(response.events);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível carregar eventos."
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function saveEvent(event: CacaEvent) {
    setFeedback(null);

    try {
      const response = editingEvent
        ? await updateEvent(editingEvent.id, toEventPayload(event))
        : await createEvent(toEventPayload(event));

      setEvents((currentEvents) => {
        const exists = currentEvents.some((currentEvent) => currentEvent.id === response.event.id);

        return exists
          ? currentEvents.map((currentEvent) =>
              currentEvent.id === response.event.id ? response.event : currentEvent
            )
          : [...currentEvents, response.event].sort((firstEvent, secondEvent) =>
              `${firstEvent.date}T${firstEvent.time}`.localeCompare(`${secondEvent.date}T${secondEvent.time}`)
            );
      });
      setEditingEvent(null);
      setFeedback({
        type: "success",
        message: editingEvent ? "Evento atualizado na API." : "Evento criado na API."
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível guardar o evento."
      });
    }
  }

  async function removeEvent(id: string) {
    setFeedback(null);

    try {
      await deleteEvent(id);
      setEvents((currentEvents) => currentEvents.filter((event) => event.id !== id));
      setFeedback({ type: "success", message: "Evento eliminado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível eliminar o evento."
      });
    }
  }

  return (
    <>
      <section className="section" style={{ paddingTop: 140 }}>
        <div className="container">
          <h1 className="section__title">Gestão de Eventos</h1>
          <p className="section__description">
            Adicione e gira os eventos académicos e clínicos do CACA através da API.
          </p>

          {feedback ? (
            <p className={`form-feedback form-feedback--${feedback.type}`} role="status" aria-live="polite">
              {feedback.message}
            </p>
          ) : null}

          {!isAuthenticated ? (
            <div className="form-feedback form-feedback--info" role="note">
              Os eventos são públicos, mas para criar, editar ou eliminar precisa de{" "}
              <Link href="/login">iniciar sessão</Link>.
            </div>
          ) : null}

          <EventForm
            editingEvent={editingEvent}
            isDisabled={!isAuthenticated}
            onSave={saveEvent}
            onCancelEdit={() => setEditingEvent(null)}
          />

          <hr style={{ border: 0, borderTop: "1px solid var(--cinza-200)", margin: "60px 0" }} />

          <div
            className="events-list-header"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <h3 className="c-form__title" style={{ marginBottom: 0 }}>
              Próximos Eventos
            </h3>
          </div>

          {isLoading ? (
            <p className="section__description">A carregar eventos...</p>
          ) : (
            <EventsList
              events={events}
              canManage={isAuthenticated}
              onEdit={setEditingEvent}
              onDelete={removeEvent}
            />
          )}
        </div>
      </section>

      <section id="mapa-eventos" className="section">
        <div className="container">
          <h2 className="section__title">Mapa de Eventos</h2>
          <EventsMap events={events} />
        </div>
      </section>
    </>
  );
}
