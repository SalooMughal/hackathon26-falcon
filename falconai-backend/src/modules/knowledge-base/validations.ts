import { z } from "zod";

export const getAllKnowledgeDocsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
});

export const getOneKnowledgeDocSchema = z.object({
  documentId: z.uuid("Invalid document ID format"),
});

export const createKnowledgeDocSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  filename: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[\w.\- ]+\.md$/i, "Filename must end with .md")
    .optional(),
  content: z.string().min(1, "Markdown content is required"),
});

export const updateKnowledgeDocSchema = z.object({
  documentId: z.uuid("Invalid document ID format"),
  title: z.string().min(1).max(255).optional(),
  filename: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[\w.\- ]+\.md$/i, "Filename must end with .md")
    .optional(),
  content: z.string().min(1).optional(),
});

export const deleteKnowledgeDocSchema = z.object({
  documentId: z.uuid("Invalid document ID format"),
});

export const reindexKnowledgeDocSchema = z.object({
  documentId: z.uuid("Invalid document ID format").optional(),
});

export type IGetAllKnowledgeDocsInput = z.infer<typeof getAllKnowledgeDocsSchema>;
export type IGetOneKnowledgeDocInput = z.infer<typeof getOneKnowledgeDocSchema>;
export type ICreateKnowledgeDocInput = z.infer<typeof createKnowledgeDocSchema>;
export type IUpdateKnowledgeDocInput = z.infer<typeof updateKnowledgeDocSchema>;
export type IDeleteKnowledgeDocInput = z.infer<typeof deleteKnowledgeDocSchema>;
export type IReindexKnowledgeDocInput = z.infer<typeof reindexKnowledgeDocSchema>;
