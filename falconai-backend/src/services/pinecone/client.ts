import { Pinecone } from "@pinecone-database/pinecone";
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";

export type PineconeChunkMetadata = {
  documentId: string;
  chunkId: string;
  title: string;
  filename: string;
  chunkIndex: number;
};

export type PineconeMatch = {
  id: string;
  score: number;
  metadata: PineconeChunkMetadata;
};

let pineconeClient: Pinecone | null = null;

function getConfig() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME || "falconai-kb";
  return { apiKey, indexName };
}

export function isPineconeConfigured() {
  return Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME);
}

function getClient() {
  const { apiKey } = getConfig();
  if (!apiKey) return { error: statusCodes.PineconeNotConfigured };

  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey });
  }

  return { client: pineconeClient };
}

function getIndex() {
  const result = getClient();
  if ("error" in result && result.error) return { error: result.error };

  const { indexName } = getConfig();
  return { index: result.client!.index({ name: indexName }) };
}

const upsertVectors = async (
  vectors: Array<{ id: string; values: number[]; metadata: PineconeChunkMetadata }>,
) => {
  try {
    const result = getIndex();
    if ("error" in result && result.error) return { error: result.error };

    // Pinecone upsert accepts batches; keep under ~100 for safety
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await result.index!.upsert({ records: batch });
    }

    return {};
  } catch (error) {
    logger.error(`Error in upsertVectors: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.RagIndexingFailed };
  }
};

const queryVectors = async (vector: number[], topK: number) => {
  try {
    const result = getIndex();
    if ("error" in result && result.error) return { error: result.error };

    const response = await result.index!.query({
      vector,
      topK,
      includeMetadata: true,
    });

    const matches: PineconeMatch[] = (response.matches || []).map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      metadata: match.metadata as unknown as PineconeChunkMetadata,
    }));

    return { matches };
  } catch (error) {
    logger.error(`Error in queryVectors: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const deleteByDocumentId = async (documentId: string) => {
  try {
    const result = getIndex();
    if ("error" in result && result.error) return { error: result.error };

    await result.index!.deleteMany({ filter: { documentId } });
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Empty index / no matching vectors often surfaces as 404 — safe to ignore
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      logger.warn(`deleteByDocumentId: nothing to delete for ${documentId} (${message})`);
      return {};
    }
    logger.error(`Error in deleteByDocumentId: ${message}`);
    return { error: statusCodes.InternalServerError };
  }
};

const deleteByIds = async (ids: string[]) => {
  try {
    if (ids.length === 0) return {};
    const result = getIndex();
    if ("error" in result && result.error) return { error: result.error };

    await result.index!.deleteMany({ ids });
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      logger.warn(`deleteByIds: nothing to delete (${message})`);
      return {};
    }
    logger.error(`Error in deleteByIds: ${message}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const pineconeService = {
  isPineconeConfigured,
  upsertVectors,
  queryVectors,
  deleteByDocumentId,
  deleteByIds,
};
