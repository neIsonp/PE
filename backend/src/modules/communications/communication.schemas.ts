import { z } from "zod";

export const contactMessageStatusSchema = z.enum(["PENDING", "READ", "ARCHIVED"]);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean()
});

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

export const contactMessagesListQuerySchema = paginationQuerySchema.extend({
  status: contactMessageStatusSchema.optional()
});

export const newsletterSubscriptionsListQuerySchema = paginationQuerySchema;

export const contactMessageParamsSchema = z.object({
  id: z.string().min(1)
});

export const updateContactMessageStatusBodySchema = z.object({
  status: contactMessageStatusSchema
});

export type ContactMessageInput = z.infer<typeof contactMessageBodySchema>;
export type ContactMessageListQuery = z.infer<typeof contactMessagesListQuerySchema>;
export type ContactMessageParams = z.infer<typeof contactMessageParamsSchema>;
export type ContactMessageStatusInput = z.infer<typeof updateContactMessageStatusBodySchema>;
export type NewsletterInput = z.infer<typeof newsletterBodySchema>;
export type NewsletterSubscriptionsListQuery = z.infer<typeof newsletterSubscriptionsListQuerySchema>;
