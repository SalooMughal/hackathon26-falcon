import { z } from "zod";

const notificationTypes = ["info", "warn", "error"] as const;
const notificationStatuses = ["read", "un-read", "archived"] as const;

export const getAllSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(notificationTypes).optional(),
  status: z.enum(notificationStatuses).optional(),
});

export const getCountsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(notificationTypes).optional(),
  status: z.enum(notificationStatuses).optional(),
});

export const getOneSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const createSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  type: z.enum(notificationTypes).optional().default("info"),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  data: z.record(z.string(), z.any()).optional().default({}),
});

export const markAllReadSchema = z.object({
  id: z.string().uuid("Invalid notification ID format").optional(),
});

export const updateStatusSchema = z.object({
  id: z.string().uuid("Invalid notification ID format"),
  status: z.enum(notificationStatuses),
});

export const deleteSchema = z.object({
  id: z.string().uuid("Invalid notification ID format"),
});

export type IGetAllNotificationsInput = z.infer<typeof getAllSchema>;
export type IGetCountsInput = z.infer<typeof getCountsSchema>;
export type IGetOneNotificationInput = z.infer<typeof getOneSchema>;
export type ICreateNotificationInput = z.infer<typeof createSchema>;
export type IMarkAllReadInput = z.infer<typeof markAllReadSchema>;
export type IUpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type IDeleteNotificationInput = z.infer<typeof deleteSchema>;
