import { z } from "zod";

const eventDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "A data deve usar o formato YYYY-MM-DD.")
  .refine((date) => {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(date);
  }, "Indique uma data válida.");

const eventTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "A hora deve usar o formato HH:mm.");

export const eventBodySchema = z.object({
  title: z.string().trim().min(3).max(140),
  date: eventDateSchema,
  time: eventTimeSchema,
  location: z.string().trim().min(2).max(80),
  venue: z.string().trim().min(2).max(160).optional().nullable(),
  latitude: z.union([z.coerce.number().min(36).max(40), z.null()]).optional(),
  longitude: z.union([z.coerce.number().min(-32).max(-24), z.null()]).optional(),
  description: z.string().trim().max(500).optional().nullable()
}).refine(
  (event) => (event.latitude == null && event.longitude == null) || (event.latitude != null && event.longitude != null),
  {
    message: "Indique latitude e longitude em conjunto.",
    path: ["latitude"]
  }
);

export const eventParamsSchema = z.object({
  id: z.string().min(1)
});

export const eventListQuerySchema = z.object({
  period: z.enum(["upcoming", "past"]).optional()
});

export const publicEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  venue: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  description: z.string().nullable(),
  createdById: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const eventResponseSchema = z.object({
  event: publicEventSchema
});

export const eventsListResponseSchema = z.object({
  events: z.array(publicEventSchema)
});

export type EventInput = z.infer<typeof eventBodySchema>;
export type EventParams = z.infer<typeof eventParamsSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;
