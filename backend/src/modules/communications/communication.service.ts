import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import { buildPaginationMeta } from "../../shared/pagination.js";
import { toPublicContactMessage, toPublicNewsletterSubscription } from "./communication.mapper.js";
import type {
  ContactListQuery,
  ContactMessageInput,
  ContactMessageStatus,
  NewsletterInput,
  NewsletterListQuery
} from "./communication.schemas.js";

export class CommunicationService {
  constructor(private readonly prisma: PrismaClient) {}

  async createContactMessage(input: ContactMessageInput) {
    const message = await this.prisma.contactMessage.create({
      data: input
    });

    return toPublicContactMessage(message);
  }

  async listContactMessages(query: ContactListQuery) {
    const page = query.page;
    const limit = query.limit;
    const where = query.status ? { status: query.status } : undefined;

    const [messages, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.contactMessage.count({ where })
    ]);

    return {
      messages: messages.map(toPublicContactMessage),
      meta: buildPaginationMeta({ page, limit, total })
    };
  }

  async updateContactMessageStatus(id: string, status: ContactMessageStatus) {
    try {
      const message = await this.prisma.contactMessage.update({
        where: { id },
        data: { status }
      });

      return toPublicContactMessage(message);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Mensagem não encontrada.");
      }

      throw error;
    }
  }

  async subscribeNewsletter(input: NewsletterInput) {
    try {
      const subscription = await this.prisma.newsletterSubscription.create({
        data: input
      });

      return toPublicNewsletterSubscription(subscription);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "Este email já está subscrito.");
      }

      throw error;
    }
  }

  async listNewsletterSubscriptions(query: NewsletterListQuery) {
    const page = query.page;
    const limit = query.limit;

    const [subscriptions, total] = await this.prisma.$transaction([
      this.prisma.newsletterSubscription.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.newsletterSubscription.count()
    ]);

    return {
      subscriptions: subscriptions.map(toPublicNewsletterSubscription),
      meta: buildPaginationMeta({ page, limit, total })
    };
  }
}
