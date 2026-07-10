import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar, text, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { knowledgeDocumentStatusEnum } from "./enums";

export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    content: text("content").notNull(),
    status: knowledgeDocumentStatusEnum("status").notNull().default("pending"),
    chunkCount: integer("chunk_count").notNull().default(0),
    errorMessage: text("error_message"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("knowledge_documents_status_idx").on(t.status),
    createdByIdx: index("knowledge_documents_created_by_idx").on(t.createdBy),
    filenameIdx: index("knowledge_documents_filename_idx").on(t.filename),
  }),
);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    tokenEstimate: integer("token_estimate").notNull().default(0),
    pineconeId: varchar("pinecone_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    documentIdIdx: index("knowledge_chunks_document_id_idx").on(t.documentId),
    pineconeIdIdx: uniqueIndex("knowledge_chunks_pinecone_id_idx").on(t.pineconeId),
  }),
);

export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ one, many }) => ({
  creator: one(users, {
    fields: [knowledgeDocuments.createdBy],
    references: [users.id],
  }),
  chunks: many(knowledgeChunks),
}));

export const knowledgeChunksRelations = relations(knowledgeChunks, ({ one }) => ({
  document: one(knowledgeDocuments, {
    fields: [knowledgeChunks.documentId],
    references: [knowledgeDocuments.id],
  }),
}));
