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
    <div id="events-list" className="research events-results">
      {events.map((event) => {
        const location = islandLocations.find((item) => item.value === event.location);

        return (
          <article className="research__card event-card" key={event.id}>
            <div className="research__content">
              <h3 className="research__card-title">{event.title}</h3>
              <p className="research__card-text event-card__meta">
                <strong>{event.date}</strong>
                <span>{event.time}</span>
                <span>{location?.label ?? event.location}</span>
              </p>
              {event.description ? <p className="research__card-text">{event.description}</p> : null}
            </div>
            {canManage ? (
              <div className="event-actions">
                <button type="button" onClick={() => onEdit(event)} className="btn btn--outline event-actions__button">
                  Editar
                </button>
                <button type="button" onClick={() => onDelete(event)} className="btn btn--danger event-actions__button">
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
