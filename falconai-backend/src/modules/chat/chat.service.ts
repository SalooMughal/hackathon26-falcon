import { db } from "@app/config/db";
import statusCodes from "@app/constants/statusCodes";
import { getPlatformSetting } from "@app/modules/platform-settings/platform-settings.service";
import { chatMessages, knowledgeChunks } from "@app/schema/tables";
import { INewChatMessage } from "@app/schema/types";
import { embeddingsService } from "@app/services/ai/embeddings";
import { llmService, type RagContext } from "@app/services/ai/llm";
import logger from "@app/services/logging/logger";
import { pineconeService } from "@app/services/pinecone/client";
import { desc, eq, inArray } from "drizzle-orm";

const REFUSAL_MESSAGE =
  "I don't have enough information in the knowledge base to answer that. Try asking about project setup, team norms, architecture, or onboarding.";

export type ChatStreamEvent =
  | { type: "status"; message: string }
  | { type: "token"; content: string }
  | {
      type: "done";
      answer: string;
      citations: Array<{ documentId: string; title: string; filename: string; chunkIndex?: number }>;
      grounded: boolean;
      provider: string | null;
    }
  | { type: "error"; message: string; code?: number };

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

const ask = async (userId: string, question: string) => {
  try {
    const userMessage: INewChatMessage = {
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
        userId,
        role: "assistant",
        content: REFUSAL_MESSAGE,
        citations: [],
      };
      const [saved] = await db.insert(chatMessages).values(assistantMessage).returning();

      return {
        answer: REFUSAL_MESSAGE,
        citations: [],
        grounded: false,
        provider: null,
        message: saved,
      };
    }

    const { result, error: llmErr } = await llmService.generateGroundedAnswer(question, retrieved.contexts);
    if (llmErr || !result) return { error: llmErr || statusCodes.InternalServerError };

    const citations = result.grounded ? result.citations : [];
    const answer = result.grounded ? result.answer : result.answer || REFUSAL_MESSAGE;

    const assistantMessage: INewChatMessage = {
      userId,
      role: "assistant",
      content: answer,
      citations,
    };
    const [saved] = await db.insert(chatMessages).values(assistantMessage).returning();

    return {
      answer,
      citations,
      grounded: result.grounded,
      provider: result.provider,
      message: saved,
    };
  } catch (error) {
    logger.error(`Error in chat ask: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const askStream = async (userId: string, question: string, emit: (event: ChatStreamEvent) => void) => {
  try {
    emit({ type: "status", message: "Searching the knowledge base…" });

    const userMessage: INewChatMessage = {
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
        userId,
        role: "assistant",
        content: REFUSAL_MESSAGE,
        citations: [],
      };
      await db.insert(chatMessages).values(assistantMessage);
      emit({
        type: "done",
        answer: REFUSAL_MESSAGE,
        citations: [],
        grounded: false,
        provider: null,
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
      userId,
      role: "assistant",
      content: answer,
      citations,
    };
    await db.insert(chatMessages).values(assistantMessage);

    emit({
      type: "done",
      answer,
      citations,
      grounded: result.grounded,
      provider: result.provider,
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

const getHistory = async (userId: string, limit = 50) => {
  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return { messages: messages.reverse() };
  } catch (error) {
    logger.error(`Error in getHistory: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const clearHistory = async (userId: string) => {
  try {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
    return {};
  } catch (error) {
    logger.error(`Error in clearHistory: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const chatService = {
  ask,
  askStream,
  getHistory,
  clearHistory,
};
