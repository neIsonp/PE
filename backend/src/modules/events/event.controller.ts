import { AuditAction } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuditRequestContext, type AuditService } from "../audit/audit.service.js";
import type { EventService } from "./event.service.js";
import type { EventInput, EventParams, EventsListQuery } from "./event.schemas.js";

type EventListRequest = FastifyRequest<{ Querystring: EventsListQuery }>;
type EventParamsRequest = FastifyRequest<{ Params: EventParams }>;
type EventBodyRequest = FastifyRequest<{ Body: EventInput }>;
type EventUpdateRequest = FastifyRequest<{ Params: EventParams; Body: EventInput }>;

export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly auditService: AuditService
  ) {}

  async listEvents(request: EventListRequest) {
    const events = await this.eventService.listEvents(request.query);

    return { events };
  }

  async getEvent(request: EventParamsRequest) {
    const event = await this.eventService.getEvent(request.params.id);

    return { event };
  }

  async createEvent(request: EventBodyRequest, reply: FastifyReply) {
    const event = await this.eventService.createEvent(request.body, request.user.sub);

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

  async updateEvent(request: EventUpdateRequest) {
    const event = await this.eventService.updateEvent(
      request.params.id,
      request.body,
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

  async deleteEvent(request: EventParamsRequest, reply: FastifyReply) {
    await this.eventService.deleteEvent(request.params.id, request.user.sub, request.user.role);

    await this.auditService.record(AuditAction.EVENT_DELETED, {
      actorId: request.user.sub,
      actorEmail: request.user.email,
      targetId: request.params.id,
      targetType: "EVENT",
      ...getAuditRequestContext(request)
    });

    return reply.code(204).send();
  }
}
