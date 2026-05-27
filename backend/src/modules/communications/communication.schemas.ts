import { z } from "zod";

export const contactMessageBodySchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().min(6).max(30),
  message: z.string().trim().min(10).max(500)
});

export const newsletterBodySchema = z.object({
  email: z.string().trim().email().toLowerCase()
});

export const contactMessageSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  message: z.string(),
  createdAt: z.string().datetime()
});

export const newsletterSubscriptionSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime()
});

export const contactMessageResponseSchema = z.object({
  message: contactMessageSchema
});

export const contactMessagesListResponseSchema = z.object({
  messages: z.array(contactMessageSchema)
});

export const newsletterSubscriptionResponseSchema = z.object({
  subscription: newsletterSubscriptionSchema
});

export const newsletterSubscriptionsListResponseSchema = z.object({
  subscriptions: z.array(newsletterSubscriptionSchema)
});

export type ContactMessageInput = z.infer<typeof contactMessageBodySchema>;
export type NewsletterInput = z.infer<typeof newsletterBodySchema>;
