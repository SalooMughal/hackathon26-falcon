import logger from "@app/services/logging/logger";
import statusCodes from "@app/constants/statusCodes";
import { db } from "@app/config/db";
import { features, role_features } from "@app/schema/tables";
import { eq, sql } from "drizzle-orm";
import { INewFeature } from "@app/schema/types";

const getAllFeatures = async (page: number = 1, limit: number = 10) => {
  try {
    const offset = (page - 1) * limit;

    const allFeatures = await db.query.features.findMany({
      limit,
      offset,
      with: {
        roleFeatures: {
          with: {
            role: true,
            roleFeaturePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const [{ count: total }] = await db.select({ count: sql<number>`count(*)` }).from(features);
    const count = allFeatures.length;

    return {
      features: allFeatures,
      pagination: {
        total,
        count,
        page,
        limit,
      },
    };
  } catch (error) {
    logger.error(`Error in getAllFeatures: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getOneFeature = async (featureId: string) => {
  try {
    const feature = await db.query.features.findFirst({
      where: eq(features.id, featureId),
      with: {
        roleFeatures: {
          with: {
            role: true,
            roleFeaturePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!feature) return { error: statusCodes.FeatureNotFound };

    return { feature };
  } catch (error) {
    logger.error(`Error in getOneFeature: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const createFeature = async (name: string, description: string, isActive: boolean = true) => {
  try {
    // Check if feature with same name already exists
    const existing = await db.select().from(features).where(eq(features.name, name));
    if (existing.length > 0) return { error: statusCodes.Conflict };

    const newFeature: INewFeature = {
      name,
      description,
      isActive,
    };

    const [feature] = await db.insert(features).values(newFeature).returning();

    return { feature };
  } catch (error) {
    logger.error(`Error in createFeature: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updateFeature = async (featureId: string, name?: string, description?: string, isActive?: boolean) => {
  try {
    // Check if feature exists
    const existing = await db.select().from(features).where(eq(features.id, featureId));
    if (existing.length === 0) return { error: statusCodes.FeatureNotFound };

    // Check if name is being updated and if it already exists
    if (name && name !== existing[0].name) {
      const nameExists = await db.select().from(features).where(eq(features.name, name));
      if (nameExists.length > 0) return { error: statusCodes.Conflict };
    }

    const updateData: Partial<INewFeature> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [feature] = await db.update(features).set(updateData).where(eq(features.id, featureId)).returning();

    return { feature };
  } catch (error) {
    logger.error(`Error in updateFeature: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const deleteFeature = async (featureId: string) => {
  try {
    // Check if feature exists
    const existing = await db.select().from(features).where(eq(features.id, featureId));
    if (existing.length === 0) return { error: statusCodes.FeatureNotFound };

    // Check if feature is assigned to any roles
    const assignedRoles = await db.select().from(role_features).where(eq(role_features.featureId, featureId));
    if (assignedRoles.length > 0) return { error: statusCodes.FeatureAssignedToRoles };

    await db.delete(features).where(eq(features.id, featureId));

    return { success: true };
  } catch (error) {
    logger.error(`Error in deleteFeature: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getFeatureByName = async (featureName: string) => {
  try {
    const feature = await db.query.features.findFirst({
      where: eq(features.name, featureName),
      with: {
        roleFeatures: {
          with: {
            role: true,
            roleFeaturePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!feature) return { error: statusCodes.FeatureNotFound };

    return { feature };
  } catch (error) {
    logger.error(`Error in getFeatureByName: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const featureServices = {
  getAllFeatures,
  getOneFeature,
  createFeature,
  updateFeature,
  deleteFeature,
  getFeatureByName,
};
