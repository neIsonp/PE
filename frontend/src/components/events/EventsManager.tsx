"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EventForm } from "./EventForm";
import { EventsList } from "./EventsList";
import { EventsMap } from "@/components/map/EventsMap";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState } from "@/components/ui/LoadingState";
import { createEvent, deleteEvent, fetchEvents, updateEvent } from "@/lib/api-client";
import { getToken } from "@/lib/storage";
import type { CacaEvent } from "@/types/events";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type EventPeriod = "all" | "upcoming" | "past";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [period, setPeriod] = useState<EventPeriod>("upcoming");
  const [eventToDelete, setEventToDelete] = useState<CacaEvent | null>(null);

  useEffect(() => {
    setIsAuthenticated(Boolean(getToken()));
  }, []);

  useEffect(() => {
    void refreshEvents();
  }, [period]);

  async function refreshEvents() {
    setIsLoading(true);
    try {
      const response = await fetchEvents({ period: period === "all" ? undefined : period });
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
      await refreshEvents();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível guardar o evento."
      });
      throw error;
    }
  }

  async function removeEvent() {
    if (!eventToDelete) {
      return;
    }

    setFeedback(null);
    setIsDeleting(true);

    try {
      await deleteEvent(eventToDelete.id);
      setEvents((currentEvents) => currentEvents.filter((event) => event.id !== eventToDelete.id));
      setEventToDelete(null);
      setFeedback({ type: "success", message: "Evento eliminado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível eliminar o evento."
      });
    } finally {
      setIsDeleting(false);
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
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: "1rem"
            }}
          >
            <h3 className="c-form__title" style={{ marginBottom: 0 }}>
              Eventos
            </h3>
            <div className="events-filter" role="group" aria-label="Filtrar eventos por período">
              {[
                ["upcoming", "Próximos"],
                ["past", "Passados"],
                ["all", "Todos"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="events-filter__button"
                  aria-pressed={period === value}
                  onClick={() => setPeriod(value as EventPeriod)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <LoadingState title="A carregar eventos" />
          ) : (
            <EventsList
              events={events}
              canManage={isAuthenticated}
              onEdit={setEditingEvent}
              onDelete={setEventToDelete}
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

      <ConfirmDialog
        isOpen={Boolean(eventToDelete)}
        isBusy={isDeleting}
        title="Eliminar evento"
        message={`Tem a certeza de que pretende eliminar "${eventToDelete?.title ?? "este evento"}"? Esta ação não pode ser anulada.`}
        confirmLabel="Eliminar"
        onCancel={() => setEventToDelete(null)}
        onConfirm={removeEvent}
      />
    </>
  );
}
