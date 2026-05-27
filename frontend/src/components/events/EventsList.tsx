import { islandLocations } from "@/data/events";
import type { CacaEvent } from "@/types/events";

type EventsListProps = {
  events: CacaEvent[];
  onEdit: (event: CacaEvent) => void;
  onDelete: (id: string) => void;
};

export function EventsList({ events, onEdit, onDelete }: EventsListProps) {
  if (events.length === 0) {
    return (
      <div className="research" id="events-list">
        <article className="research__card" style={{ gridColumn: "span 12" }}>
          <div className="research__content">
            <h3 className="research__card-title">Sem eventos registados</h3>
            <p className="research__card-text">Adicione o primeiro evento académico ou clínico do CACA.</p>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div id="events-list" className="research">
      {events.map((event) => {
        const location = islandLocations.find((item) => item.value === event.location);

        return (
          <article className="research__card" style={{ display: "flex", flexDirection: "column" }} key={event.id}>
            <div className="research__content" style={{ flexGrow: 1 }}>
              <h3 className="research__card-title">{event.title}</h3>
              <p className="research__card-text" style={{ marginBottom: 15 }}>
                <strong>
                  📅 {event.date} às {event.time}
                </strong>
                <br />
                📍 {location?.label ?? event.location}
              </p>
              {event.description ? <p className="research__card-text">{event.description}</p> : null}
            </div>
            <div className="event-actions">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="btn btn--outline"
                style={{ fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="btn"
                style={{ background: "#eef2f6", color: "#e11d48", fontSize: "0.85rem", padding: "8px 16px" }}
              >
                Eliminar
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
