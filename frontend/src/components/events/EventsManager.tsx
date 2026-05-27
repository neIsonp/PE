"use client";

import { useState } from "react";
import { EventForm } from "./EventForm";
import { EventsList } from "./EventsList";
import { EventsMap } from "@/components/map/EventsMap";
import { useLocalEvents } from "@/hooks/useLocalEvents";
import type { CacaEvent } from "@/types/events";

export function EventsManager() {
  const { events, saveEvent, removeEvent } = useLocalEvents();
  const [editingEvent, setEditingEvent] = useState<CacaEvent | null>(null);

  return (
    <>
      <section className="section" style={{ paddingTop: 140 }}>
        <div className="container">
          <h1 className="section__title">Gestão de Eventos</h1>
          <p className="section__description">
            Adicione e gira os eventos académicos e clínicos do CACA.
          </p>

          <EventForm
            editingEvent={editingEvent}
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

          <EventsList events={events} onEdit={setEditingEvent} onDelete={removeEvent} />
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
