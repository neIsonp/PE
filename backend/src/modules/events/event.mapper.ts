import type { Event } from "@prisma/client";

export function toPublicEvent(event: Event) {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    venue: event.venue,
    latitude: event.latitude,
    longitude: event.longitude,
    description: event.description,
    createdById: event.createdById,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString()
  };
}
