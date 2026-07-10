import { z } from "zod";

export const askChatSchema = z.object({
  conversationId: z.uuid("Invalid conversation ID"),
  question: z.string().trim().min(3, "Question is too short").max(2000, "Question is too long"),
});

export const getChatHistorySchema = z.object({
  conversationId: z.uuid("Invalid conversation ID"),
  limit: z.coerce.number().int().positive().max(200).optional().default(100),
});

export const listConversationsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export const getConversationSchema = z.object({
  conversationId: z.uuid("Invalid conversation ID"),
});

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
});

export const updateConversationSchema = z.object({
  conversationId: z.uuid("Invalid conversation ID"),
  title: z.string().trim().min(1).max(255),
});

export const deleteConversationSchema = z.object({
  conversationId: z.uuid("Invalid conversation ID"),
});

export type IAskChatInput = z.infer<typeof askChatSchema>;
export type IGetChatHistoryInput = z.infer<typeof getChatHistorySchema>;
export type IListConversationsInput = z.infer<typeof listConversationsSchema>;
export type IGetConversationInput = z.infer<typeof getConversationSchema>;
export type ICreateConversationInput = z.infer<typeof createConversationSchema>;
export type IUpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type IDeleteConversationInput = z.infer<typeof deleteConversationSchema>;
