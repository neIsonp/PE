"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { EventsList } from "./EventsList";
import { EventsMap } from "@/components/map/EventsMap";
import { fetchEvents } from "@/lib/api-client";
import { getValidToken, sessionChangedEvent } from "@/lib/storage";
import { islandLocations } from "@/data/events";
import type { CacaEvent } from "@/types/events";

type EventPeriod = "all" | "upcoming" | "past";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export function EventsAgenda() {
  const [events, setEvents] = useState<CacaEvent[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Filters
  const [period, setPeriod] = useState<EventPeriod>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIsland, setSelectedIsland] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  useEffect(() => {
    function refreshSession() {
      setIsAuthenticated(Boolean(getValidToken()));
    }

    refreshSession();
    window.addEventListener(sessionChangedEvent, refreshSession);
    window.addEventListener("storage", refreshSession);

    return () => {
      window.removeEventListener(sessionChangedEvent, refreshSession);
      window.removeEventListener("storage", refreshSession);
    };
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [period, searchQuery, selectedIsland, selectedDate]);

  useEffect(() => {
    async function refreshEvents() {
      setIsLoading(true);
      setFeedback(null);

      try {
        const response = await fetchEvents({ period: period === "all" ? undefined : period });
        setEvents(response.events);
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Não foi possível carregar a agenda."
        });
      } finally {
        setIsLoading(false);
      }
    }

    void refreshEvents();
  }, [period]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesIsland = selectedIsland === "all" || event.location === selectedIsland;
      const matchesDate = !selectedDate || event.date === selectedDate;

      return matchesSearch && matchesIsland && matchesDate;
    });
  }, [events, searchQuery, selectedIsland, selectedDate]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / eventsPerPage));
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

  function clearFilters() {
    setSearchQuery("");
    setSelectedIsland("all");
    setSelectedDate("");
    setPeriod("upcoming");
  }

  const hasActiveFilters = searchQuery !== "" || selectedIsland !== "all" || selectedDate !== "" || period !== "upcoming";

  // Build page numbers array
  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (currentPage > 3) pageNumbers.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(i);
    }
    if (currentPage < totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  return (
    <>
      {/* ── Hero banner escuro ── */}
      <div className="agenda-hero">
        <div className="agenda-hero__inner">
          <h1 className="agenda-hero__title">Agenda Pública CACA</h1>
          <p className="agenda-hero__subtitle">
            Descubra e participe nos eventos mais relevantes das comunidades científica, académica e cultural dos Açores.
          </p>

          <div className="agenda-hero__controls">
            <div className="agenda-hero__search">
              <span className="agenda-hero__search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                placeholder="Procurar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="agenda-hero__pills" role="group" aria-label="Filtrar por período">
              {[
                ["upcoming", "Próximos"],
                ["past", "Passados"],
                ["all", "Todos"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="agenda-hero__pill"
                  aria-pressed={period === value}
                  onClick={() => setPeriod(value as EventPeriod)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Corpo da agenda: sidebar + cards ── */}
      <div className="agenda-body">
        {/* Sidebar */}
        <aside className="agenda-filters">
          <div className="agenda-filters__card">
            <h3 className="agenda-filters__title">Filtros</h3>

            <div className="agenda-filters__group">
              <label htmlFor="agenda-date" className="agenda-filters__label">Data do Evento</label>
              <input
                id="agenda-date"
                type="date"
                className="agenda-filters__input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="agenda-filters__group">
              <label htmlFor="agenda-island" className="agenda-filters__label">Localização</label>
              <select
                id="agenda-island"
                className="agenda-filters__select"
                value={selectedIsland}
                onChange={(e) => setSelectedIsland(e.target.value)}
              >
                <option value="all">Todas as ilhas</option>
                {islandLocations.map(island => (
                  <option key={island.value} value={island.value}>{island.label}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{ background: 'none', border: 'none', color: 'var(--vermelho-600, #dc2626)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', padding: '8px 0 0', width: '100%', textAlign: 'left' }}
              >
                ✕ Limpar filtros
              </button>
            )}
          </div>

          {/* CTA card */}
          <div className="agenda-cta">
            <h4 className="agenda-cta__title">Organize o seu evento</h4>
            <p className="agenda-cta__text">Gestão profissional para conferências e workshops.</p>
            <Link href={isAuthenticated ? "/perfil#meus-eventos" : "/login"} className="agenda-cta__link">
              {isAuthenticated ? "Gerir eventos" : "Saber Mais"}
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main>
          <div className="agenda-body__header">
            <h2 className="agenda-body__title">
              {period === "upcoming" ? "Próximos Eventos" : period === "past" ? "Eventos Passados" : "Todos os Eventos"}
            </h2>
            <span className="agenda-body__count">
              Mostrando {paginatedEvents.length} de {filteredEvents.length} eventos
            </span>
          </div>

          {feedback ? (
            <p className={`form-feedback form-feedback--${feedback.type}`} role="status" aria-live="polite">
              {feedback.message}
            </p>
          ) : null}

          {isLoading ? (
            <p style={{ color: 'var(--cinza-500)', padding: '24px 0' }}>A carregar agenda...</p>
          ) : (
            <>
              <EventsList events={paginatedEvents} />

              {filteredEvents.length === 0 && (
                <div className="agenda-empty">
                  <p className="agenda-empty__text">Não foram encontrados eventos que correspondam à sua pesquisa.</p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="btn btn--outline">
                      Limpar todos os filtros
                    </button>
                  )}
                </div>
              )}

              {totalPages > 1 && (
                <nav className="agenda-pagination" aria-label="Paginação de eventos">
                  <button
                    className="agenda-pagination__btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                  >
                    ‹
                  </button>

                  {pageNumbers.map((page, idx) =>
                    page === "..." ? (
                      <span key={`dots-${idx}`} className="agenda-pagination__btn" style={{ border: 'none', cursor: 'default', background: 'transparent' }}>…</span>
                    ) : (
                      <button
                        key={page}
                        className={`agenda-pagination__btn ${currentPage === page ? "agenda-pagination__btn--active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    className="agenda-pagination__btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Página seguinte"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Mapa global ── */}
      <section id="mapa-eventos" className="section events-map-section" style={{ paddingTop: '80px' }}>
        <div className="container events-map-layout">
          <div className="events-map-copy">
            <p className="events-map-eyebrow">Explorar</p>
            <h2 className="events-map-title">Mapa de Eventos</h2>
            <p className="events-map-description">
              Visualize a distribuição geográfica das atividades nas ilhas dos Açores, mantendo a agenda
              pública separada da área pessoal de gestão.
            </p>
          </div>
          <div className="events-map-card">
            <EventsMap events={events} />
          </div>
        </div>
      </section>
    </>
  );
}
