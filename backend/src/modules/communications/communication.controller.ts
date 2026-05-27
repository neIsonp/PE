import type { FastifyReply, FastifyRequest } from "fastify";
import { assertRole } from "../../shared/authorization.js";
import type { CommunicationService } from "./communication.service.js";
import type { ContactMessageInput, NewsletterInput } from "./communication.schemas.js";

type ContactRequest = FastifyRequest<{ Body: ContactMessageInput }>;
type NewsletterRequest = FastifyRequest<{ Body: NewsletterInput }>;

export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  async createContactMessage(request: ContactRequest, reply: FastifyReply) {
    const message = await this.communicationService.createContactMessage(request.body);

    return reply.code(201).send({ message });
  }

  async listContactMessages(request: FastifyRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem consultar mensagens.");

    const messages = await this.communicationService.listContactMessages();

    return { messages };
  }

  async subscribeNewsletter(request: NewsletterRequest, reply: FastifyReply) {
    const subscription = await this.communicationService.subscribeNewsletter(request.body);

    return reply.code(201).send({ subscription });
  }

  async listNewsletterSubscriptions(request: FastifyRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem consultar subscrições.");

    const subscriptions = await this.communicationService.listNewsletterSubscriptions();

    return { subscriptions };
  }
}
