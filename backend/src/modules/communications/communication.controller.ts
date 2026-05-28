import type { FastifyReply, FastifyRequest } from "fastify";
import { assertRole } from "../../shared/authorization.js";
import type { CommunicationService } from "./communication.service.js";
import type {
  ContactListQuery,
  ContactMessageInput,
  ContactStatusInput,
  NewsletterInput,
  NewsletterListQuery
} from "./communication.schemas.js";

export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  async createContactMessage(request: FastifyRequest, reply: FastifyReply) {
    const message = await this.communicationService.createContactMessage(request.body as ContactMessageInput);

    return reply.code(201).send({ message });
  }

  async listContactMessages(request: FastifyRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem consultar mensagens.");

    const result = await this.communicationService.listContactMessages(request.query as ContactListQuery);

    return result;
  }

  async updateContactMessageStatus(request: FastifyRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem alterar o estado das mensagens.");
    const params = request.params as { id: string };
    const body = request.body as ContactStatusInput;

    const message = await this.communicationService.updateContactMessageStatus(params.id, body.status);

    return { message };
  }

  async subscribeNewsletter(request: FastifyRequest, reply: FastifyReply) {
    const subscription = await this.communicationService.subscribeNewsletter(request.body as NewsletterInput);

    return reply.code(201).send({ subscription });
  }

  async listNewsletterSubscriptions(request: FastifyRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem consultar subscrições.");

    const result = await this.communicationService.listNewsletterSubscriptions(
      request.query as NewsletterListQuery
    );

    return result;
  }
}
