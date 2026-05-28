import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import type { UserRole } from "../../shared/roles.js";
import { toPublicEvent } from "./event.mapper.js";
import type { EventInput, EventsListQuery } from "./event.schemas.js";

function normalizeDescription(description?: string | null) {
  const normalizedDescription = description?.trim();

  return normalizedDescription ? normalizedDescription : null;
}

export class EventService {
  constructor(private readonly prisma: PrismaClient) {}

  async listEvents(query: EventsListQuery = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const where: Prisma.EventWhereInput =
      query.period === "upcoming"
        ? { date: { gte: today } }
        : query.period === "past"
          ? { date: { lt: today } }
          : {};

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
