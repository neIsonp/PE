import type { Metadata } from "next";
import { EventsAgenda } from "@/components/events/EventsAgenda";
import { Header } from "@/components/layout/Header";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

export const metadata: Metadata = {
  title: "Eventos | CACA",
  description: "Agenda pública de eventos académicos e clínicos do CACA."
};

export default function EventosPage() {
  return (
    <>
      <Header active="events" />
      <main id="conteudo-principal">
        <EventsAgenda />
      </main>
      <ScrollToTop />
    </>
  );
}
