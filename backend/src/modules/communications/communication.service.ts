import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import { toPublicContactMessage, toPublicNewsletterSubscription } from "./communication.mapper.js";
import type { ContactMessageInput, NewsletterInput } from "./communication.schemas.js";

export class CommunicationService {
  constructor(private readonly prisma: PrismaClient) {}

  async createContactMessage(input: ContactMessageInput) {
    const message = await this.prisma.contactMessage.create({
      data: input
    });

    return toPublicContactMessage(message);
  }

  async listContactMessages() {
    const messages = await this.prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" }
    });

    return messages.map(toPublicContactMessage);
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

  async listNewsletterSubscriptions() {
    const subscriptions = await this.prisma.newsletterSubscription.findMany({
      orderBy: { createdAt: "desc" }
    });

    return subscriptions.map(toPublicNewsletterSubscription);
  }
}
