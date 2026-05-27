import type { FastifyReply, FastifyRequest } from "fastify";
import type { EventService } from "./event.service.js";
import type { EventInput, EventParams } from "./event.schemas.js";

type EventParamsRequest = FastifyRequest<{ Params: EventParams }>;
type EventBodyRequest = FastifyRequest<{ Body: EventInput }>;
type EventUpdateRequest = FastifyRequest<{ Params: EventParams; Body: EventInput }>;

export class EventController {
  constructor(private readonly eventService: EventService) {}

  async listEvents() {
    const events = await this.eventService.listEvents();

    return { events };
  }

  async getEvent(request: EventParamsRequest) {
    const event = await this.eventService.getEvent(request.params.id);

    return { event };
  }

  async createEvent(request: EventBodyRequest, reply: FastifyReply) {
    const event = await this.eventService.createEvent(request.body, request.user.sub);

    return reply.code(201).send({ event });
  }

  async updateEvent(request: EventUpdateRequest) {
    const event = await this.eventService.updateEvent(
      request.params.id,
      request.body,
      request.user.sub,
      request.user.role
    );

    return { event };
  }

  async deleteEvent(request: EventParamsRequest, reply: FastifyReply) {
    await this.eventService.deleteEvent(request.params.id, request.user.sub, request.user.role);

    return reply.code(204).send();
  }
}
