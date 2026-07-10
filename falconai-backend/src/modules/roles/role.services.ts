import logger from "@app/services/logging/logger";
import statusCodes from "@app/constants/statusCodes";
import { db } from "@app/config/db";
import { roles, permissions, role_features, role_feature_permissions, users, features } from "@app/schema/tables";
import { eq, and, ne, sql } from "drizzle-orm";
import { INewRole, INewRoleFeature, INewRoleFeaturePermission, IUserWithRole } from "@app/schema/types";

const canModifyRole = async (user: IUserWithRole, roleId: string) => {
  const [targetRole] = await db.select().from(roles).where(eq(roles.id, roleId));
  if (!targetRole) return { allowed: false, error: statusCodes.RoleNotFound };

  const userRoleName = user?.role?.name;
  const targetRoleName = targetRole.name;

  // 1. Super-admin role cannot be modified by anyone
  if (targetRoleName === "super-admin") {
    return { allowed: false, error: statusCodes.PermissionDenied };
  }

  // 2. Admin role can only be modified by super-admin
  if (targetRoleName === "admin" && userRoleName !== "super-admin") {
    return { allowed: false, error: statusCodes.PermissionDenied };
  }

  // 3. User cannot modify their own role
  if (user?.roleId === roleId) {
    return { allowed: false, error: statusCodes.PermissionDenied };
  }

  return { allowed: true };
};

const getAllRoles = async (page: number = 1, limit: number = 10, includeSudo: boolean = false, includeAdmin: boolean = false) => {
  try {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!includeSudo) {
      conditions.push(ne(roles.name, "super-admin"));
    }
    if (!includeAdmin) {
      conditions.push(ne(roles.name, "admin"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allRoles = await db.query.roles.findMany({
      limit,
      offset,
      where: whereClause,
      with: {
        roleFeatures: {
          with: {
            feature: true,
            roleFeaturePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(roles)
      .where(whereClause);
    const count = allRoles.length;

    return {
      roles: allRoles,
      pagination: {
        total,
        count,
        page,
        limit,
      },
    };
  } catch (error) {
    logger.error(`Error in getAllRoles: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getOneRole = async (roleId: string) => {
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      with: {
        roleFeatures: {
          with: {
            feature: true,
            roleFeaturePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!role) return { error: statusCodes.RoleNotFound };

    return { role };
  } catch (error) {
    logger.error(`Error in getOneRole: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const createRole = async (name: string, description: string) => {
  try {
    // Check if role with same name already exists
    const existing = await db.select().from(roles).where(eq(roles.name, name));
    if (existing.length > 0) return { error: statusCodes.RoleExists };

    const newRole: INewRole = {
      name,
      description,
    };

    const [role] = await db.insert(roles).values(newRole).returning();

    // Get profile feature
    const [profileFeature] = await db.select().from(features).where(eq(features.name, "profile"));

    if (profileFeature) {
      // Add profile feature to the new role
      const [roleFeature] = await db
        .insert(role_features)
        .values({
          roleId: role.id,
          featureId: profileFeature.id,
        })
        .returning();

      // Get all permissions excluding sudo using existing service
      const permissionsResult = await getAllPermissions(1, 1000, false);

      // Add all non-sudo permissions to the profile feature for this role
      if (!permissionsResult.error && permissionsResult.permissions && permissionsResult.permissions.length > 0) {
        const roleFeaturePermissionsToInsert: INewRoleFeaturePermission[] = permissionsResult.permissions.map((permission) => ({
          roleFeatureId: roleFeature.id,
          permissionId: permission.id,
        }));

        await db.insert(role_feature_permissions).values(roleFeaturePermissionsToInsert);
      }
    }

    return { role };
  } catch (error) {
    logger.error(`Error in createRole: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const deleteRole = async (user: IUserWithRole, roleId: string) => {
  try {
    // Check if user can modify this role
    const { allowed, error } = await canModifyRole(user, roleId);
    if (!allowed) return { error };

    // Check if role is assigned to any user
    const usersWithRole = await db.select().from(users).where(eq(users.roleId, roleId));
    if (usersWithRole.length > 0) return { error: statusCodes.RoleAssignedToUsers };

    await db.delete(roles).where(eq(roles.id, roleId));

    return { success: true };
  } catch (error) {
    logger.error(`Error in deleteRole: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const addFeaturesToRole = async (user: IUserWithRole, roleId: string, featureIds: string[]) => {
  try {
    // Check if user can modify this role
    const { allowed, error } = await canModifyRole(user, roleId);
    if (!allowed) return { error };

    // Insert role-feature associations (skip duplicates)
    const roleFeaturesToInsert: INewRoleFeature[] = featureIds.map((featureId) => ({
      roleId,
      featureId,
    }));

    await db.insert(role_features).values(roleFeaturesToInsert).onConflictDoNothing();

    return { success: true };
  } catch (error) {
    logger.error(`Error in addFeaturesToRole: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const removeFeaturesFromRole = async (user: IUserWithRole, roleId: string, featureIds: string[]) => {
  try {
    // Check if user can modify this role
    const { allowed, error } = await canModifyRole(user, roleId);
    if (!allowed) return { error };

    // Delete role-feature associations
    for (const featureId of featureIds) {
      await db.delete(role_features).where(and(eq(role_features.roleId, roleId), eq(role_features.featureId, featureId)));
    }

    return { success: true };
  } catch (error) {
    logger.error(`Error in removeFeaturesFromRole: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const addPermissionsToFeatureRole = async (user: IUserWithRole, roleId: string, featureId: string, permissionIds: string[]) => {
  try {
    // Check if user can modify this role
    const { allowed, error } = await canModifyRole(user, roleId);
    if (!allowed) return { error };

    // Check if role-feature association exists
    const roleFeature = await db
      .select()
      .from(role_features)
      .where(and(eq(role_features.roleId, roleId), eq(role_features.featureId, featureId)));

    if (roleFeature.length === 0) return { error: statusCodes.RoleFeatureNotFound };

    const roleFeatureId = roleFeature[0].id;

    // Insert role-feature-permission associations (skip duplicates)
    const roleFeaturePermissionsToInsert: INewRoleFeaturePermission[] = permissionIds.map((permissionId) => ({
      roleFeatureId,
      permissionId,
    }));

    await db.insert(role_feature_permissions).values(roleFeaturePermissionsToInsert).onConflictDoNothing();

    return { success: true };
  } catch (error) {
    logger.error(`Error in addPermissionsToFeatureRole: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const removePermissionsFromFeatureRole = async (user: IUserWithRole, roleId: string, featureId: string, permissionIds: string[]) => {
  try {
    // Check if user can modify this role
    const { allowed, error } = await canModifyRole(user, roleId);
    if (!allowed) return { error };

    // Check if role-feature association exists
    const roleFeature = await db
      .select()
      .from(role_features)
      .where(and(eq(role_features.roleId, roleId), eq(role_features.featureId, featureId)));

    if (roleFeature.length === 0) return { error: statusCodes.RoleFeatureNotFound };

    const roleFeatureId = roleFeature[0].id;

    // Delete role-feature-permission associations
    for (const permissionId of permissionIds) {
      await db.delete(role_feature_permissions).where(and(eq(role_feature_permissions.roleFeatureId, roleFeatureId), eq(role_feature_permissions.permissionId, permissionId)));
    }

    return { success: true };
  } catch (error) {
    logger.error(`Error in removePermissionsFromFeatureRole: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getAllPermissions = async (page: number = 1, limit: number = 10, includeSudo: boolean = false) => {
  try {
    const offset = (page - 1) * limit;

    const baseQuery = db.select().from(permissions);

    const filteredQuery = includeSudo ? baseQuery : baseQuery.where(ne(permissions.name, "sudo"));

    const allPermissions = await filteredQuery.limit(limit).offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(permissions)
      .where(includeSudo ? undefined : ne(permissions.name, "sudo"));

    return {
      permissions: allPermissions,
      pagination: {
        total: count,
        count: allPermissions.length,
        page,
        limit,
      },
    };
  } catch (error) {
    logger.error(`Error in getAllPermissions: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getRoleByName = async (roleName: string) => {
  try {
    const role = await db.query.roles.findFirst({
      where: eq(roles.name, roleName),
      with: {
        roleFeatures: {
          with: {
            feature: true,
            roleFeaturePermissions: {
              with: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!role) return { error: statusCodes.RoleNotFound };

    return { role };
  } catch (error) {
    logger.error(`Error in getRoleByName: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const roleServices = {
  getAllRoles,
  getOneRole,
  createRole,
  deleteRole,
  addFeaturesToRole,
  removeFeaturesFromRole,
  addPermissionsToFeatureRole,
  removePermissionsFromFeatureRole,
  getAllPermissions,
  getRoleByName,
};
