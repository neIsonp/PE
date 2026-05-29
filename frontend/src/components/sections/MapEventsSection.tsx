"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { seedEvents } from "@/data/events";
import { EventsMap } from "@/components/map/EventsMap";
import { fetchEvents } from "@/lib/api-client";
import type { CacaEvent } from "@/types/events";

export function MapEventsSection() {
  const [events, setEvents] = useState<CacaEvent[]>(seedEvents);

  useEffect(() => {
    fetchEvents()
      .then((response) => {
        if (response.events.length > 0) {
          setEvents(response.events);
        }
      })
      .catch(() => {
        setEvents(seedEvents);
      });
  }, []);

  return (
    <section id="mapa-destaques" className="section map-events-section">
      <div className="container">
        <div className="map-events-layout">
          <div className="map-events-card">
            <EventsMap events={events} />
          </div>

          <div className="map-events-info">
            <span className="map-events-info__label">Próximos Eventos</span>
            <h2 className="map-events-info__title">
              Acompanhe as
              <br />
              Nossas Iniciativas
            </h2>

            <h3 className="map-events-info__subtitle">Eventos e Conferências</h3>
            <div className="map-events-info__details">
              <p>Mantenha-se atualizado sobre as nossas atividades.</p>
              <p>
                O CACA organiza diversos congressos, formações e encontros ao longo do ano em várias
                ilhas, visando a promoção do conhecimento científico em rede.
              </p>
              <p>Explore no mapa os próximos eventos agendados.</p>
            </div>

            <Link href="/eventos" className="map-events-info__link" style={{ marginTop: 20 }}>
              Ver Agenda <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
