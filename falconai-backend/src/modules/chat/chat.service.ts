import { db } from "@app/config/db";
import statusCodes from "@app/constants/statusCodes";
import { getPlatformSetting } from "@app/modules/platform-settings/platform-settings.service";
import { chatConversations, chatMessages, knowledgeChunks, knowledgeDocuments } from "@app/schema/tables";
import { INewChatMessage } from "@app/schema/types";
import { embeddingsService } from "@app/services/ai/embeddings";
import { llmService, type RagContext } from "@app/services/ai/llm";
import logger from "@app/services/logging/logger";
import { pineconeService } from "@app/services/pinecone/client";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

const REFUSAL_MESSAGE =
  "I don't have enough information in the knowledge base to answer that. Try asking about project setup, team norms, architecture, or onboarding.";

export type ChatStreamEvent =
  | { type: "status"; message: string }
  | { type: "token"; content: string }
  | {
      type: "done";
      answer: string;
      citations: Array<{
        documentId: string;
        title: string;
        filename: string;
        chunkIndex?: number;
        content?: string;
      }>;
      grounded: boolean;
      provider: string | null;
      conversationId: string;
      conversationTitle?: string;
    }
  | { type: "error"; message: string; code?: number };

function titleFromQuestion(question: string) {
  const cleaned = question.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 48) return cleaned;
  return `${cleaned.slice(0, 45).trimEnd()}…`;
}

async function getOwnedConversation(userId: string, conversationId: string) {
  const [conversation] = await db
    .select()
    .from(chatConversations)
    .where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)))
    .limit(1);
  return conversation || null;
}

async function touchConversation(conversationId: string, title?: string) {
  await db
    .update(chatConversations)
    .set({
      ...(title ? { title } : {}),
      updatedAt: new Date(),
    })
    .where(eq(chatConversations.id, conversationId));
}

async function getRagConfig() {
  const topKRaw = await getPlatformSetting("ai.rag_top_k");
  const minScoreRaw = await getPlatformSetting("ai.rag_min_score");
  const topK = Math.max(1, Number(topKRaw) || 4);
  const minScore = Number(minScoreRaw);
  return {
    topK,
    minScore: Number.isFinite(minScore) ? minScore : 0.35,
  };
}

async function retrieveContexts(question: string) {
  const { topK, minScore } = await getRagConfig();

  const { embedding, error: embedErr } = await embeddingsService.embedText(question);
  if (embedErr || !embedding) return { error: embedErr || statusCodes.AiNotConfigured };

  const { matches, error: queryErr } = await pineconeService.queryVectors(embedding, topK);
  if (queryErr) return { error: queryErr };

  const bestScore = matches?.[0]?.score ?? 0;
  const usableMatches = (matches || []).filter((m) => m.score >= minScore && m.metadata?.chunkId);

  if (!usableMatches.length || bestScore < minScore) {
    return { contexts: [] as RagContext[], refused: true as const };
  }

  const chunkIds = usableMatches.map((m) => m.metadata.chunkId);
  const chunkRows = await db.query.knowledgeChunks.findMany({
    where: inArray(knowledgeChunks.id, chunkIds),
    with: {
      document: true,
    },
  });

  const chunkById = new Map(chunkRows.map((c) => [c.id, c]));
  const contexts: RagContext[] = [];

  for (const match of usableMatches) {
    const row = chunkById.get(match.metadata.chunkId);
    if (!row?.document) continue;
    contexts.push({
      documentId: row.document.id,
      title: row.document.title,
      filename: row.document.filename,
      chunkIndex: row.chunkIndex,
      content: row.content,
    });
  }

  if (contexts.length === 0) {
    return { contexts: [] as RagContext[], refused: true as const };
  }

  return { contexts, refused: false as const };
}

const listConversations = async (userId: string, limit = 50) => {
  try {
    const conversations = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt))
      .limit(limit);
    return { conversations };
  } catch (error) {
    logger.error(`Error in listConversations: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const createConversation = async (userId: string, title?: string) => {
  try {
    const [conversation] = await db
      .insert(chatConversations)
      .values({
        userId,
        title: title?.trim() || "New chat",
      })
      .returning();
    return { conversation };
  } catch (error) {
    logger.error(`Error in createConversation: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updateConversation = async (userId: string, conversationId: string, title: string) => {
  try {
    const existing = await getOwnedConversation(userId, conversationId);
    if (!existing) return { error: statusCodes.ConversationNotFound };

    const [conversation] = await db
      .update(chatConversations)
      .set({ title: title.trim(), updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId))
      .returning();

    return { conversation };
  } catch (error) {
    logger.error(`Error in updateConversation: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const deleteConversation = async (userId: string, conversationId: string) => {
  try {
    const existing = await getOwnedConversation(userId, conversationId);
    if (!existing) return { error: statusCodes.ConversationNotFound };

    await db.delete(chatConversations).where(eq(chatConversations.id, conversationId));
    return {};
  } catch (error) {
    logger.error(`Error in deleteConversation: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const ask = async (userId: string, conversationId: string, question: string) => {
  try {
    const conversation = await getOwnedConversation(userId, conversationId);
    if (!conversation) return { error: statusCodes.ConversationNotFound };

    const shouldRename = conversation.title === "New chat";
    const nextTitle = shouldRename ? titleFromQuestion(question) : undefined;

    const userMessage: INewChatMessage = {
      conversationId,
      userId,
      role: "user",
      content: question,
      citations: [],
    };
    await db.insert(chatMessages).values(userMessage);

    const retrieved = await retrieveContexts(question);
    if (retrieved.error) return { error: retrieved.error };

    if (retrieved.refused || !retrieved.contexts.length) {
      const assistantMessage: INewChatMessage = {
        conversationId,
        userId,
        role: "assistant",
        content: REFUSAL_MESSAGE,
        citations: [],
      };
      const [saved] = await db.insert(chatMessages).values(assistantMessage).returning();
      await touchConversation(conversationId, nextTitle);

      return {
        answer: REFUSAL_MESSAGE,
        citations: [],
        grounded: false,
        provider: null,
        message: saved,
        conversationId,
        conversationTitle: nextTitle || conversation.title,
      };
    }

    const { result, error: llmErr } = await llmService.generateGroundedAnswer(question, retrieved.contexts);
    if (llmErr || !result) return { error: llmErr || statusCodes.InternalServerError };

    const citations = result.grounded ? result.citations : [];
    const answer = result.grounded ? result.answer : result.answer || REFUSAL_MESSAGE;

    const assistantMessage: INewChatMessage = {
      conversationId,
      userId,
      role: "assistant",
      content: answer,
      citations,
    };
    const [saved] = await db.insert(chatMessages).values(assistantMessage).returning();
    await touchConversation(conversationId, nextTitle);

    return {
      answer,
      citations,
      grounded: result.grounded,
      provider: result.provider,
      message: saved,
      conversationId,
      conversationTitle: nextTitle || conversation.title,
    };
  } catch (error) {
    logger.error(`Error in chat ask: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const askStream = async (
  userId: string,
  conversationId: string,
  question: string,
  emit: (event: ChatStreamEvent) => void,
) => {
  try {
    const conversation = await getOwnedConversation(userId, conversationId);
    if (!conversation) {
      emit({
        type: "error",
        message: statusCodes.ConversationNotFound.message,
        code: statusCodes.ConversationNotFound.code,
      });
      return { error: statusCodes.ConversationNotFound };
    }

    const shouldRename = conversation.title === "New chat";
    const nextTitle = shouldRename ? titleFromQuestion(question) : undefined;

    emit({ type: "status", message: "Searching the knowledge base…" });

    const userMessage: INewChatMessage = {
      conversationId,
      userId,
      role: "user",
      content: question,
      citations: [],
    };
    await db.insert(chatMessages).values(userMessage);

    const retrieved = await retrieveContexts(question);
    if (retrieved.error) {
      emit({
        type: "error",
        message: retrieved.error.message,
        code: retrieved.error.code,
      });
      return { error: retrieved.error };
    }

    if (retrieved.refused || !retrieved.contexts.length) {
      emit({ type: "token", content: REFUSAL_MESSAGE });
      const assistantMessage: INewChatMessage = {
        conversationId,
        userId,
        role: "assistant",
        content: REFUSAL_MESSAGE,
        citations: [],
      };
      await db.insert(chatMessages).values(assistantMessage);
      await touchConversation(conversationId, nextTitle);
      emit({
        type: "done",
        answer: REFUSAL_MESSAGE,
        citations: [],
        grounded: false,
        provider: null,
        conversationId,
        conversationTitle: nextTitle || conversation.title,
      });
      return {};
    }

    emit({ type: "status", message: "Writing an answer…" });

    const { result, error: llmErr } = await llmService.streamGroundedAnswer(question, retrieved.contexts, (token) => {
      emit({ type: "token", content: token });
    });

    if (llmErr || !result) {
      const err = llmErr || statusCodes.InternalServerError;
      emit({ type: "error", message: err.message, code: err.code });
      return { error: err };
    }

    const citations = result.grounded ? result.citations : [];
    const answer = result.answer || REFUSAL_MESSAGE;

    const assistantMessage: INewChatMessage = {
      conversationId,
      userId,
      role: "assistant",
      content: answer,
      citations,
    };
    await db.insert(chatMessages).values(assistantMessage);
    await touchConversation(conversationId, nextTitle);

    emit({
      type: "done",
      answer,
      citations,
      grounded: result.grounded,
      provider: result.provider,
      conversationId,
      conversationTitle: nextTitle || conversation.title,
    });

    return {};
  } catch (error) {
    logger.error(`Error in chat askStream: ${error instanceof Error ? error.message : String(error)}`);
    emit({
      type: "error",
      message: statusCodes.InternalServerError.message,
      code: statusCodes.InternalServerError.code,
    });
    return { error: statusCodes.InternalServerError };
  }
};

const getHistory = async (userId: string, conversationId: string, limit = 100) => {
  try {
    const conversation = await getOwnedConversation(userId, conversationId);
    if (!conversation) return { error: statusCodes.ConversationNotFound };

    const messages = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.conversationId, conversationId), eq(chatMessages.userId, userId)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return { conversation, messages: messages.reverse() };
  } catch (error) {
    logger.error(`Error in getHistory: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getCitationSource = async (documentId: string, chunkIndex?: number) => {
  try {
    const document = await db.query.knowledgeDocuments.findFirst({
      where: eq(knowledgeDocuments.id, documentId),
    });
    if (!document) return { error: statusCodes.KnowledgeDocumentNotFound };

    let chunk = null as typeof knowledgeChunks.$inferSelect | null;
    if (typeof chunkIndex === "number") {
      const [row] = await db
        .select()
        .from(knowledgeChunks)
        .where(and(eq(knowledgeChunks.documentId, documentId), eq(knowledgeChunks.chunkIndex, chunkIndex)))
        .limit(1);
      chunk = row || null;
    }

    if (!chunk) {
      const [row] = await db
        .select()
        .from(knowledgeChunks)
        .where(eq(knowledgeChunks.documentId, documentId))
        .orderBy(asc(knowledgeChunks.chunkIndex))
        .limit(1);
      chunk = row || null;
    }

    if (!chunk) {
      return {
        source: {
          documentId: document.id,
          title: document.title,
          filename: document.filename,
          chunkIndex: 0,
          excerpt: "",
          documentContent: document.content,
        },
      };
    }

    return {
      source: {
        documentId: document.id,
        title: document.title,
        filename: document.filename,
        chunkIndex: chunk.chunkIndex,
        excerpt: chunk.content,
        documentContent: document.content,
      },
    };
  } catch (error) {
    logger.error(`Error in getCitationSource: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const chatService = {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  ask,
  askStream,
  getHistory,
  getCitationSource,
};
