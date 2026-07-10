import { z } from "zod";

export const askChatSchema = z.object({
  question: z.string().trim().min(3, "Question is too short").max(2000, "Question is too long"),
});

export const getChatHistorySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export const deleteChatHistorySchema = z.object({}).passthrough();

export type IAskChatInput = z.infer<typeof askChatSchema>;
export type IGetChatHistoryInput = z.infer<typeof getChatHistorySchema>;
