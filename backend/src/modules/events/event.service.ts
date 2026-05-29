import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import type { UserRole } from "../../shared/roles.js";
import { toPublicEvent } from "./event.mapper.js";
import type { EventInput, EventListQuery } from "./event.schemas.js";

function normalizeDescription(description?: string | null) {
  const normalizedDescription = description?.trim();

  return normalizedDescription ? normalizedDescription : null;
}

function normalizeVenue(venue?: string | null) {
  const normalizedVenue = venue?.trim();

  return normalizedVenue ? normalizedVenue : null;
}

export class EventService {
  constructor(private readonly prisma: PrismaClient) {}

  async listEvents(query: EventListQuery = {}, createdById?: string) {
    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);
    const currentTime = now.toISOString().slice(11, 16);
    const periodWhere: Prisma.EventWhereInput | undefined =
      query.period === "upcoming"
        ? {
            OR: [
              { date: { gt: currentDate } },
              {
                AND: [{ date: currentDate }, { time: { gte: currentTime } }]
              }
            ]
          }
        : query.period === "past"
          ? {
              OR: [
                { date: { lt: currentDate } },
                {
                  AND: [{ date: currentDate }, { time: { lt: currentTime } }]
                }
              ]
            }
          : undefined;
    const where: Prisma.EventWhereInput | undefined = createdById
      ? {
          AND: [periodWhere ?? {}, { createdById }]
        }
      : periodWhere;

    const events = await this.prisma.event.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }]
    });

    return events.map(toPublicEvent);
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new AppError(404, "Evento não encontrado.");
    }

    return toPublicEvent(event);
  }

  async createEvent(input: EventInput, createdById: string) {
    const event = await this.prisma.event.create({
      data: {
        ...input,
        venue: normalizeVenue(input.venue),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        description: normalizeDescription(input.description),
        createdById
      }
    });

    return toPublicEvent(event);
  }

  async updateEvent(id: string, input: EventInput, userId: string, role: UserRole) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new AppError(404, "Evento não encontrado.");
    }

    if (role !== "ADMIN" && event.createdById !== userId) {
      throw new AppError(403, "Não tem permissão para editar este evento.");
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...input,
        venue: normalizeVenue(input.venue),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        description: normalizeDescription(input.description)
      }
    });

    return toPublicEvent(updatedEvent);
  }

  async deleteEvent(id: string, userId: string, role: UserRole) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new AppError(404, "Evento não encontrado.");
    }

    if (role !== "ADMIN" && event.createdById !== userId) {
      throw new AppError(403, "Não tem permissão para eliminar este evento.");
    }

    try {
      await this.prisma.event.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Evento não encontrado.");
      }

      throw error;
    }
  }
}
