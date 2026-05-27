"use client";

import { useEffect, useMemo, useState } from "react";
import { readEvents, writeEvents } from "@/lib/event-store";
import type { CacaEvent } from "@/types/events";

export function useLocalEvents() {
  const [events, setEvents] = useState<CacaEvent[]>([]);
  const sortedEvents = useMemo(
    () =>
      [...events].sort((firstEvent, secondEvent) =>
        `${firstEvent.date}T${firstEvent.time}`.localeCompare(`${secondEvent.date}T${secondEvent.time}`)
      ),
    [events]
  );

  useEffect(() => {
    setEvents(readEvents());
  }, []);

  function persist(nextEvents: CacaEvent[]) {
    setEvents(nextEvents);
    writeEvents(nextEvents);
  }

  function saveEvent(event: CacaEvent) {
    const exists = events.some((item) => item.id === event.id);
    const nextEvents = exists
      ? events.map((item) => (item.id === event.id ? event : item))
      : [...events, event];

    persist(nextEvents);
  }

  function removeEvent(id: string) {
    persist(events.filter((event) => event.id !== id));
  }

  return {
    events: sortedEvents,
    saveEvent,
    removeEvent
  };
}
