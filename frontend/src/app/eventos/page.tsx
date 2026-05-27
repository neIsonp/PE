import type { Metadata } from "next";
import { EventsManager } from "@/components/events/EventsManager";
import { Header } from "@/components/layout/Header";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

export const metadata: Metadata = {
  title: "Eventos | CACA",
  description: "Gestão de eventos académicos e clínicos do CACA integrada com a API."
};

export default function EventosPage() {
  return (
    <>
      <Header active="events" />
      <main id="conteudo-principal">
        <EventsManager />
      </main>
      <ScrollToTop />
    </>
  );
}
