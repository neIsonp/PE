import { z } from "zod";
import { paginationMetaSchema, paginationQuerySchema } from "../../shared/pagination.js";

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

export const contactMessageStatusSchema = z.enum(["PENDING", "READ", "ARCHIVED"]);

export const contactMessageSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  message: z.string(),
  status: contactMessageStatusSchema,
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
  messages: z.array(contactMessageSchema),
  meta: paginationMetaSchema
});

export const newsletterSubscriptionResponseSchema = z.object({
  subscription: newsletterSubscriptionSchema
});

export const newsletterSubscriptionsListResponseSchema = z.object({
  subscriptions: z.array(newsletterSubscriptionSchema),
  meta: paginationMetaSchema
});

export const contactListQuerySchema = paginationQuerySchema.extend({
  status: contactMessageStatusSchema.optional()
});

export const newsletterListQuerySchema = paginationQuerySchema;

export const contactStatusParamsSchema = z.object({
  id: z.string().min(1)
});

export const contactStatusBodySchema = z.object({
  status: contactMessageStatusSchema
});

export const contactStatusResponseSchema = z.object({
  message: contactMessageSchema
});

export type ContactMessageInput = z.infer<typeof contactMessageBodySchema>;
export type NewsletterInput = z.infer<typeof newsletterBodySchema>;
export type ContactMessageStatus = z.infer<typeof contactMessageStatusSchema>;
export type ContactListQuery = z.infer<typeof contactListQuerySchema>;
export type NewsletterListQuery = z.infer<typeof newsletterListQuerySchema>;
export type ContactStatusParams = z.infer<typeof contactStatusParamsSchema>;
export type ContactStatusInput = z.infer<typeof contactStatusBodySchema>;
