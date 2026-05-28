import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import { toPublicContactMessage, toPublicNewsletterSubscription } from "./communication.mapper.js";
import type {
  ContactMessageInput,
  ContactMessageListQuery,
  ContactMessageStatusInput,
  NewsletterInput,
  NewsletterSubscriptionsListQuery
} from "./communication.schemas.js";

function makeMeta(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

export class CommunicationService {
  constructor(private readonly prisma: PrismaClient) {}

  async createContactMessage(input: ContactMessageInput) {
    const message = await this.prisma.contactMessage.create({
      data: input
    });

    return toPublicContactMessage(message);
  }

  async listContactMessages(query: ContactMessageListQuery) {
    const where: Prisma.ContactMessageWhereInput = query.status ? { status: query.status } : {};
    const skip = (query.page - 1) * query.limit;

    const [messages, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit
      }),
      this.prisma.contactMessage.count({ where })
    ]);

    return {
      messages: messages.map(toPublicContactMessage),
      meta: makeMeta(query.page, query.limit, total)
    };
  }

  async updateContactMessageStatus(id: string, input: ContactMessageStatusInput) {
    try {
      const message = await this.prisma.contactMessage.update({
        where: { id },
        data: { status: input.status }
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

  async listNewsletterSubscriptions(query: NewsletterSubscriptionsListQuery) {
    const skip = (query.page - 1) * query.limit;

    const [subscriptions, total] = await this.prisma.$transaction([
      this.prisma.newsletterSubscription.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit
      }),
      this.prisma.newsletterSubscription.count()
    ]);

    return {
      subscriptions: subscriptions.map(toPublicNewsletterSubscription),
      meta: makeMeta(query.page, query.limit, total)
    };
  }
}
