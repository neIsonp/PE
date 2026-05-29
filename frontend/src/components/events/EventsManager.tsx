"use client";

import { useEffect, useState } from "react";
import { EventForm } from "./EventForm";
import { EventsList } from "./EventsList";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState } from "@/components/ui/LoadingState";
import { createEvent, deleteEvent, fetchMyEvents, updateEvent } from "@/services/api";
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
    venue: event.venue ?? null,
    latitude: event.latitude ?? null,
    longitude: event.longitude ?? null,
    description: event.description ?? ""
  };
}

export function EventsManager() {
  const [events, setEvents] = useState<CacaEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CacaEvent | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [period, setPeriod] = useState<EventPeriod>("upcoming");
  const [eventToDelete, setEventToDelete] = useState<CacaEvent | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  useEffect(() => {
    void refreshEvents();
  }, [period]);

  async function refreshEvents() {
    setIsLoading(true);

    try {
      const response = await fetchMyEvents({ period: period === "all" ? undefined : period });
      setEvents(response.events);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível carregar os seus eventos."
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
      setIsFormModalOpen(false);
      setFeedback({
        type: "success",
        message: editingEvent ? "Evento atualizado na sua área pessoal." : "Evento criado na sua área pessoal."
      });
      await refreshEvents();
    } catch (error) {
      console.error("DEBUG ERROR IN HANDLESAVEEVENT:", error);
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
    <section id="meus-eventos" className="profile-events-panel" aria-labelledby="meus-eventos-title">


      {feedback ? (
        <p className={`form-feedback form-feedback--${feedback.type}`} role="status" aria-live="polite">
          {feedback.message}
        </p>
      ) : null}

      <div className="profile-events-container">
        <div className="events-filter" role="group" aria-label="Filtrar os meus eventos por período" style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
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
          <button type="button" className="btn btn--primary" onClick={() => { setEditingEvent(null); setIsFormModalOpen(true); }}>
            + Adicionar
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '24px 0' }}>
            <LoadingState title="A carregar eventos" message="Estamos a obter os seus eventos..." />
          </div>
        ) : (
          <EventsList events={events} canManage onEdit={(evt) => { setEditingEvent(evt); setIsFormModalOpen(true); }} onDelete={setEventToDelete} />
        )}
      </div>

      {isFormModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '48px 32px 32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => setIsFormModalOpen(false)} 
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', lineHeight: '1', cursor: 'pointer', color: '#64748b', zIndex: 50 }} 
              aria-label="Fechar"
              title="Fechar formulário"
            >
              &times;
            </button>
            <EventForm editingEvent={editingEvent} onSave={saveEvent} onCancelEdit={() => setIsFormModalOpen(false)} />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(eventToDelete)}
        isBusy={isDeleting}
        title="Eliminar evento"
        message={`Tem a certeza de que pretende eliminar "${eventToDelete?.title ?? "este evento"}"? Esta ação não pode ser anulada.`}
        confirmLabel="Eliminar"
        onCancel={() => setEventToDelete(null)}
        onConfirm={removeEvent}
      />
    </section>
  );
}
