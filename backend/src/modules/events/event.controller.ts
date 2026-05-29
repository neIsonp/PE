import { AuditAction } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuditRequestContext, type AuditService } from "../audit/audit.service.js";
import type { EventService } from "./event.service.js";
import type { EventInput, EventListQuery, EventParams } from "./event.schemas.js";

export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly auditService: AuditService
  ) {}

  async listEvents(request: FastifyRequest) {
    const events = await this.eventService.listEvents(request.query as EventListQuery);

    return { events };
  }

  async listMyEvents(request: FastifyRequest) {
    const events = await this.eventService.listEvents(request.query as EventListQuery, request.user.sub);

    return { events };
  }

  async getEvent(request: FastifyRequest) {
    const event = await this.eventService.getEvent((request.params as EventParams).id);

    return { event };
  }

  async createEvent(request: FastifyRequest, reply: FastifyReply) {
    const event = await this.eventService.createEvent(request.body as EventInput, request.user.sub);

    await this.auditService.record(AuditAction.EVENT_CREATED, {
      actorId: request.user.sub,
      actorEmail: request.user.email,
      targetId: event.id,
      targetType: "EVENT",
      metadata: {
        title: event.title,
        date: event.date
      },
      ...getAuditRequestContext(request)
    });

    return reply.code(201).send({ event });
  }

  async updateEvent(request: FastifyRequest) {
    const params = request.params as EventParams;
    const body = request.body as EventInput;
    const event = await this.eventService.updateEvent(
      params.id,
      body,
      request.user.sub,
      request.user.role
    );

    await this.auditService.record(AuditAction.EVENT_UPDATED, {
      actorId: request.user.sub,
      actorEmail: request.user.email,
      targetId: event.id,
      targetType: "EVENT",
      metadata: {
        title: event.title,
        date: event.date
      },
      ...getAuditRequestContext(request)
    });

    return { event };
  }

  async deleteEvent(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as EventParams;

    await this.eventService.deleteEvent(params.id, request.user.sub, request.user.role);

    await this.auditService.record(AuditAction.EVENT_DELETED, {
      actorId: request.user.sub,
      actorEmail: request.user.email,
      targetId: params.id,
      targetType: "EVENT",
      ...getAuditRequestContext(request)
    });

    return reply.code(204).send();
  }
}
