import { islandLocations } from "@/data/events";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CacaEvent } from "@/types/events";

type EventsListProps = {
  events: CacaEvent[];
  canManage?: boolean;
  onEdit: (event: CacaEvent) => void;
  onDelete: (event: CacaEvent) => void;
};

export function EventsList({ events, canManage = false, onEdit, onDelete }: EventsListProps) {
  if (events.length === 0) {
    return (
      <div className="research" id="events-list">
        <div style={{ gridColumn: "span 12" }}>
          <EmptyState
            title="Sem eventos encontrados"
            message="Não existem eventos para o filtro selecionado."
          />
        </div>
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
            {canManage ? (
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
                  onClick={() => onDelete(event)}
                  className="btn"
                  style={{ background: "#eef2f6", color: "#e11d48", fontSize: "0.85rem", padding: "8px 16px" }}
                >
                  Eliminar
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
