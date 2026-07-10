import { z } from "zod";

// Admin: Get all sessions with optional filters
export const getAllSessionsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isValid: z.coerce.boolean().optional(),
  search: z.string().optional(), // Search by userId/sessionId/accessToken/refreshToken
});

// Admin: Get session statistics
export const getStatsSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Admin: Invalidate specific sessions
export const invalidateSessionsSchema = z.object({
  sessionIds: z.array(z.string().uuid("Invalid session ID format")).min(1, "At least one session ID is required"),
});

export type IGetAllSessionsInput = z.infer<typeof getAllSessionsSchema>;
export type IGetStatsInput = z.infer<typeof getStatsSchema>;
export type IInvalidateSessionsInput = z.infer<typeof invalidateSessionsSchema>;
