import type { ContactMessage, NewsletterSubscription } from "@prisma/client";

export function toPublicContactMessage(message: ContactMessage) {
  return {
    id: message.id,
    firstName: message.firstName,
    lastName: message.lastName,
    email: message.email,
    phone: message.phone,
    message: message.message,
    status: message.status,
    createdAt: message.createdAt.toISOString()
  };
}

export function toPublicNewsletterSubscription(subscription: NewsletterSubscription) {
  return {
    id: subscription.id,
    email: subscription.email,
    createdAt: subscription.createdAt.toISOString()
  };
}
