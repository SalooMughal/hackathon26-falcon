import { db } from "@app/config/db";
import statusCodes from "@app/constants/statusCodes";
import { knowledgeChunks, knowledgeDocuments } from "@app/schema/tables";
import { INewKnowledgeChunk, INewKnowledgeDocument } from "@app/schema/types";
import { chunkMarkdown } from "@app/services/ai/chunking";
import { embeddingsService } from "@app/services/ai/embeddings";
import logger from "@app/services/logging/logger";
import { pineconeService } from "@app/services/pinecone/client";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

function slugifyFilename(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base || "document"}.md`;
}

function toListItem(doc: typeof knowledgeDocuments.$inferSelect) {
  return {
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    status: doc.status,
    chunkCount: doc.chunkCount,
    errorMessage: doc.errorMessage,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const indexDocument = async (documentId: string) => {
  const [doc] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId)).limit(1);
  if (!doc) return { error: statusCodes.KnowledgeDocumentNotFound };

  await db
    .update(knowledgeDocuments)
    .set({ status: "pending", errorMessage: null, updatedAt: new Date() })
    .where(eq(knowledgeDocuments.id, documentId));

  // Clear previous chunks + vectors
  const existingChunks = await db.select().from(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));
  if (existingChunks.length > 0) {
    await pineconeService.deleteByIds(existingChunks.map((c) => c.pineconeId));
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));
  } else {
    await pineconeService.deleteByDocumentId(documentId);
  }

  const chunks = chunkMarkdown(doc.content);
  if (chunks.length === 0) {
    await db
      .update(knowledgeDocuments)
      .set({ status: "failed", errorMessage: "Document produced no chunks", chunkCount: 0, updatedAt: new Date() })
      .where(eq(knowledgeDocuments.id, documentId));
    return { error: statusCodes.RagIndexingFailed };
  }

  const { embeddings, error: embedErr } = await embeddingsService.embedTexts(chunks.map((c) => c.content));
  if (embedErr || !embeddings) {
    await db
      .update(knowledgeDocuments)
      .set({
        status: "failed",
        errorMessage: embedErr?.message || "Embedding failed",
        chunkCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDocuments.id, documentId));
    return { error: embedErr || statusCodes.AiNotConfigured };
  }

  const chunkRows: INewKnowledgeChunk[] = chunks.map((chunk, i) => ({
    documentId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    tokenEstimate: chunk.tokenEstimate,
    pineconeId: `${documentId}:${chunk.chunkIndex}:${randomUUID().slice(0, 8)}`,
  }));

  const inserted = await db.insert(knowledgeChunks).values(chunkRows).returning();

  const vectors = inserted.map((row, i) => ({
    id: row.pineconeId,
    values: embeddings[i],
    metadata: {
      documentId,
      chunkId: row.id,
      title: doc.title,
      filename: doc.filename,
      chunkIndex: row.chunkIndex,
    },
  }));

  const { error: upsertErr } = await pineconeService.upsertVectors(vectors);
  if (upsertErr) {
    await db
      .update(knowledgeDocuments)
      .set({
        status: "failed",
        errorMessage: upsertErr.message,
        chunkCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDocuments.id, documentId));
    return { error: upsertErr };
  }

  const [updated] = await db
    .update(knowledgeDocuments)
    .set({
      status: "indexed",
      chunkCount: inserted.length,
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeDocuments.id, documentId))
    .returning();

  return { document: updated };
};

const getAllDocuments = async (page = 1, limit = 10, search?: string) => {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (search) {
      conditions.push(
        or(ilike(knowledgeDocuments.title, `%${search}%`), ilike(knowledgeDocuments.filename, `%${search}%`)),
      );
    }
    const whereClause = conditions.length ? and(...conditions) : undefined;

    const [docs, totalResult] = await Promise.all([
      db
        .select()
        .from(knowledgeDocuments)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(knowledgeDocuments.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(knowledgeDocuments).where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      documents: docs.map(toListItem),
      pagination: { total, count: docs.length, page, limit },
    };
  } catch (error) {
    logger.error(`Error in getAllDocuments: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getOneDocument = async (documentId: string) => {
  try {
    const document = await db.query.knowledgeDocuments.findFirst({
      where: eq(knowledgeDocuments.id, documentId),
      with: {
        chunks: {
          columns: {
            id: true,
            chunkIndex: true,
            tokenEstimate: true,
            pineconeId: true,
            createdAt: true,
          },
          orderBy: (chunks, { asc }) => [asc(chunks.chunkIndex)],
        },
      },
    });

    if (!document) return { error: statusCodes.KnowledgeDocumentNotFound };
    return { document };
  } catch (error) {
    logger.error(`Error in getOneDocument: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const createDocument = async (input: { title: string; filename?: string; content: string }, userId?: string) => {
  try {
    const filename = input.filename?.trim() || slugifyFilename(input.title);

    const [existing] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.filename, filename)).limit(1);
    if (existing) return { error: statusCodes.KnowledgeDocumentExists };

    const values: INewKnowledgeDocument = {
      title: input.title.trim(),
      filename,
      content: input.content,
      status: "pending",
      createdBy: userId || null,
    };

    const [doc] = await db.insert(knowledgeDocuments).values(values).returning();
    const indexed = await indexDocument(doc.id);
    if (indexed.error) {
      // Document row still exists with failed status — return it with error context
      const [failed] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, doc.id)).limit(1);
      return { document: failed, error: indexed.error };
    }

    return { document: indexed.document };
  } catch (error) {
    logger.error(`Error in createDocument: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updateDocument = async (
  documentId: string,
  input: { title?: string; filename?: string; content?: string },
) => {
  try {
    const [existing] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId)).limit(1);
    if (!existing) return { error: statusCodes.KnowledgeDocumentNotFound };

    if (input.filename && input.filename !== existing.filename) {
      const [dup] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.filename, input.filename)).limit(1);
      if (dup) return { error: statusCodes.KnowledgeDocumentExists };
    }

    const contentChanged = input.content !== undefined && input.content !== existing.content;

    await db
      .update(knowledgeDocuments)
      .set({
        title: input.title?.trim() ?? existing.title,
        filename: input.filename?.trim() ?? existing.filename,
        content: input.content ?? existing.content,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDocuments.id, documentId));

    if (contentChanged || input.title || input.filename) {
      const indexed = await indexDocument(documentId);
      if (indexed.error) {
        const [failed] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId)).limit(1);
        return { document: failed, error: indexed.error };
      }
      return { document: indexed.document };
    }

    const [updated] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId)).limit(1);
    return { document: updated };
  } catch (error) {
    logger.error(`Error in updateDocument: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const deleteDocument = async (documentId: string) => {
  try {
    const [existing] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId)).limit(1);
    if (!existing) return { error: statusCodes.KnowledgeDocumentNotFound };

    const chunks = await db.select().from(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));
    if (chunks.length > 0) {
      await pineconeService.deleteByIds(chunks.map((c) => c.pineconeId));
    } else {
      await pineconeService.deleteByDocumentId(documentId);
    }

    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId));
    return {};
  } catch (error) {
    logger.error(`Error in deleteDocument: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const reindexDocuments = async (documentId?: string) => {
  try {
    let docs;
    if (documentId) {
      const [doc] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.id, documentId)).limit(1);
      if (!doc) return { error: statusCodes.KnowledgeDocumentNotFound };
      docs = [doc];
    } else {
      docs = await db
        .select()
        .from(knowledgeDocuments)
        .where(or(eq(knowledgeDocuments.status, "failed"), eq(knowledgeDocuments.status, "pending")));
    }

    const results: Array<{ documentId: string; filename: string; ok: boolean; message?: string }> = [];

    for (const doc of docs) {
      const indexed = await indexDocument(doc.id);
      results.push({
        documentId: doc.id,
        filename: doc.filename,
        ok: !indexed.error,
        message: indexed.error?.message,
      });
    }

    return { results, reindexed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
  } catch (error) {
    logger.error(`Error in reindexDocuments: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const knowledgeBaseService = {
  getAllDocuments,
  getOneDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  indexDocument,
  reindexDocuments,
};
