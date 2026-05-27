import type { Metadata } from "next";
import { EventsManager } from "@/components/events/EventsManager";
import { Header } from "@/components/layout/Header";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

export const metadata: Metadata = {
  title: "Eventos | CACA",
  description: "Gestão local de eventos académicos e clínicos do CACA."
};

export default function EventosPage() {
  return (
    <>
      <Header active="events" />
      <main>
        <EventsManager />
      </main>
      <ScrollToTop />
    </>
  );
}
