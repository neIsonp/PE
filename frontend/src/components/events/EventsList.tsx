import { islandLocations } from "@/data/events";
import { EventWeatherBadge } from "./EventWeatherBadge";
import { EventMapDisplay } from "./EventMapDisplay";
import type { CacaEvent } from "@/types/events";

type EventsListProps = {
  events: CacaEvent[];
  canManage?: boolean;
  onEdit?: (event: CacaEvent) => void;
  onDelete?: (event: CacaEvent) => void;
};

function getGroupBadge(locationValue: string) {
  const island = islandLocations.find((item) => item.value === locationValue);
  if (!island) return null;

  const groupSlug = island.group
    .toLowerCase()
    .replace("grupo ", "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return {
    label: island.group.replace("Grupo ", ""),
    className: `agenda-event-card__badge agenda-event-card__badge--${groupSlug}`
  };
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

import { EmptyState } from "@/components/ui/EmptyState";

export function EventsList({ events, canManage = false, onEdit, onDelete }: EventsListProps) {
  if (events.length === 0) {
    return <EmptyState title="Nenhum evento encontrado" message="Não existem eventos para exibir neste momento." />;
  }

  return (
    <div id="events-list" className="agenda-events-grid">
      {events.map((event) => {
        const location = islandLocations.find((item) => item.value === event.location);
        const venue = event.venue?.trim();
        const badge = getGroupBadge(event.location);

        return (
          <article className="agenda-event-card" key={event.id}>
            {/* Map image area */}
            <div className="agenda-event-card__image">
              <EventMapDisplay latitude={event.latitude} longitude={event.longitude} />
              {badge && (
                <span className={badge.className}>{badge.label}</span>
              )}
            </div>

            {/* Card body */}
            <div className="agenda-event-card__body">
              <h3 className="agenda-event-card__title">{event.title}</h3>

              <div className="agenda-event-card__meta">
                <div className="agenda-event-card__meta-row">
                  <span className="agenda-event-card__meta-icon" aria-hidden="true">📅</span>
                  <span>{formatDate(event.date)}</span>
                  <span style={{ margin: '0 2px', opacity: 0.4 }}>•</span>
                  <span>{event.time}</span>
                </div>
                <div className="agenda-event-card__meta-row">
                  <span className="agenda-event-card__meta-icon" aria-hidden="true">📍</span>
                  <span>{location?.label ?? event.location}{venue ? `, ${venue}` : ""}</span>
                </div>
              </div>

              <div className="agenda-event-card__weather">
                <EventWeatherBadge event={event} />
              </div>
            </div>

            {/* Actions */}
            {canManage && onEdit && onDelete && (
              <div className="agenda-event-card__manage">
                <button type="button" onClick={() => onEdit(event)} className="btn btn--outline event-actions__button">
                  Editar
                </button>
                <button type="button" onClick={() => onDelete(event)} className="btn btn--danger event-actions__button">
                  Eliminar
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
