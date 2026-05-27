import { seedEvents } from "@/data/events";
import type { CacaEvent } from "@/types/events";

const eventsKey = "caca_events";

export function readEvents() {
  const rawEvents = localStorage.getItem(eventsKey);

  if (!rawEvents) {
    localStorage.setItem(eventsKey, JSON.stringify(seedEvents));
    return seedEvents;
  }

  try {
    return JSON.parse(rawEvents) as CacaEvent[];
  } catch {
    localStorage.setItem(eventsKey, JSON.stringify(seedEvents));
    return seedEvents;
  }
}

export function writeEvents(events: CacaEvent[]) {
  localStorage.setItem(eventsKey, JSON.stringify(events));
}
