import type { Metadata } from "next";
import { EventsAgenda } from "@/components/events/EventsAgenda";
import { Header } from "@/components/layout/Header";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

import { fetchEvents } from "@/services/api";

export const metadata: Metadata = {
  title: "Eventos | CACA",
  description: "Agenda pública de eventos académicos e clínicos do CACA."
};

export default async function EventosPage() {
  const initialData = await fetchEvents({ period: "upcoming" }).catch(() => ({ events: [] }));

  return (
    <>
      <Header active="events" />
      <main id="conteudo-principal">
        <EventsAgenda initialEvents={initialData.events} />
      </main>
      <ScrollToTop />
    </>
  );
}
