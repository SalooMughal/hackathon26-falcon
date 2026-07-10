import { z } from "zod";

export const getAllRolesSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
});

export const getOneRoleSchema = z.object({
  roleId: z.uuid("Invalid role ID format"),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(255, "Role name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
});

export const deleteRoleSchema = z.object({
  roleId: z.uuid("Invalid role ID format"),
});

export const addFeaturesToRoleSchema = z.object({
  roleId: z.uuid("Invalid role ID format"),
  featureIds: z.array(z.uuid("Invalid feature ID format")).min(1, "At least one feature ID is required"),
});

export const removeFeaturesFromRoleSchema = z.object({
  roleId: z.uuid("Invalid role ID format"),
  featureIds: z.array(z.uuid("Invalid feature ID format")).min(1, "At least one feature ID is required"),
});

export const addPermissionsToFeatureRoleSchema = z.object({
  roleId: z.uuid("Invalid role ID format"),
  featureId: z.uuid("Invalid feature ID format"),
  permissionIds: z.array(z.uuid("Invalid permission ID format")).min(1, "At least one permission ID is required"),
});

export const removePermissionsFromFeatureRoleSchema = z.object({
  roleId: z.uuid("Invalid role ID format"),
  featureId: z.uuid("Invalid feature ID format"),
  permissionIds: z.array(z.uuid("Invalid permission ID format")).min(1, "At least one permission ID is required"),
});

export const getAllPermissionsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
});

export type IGetAllRolesInput = z.infer<typeof getAllRolesSchema>;
export type IGetOneRoleInput = z.infer<typeof getOneRoleSchema>;
export type ICreateRoleInput = z.infer<typeof createRoleSchema>;
export type IDeleteRoleInput = z.infer<typeof deleteRoleSchema>;
export type IAddFeaturesToRoleInput = z.infer<typeof addFeaturesToRoleSchema>;
export type IRemoveFeaturesFromRoleInput = z.infer<typeof removeFeaturesFromRoleSchema>;
export type IAddPermissionsToFeatureRoleInput = z.infer<typeof addPermissionsToFeatureRoleSchema>;
export type IRemovePermissionsFromFeatureRoleInput = z.infer<typeof removePermissionsFromFeatureRoleSchema>;
export type IGetAllPermissionsInput = z.infer<typeof getAllPermissionsSchema>;
