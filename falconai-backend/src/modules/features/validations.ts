import { z } from "zod";

export const getAllFeaturesSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export const getOneFeatureSchema = z.object({
  featureId: z.uuid("Invalid feature ID format"),
});

export const createFeatureSchema = z.object({
  name: z.string().min(1, "Feature name is required").max(255, "Feature name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  isActive: z.boolean().optional().default(true),
});

export const updateFeatureSchema = z.object({
  featureId: z.uuid("Invalid feature ID format"),
  name: z.string().min(1, "Feature name is required").max(255, "Feature name too long").optional(),
  description: z.string().min(1, "Description is required").max(500, "Description too long").optional(),
  isActive: z.boolean().optional(),
});

export const deleteFeatureSchema = z.object({
  featureId: z.uuid("Invalid feature ID format"),
});

export type IGetAllFeaturesInput = z.infer<typeof getAllFeaturesSchema>;
export type IGetOneFeatureInput = z.infer<typeof getOneFeatureSchema>;
export type ICreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type IUpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
export type IDeleteFeatureInput = z.infer<typeof deleteFeatureSchema>;
