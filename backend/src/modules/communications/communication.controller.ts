import type { FastifyReply, FastifyRequest } from "fastify";
import { assertRole } from "../../shared/authorization.js";
import type { CommunicationService } from "./communication.service.js";
import type {
  ContactMessageInput,
  ContactMessageListQuery,
  ContactMessageParams,
  ContactMessageStatusInput,
  NewsletterInput,
  NewsletterSubscriptionsListQuery
} from "./communication.schemas.js";

type ContactRequest = FastifyRequest<{ Body: ContactMessageInput }>;
type ContactListRequest = FastifyRequest<{ Querystring: ContactMessageListQuery }>;
type ContactStatusRequest = FastifyRequest<{ Params: ContactMessageParams; Body: ContactMessageStatusInput }>;
type NewsletterRequest = FastifyRequest<{ Body: NewsletterInput }>;
type NewsletterListRequest = FastifyRequest<{ Querystring: NewsletterSubscriptionsListQuery }>;

export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  async createContactMessage(request: ContactRequest, reply: FastifyReply) {
    const message = await this.communicationService.createContactMessage(request.body);

    return reply.code(201).send({ message });
  }

  async listContactMessages(request: ContactListRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem consultar mensagens.");

    const result = await this.communicationService.listContactMessages(request.query);

    return result;
  }

  async updateContactMessageStatus(request: ContactStatusRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem atualizar mensagens.");

    const message = await this.communicationService.updateContactMessageStatus(request.params.id, request.body);

    return { message };
  }

  async subscribeNewsletter(request: NewsletterRequest, reply: FastifyReply) {
    const subscription = await this.communicationService.subscribeNewsletter(request.body);

    return reply.code(201).send({ subscription });
  }

  async listNewsletterSubscriptions(request: NewsletterListRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem consultar subscrições.");

    const result = await this.communicationService.listNewsletterSubscriptions(request.query);

    return result;
  }
}
