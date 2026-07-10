import { db } from "@app/config/db";
import statusCodes from "@app/constants/statusCodes";
import { roles, users, acls, notifications } from "@app/schema/tables";
import logger from "@app/services/logging/logger";
import { and, eq, ilike, or, sql, ne, gte, lte, desc } from "drizzle-orm";
import { IUpdateUserInput, IGetAllUsersInput, IGetUserCountsInput } from "./validations";
import { IUser } from "@app/schema/types";

const getAllUsers = async (filters: IGetAllUsersInput) => {
  try {
    const { page = 1, limit = 10, search, roleId, startDate, endDate, sortBy = "createdAt", sortOrder = "desc" } = filters;
    const offset = (page - 1) * limit;
    const conditions = [];

    // Get super-admin role to filter it out
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super-admin"));
    if (superAdminRole) {
      // Always exclude super-admin users
      conditions.push(ne(users.roleId, superAdminRole.id));
    }

    if (roleId) {
      conditions.push(eq(users.roleId, roleId));
    }

    if (search) {
      conditions.push(or(ilike(users.fullName, `%${search}%`), ilike(users.email, `%${search}%`)));
    }

    if (startDate) {
      conditions.push(gte(users.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(users.createdAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and order
    const sortColumn = sortBy === "name" ? users.fullName : users.createdAt;
    const orderFn = sortOrder === "asc" ? sql`${sortColumn} ASC` : sql`${sortColumn} DESC`;

    const [allUsers, totalCountResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          location: users.location,
          avatarUrl: users.avatarUrl,
          emailVerified: users.emailVerified,
          phoneVerified: users.phoneVerified,
          phone: users.phone,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
          country: users.country,
          timeZone: users.timeZone,
          status: users.status,
          profileComplete: users.profileComplete,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          role: {
            id: roles.id,
            name: roles.name,
            description: roles.description,
          },
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(orderFn),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause),
    ]);

    const total = totalCountResult[0]?.count || 0;

    return {
      users: allUsers,
      pagination: {
        total,
        count: allUsers.length,
        page,
        limit,
      },
    };
  } catch (error) {
    logger.error(`Error in getAllUsers: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getOneUser = async (userId: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        role: {
          columns: {
            id: true,
            name: true,
            description: true,
          },
        },
        notifications: {
          orderBy: desc(sql`created_at`),
        },
      },
    });

    if (!user) return { error: statusCodes.UserNotFound };

    // Check if user is super-admin and deny access
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super-admin"));
    if (superAdminRole && user.role?.id === superAdminRole.id) {
      return { error: statusCodes.UserNotFound };
    }

    // Remove sensitive fields
    const { password, ...userWithoutSensitiveData } = user;

    return { user: userWithoutSensitiveData };
  } catch (error) {
    logger.error(`Error in getOneUser: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updateUser = async (userId: string, updateData: Omit<IUpdateUserInput, "userId">) => {
  try {
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser) return { error: statusCodes.UserNotFound };

    // Check if user is super-admin (cannot update super-admin users)
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super-admin"));
    if (superAdminRole && existingUser.roleId === superAdminRole.id) {
      return { error: statusCodes.PermissionDenied };
    }

    const updatePayload: any = { ...updateData, updatedAt: new Date() };
    const [updatedUser] = await db.update(users).set(updatePayload).where(eq(users.id, userId)).returning();

    return { user: updatedUser };
  } catch (error) {
    logger.error(`Error in updateUser: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const deleteUser = async (userId: string) => {
  try {
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser) return { error: statusCodes.UserNotFound };

    // Check if user is super-admin (cannot delete super-admin users)
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super-admin"));
    if (superAdminRole && existingUser.roleId === superAdminRole.id) {
      return { error: statusCodes.PermissionDenied };
    }

    // Delete all user-related data in the correct order to handle foreign key constraints and cascade deletes
    // This effectively performs a cascading soft-delete by removing all direct and indirect references
    logger.info(`Starting cascade deletion for user ${userId}`);

    // 1. Delete ACLs (tokens/sessions)
    await db.delete(acls).where(eq(acls.userId, userId));

    // 2. Delete notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // 3. Delete the user itself
    await db.delete(users).where(eq(users.id, userId));
    logger.info(`User ${userId} deleted successfully along with all related data`);

    return {};
  } catch (error) {
    logger.error(`Error in deleteUser: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const assignRole = async (requestingUser: IUser, toUserId: string, roleId?: string, roleName?: string) => {
  try {
    if (!roleId && !roleName) {
      return { error: statusCodes.BadRequest };
    }

    // 1. Check if requesting user is trying to change their own role
    if (requestingUser.id === toUserId) {
      return { error: statusCodes.PermissionDenied };
    }

    // 2. Check if target user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, toUserId));
    if (!existingUser) return { error: statusCodes.UserNotFound };

    // 3. Get super-admin role
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super-admin"));

    // 4. Check if target user is a super-admin (cannot change super-admin's role)
    if (superAdminRole && existingUser.roleId === superAdminRole.id) {
      return { error: statusCodes.PermissionDenied };
    }

    // 5. Find the role to assign
    let role;
    if (roleId) {
      const roleResult = await db.select().from(roles).where(eq(roles.id, roleId));
      if (roleResult.length === 0) return { error: statusCodes.RoleNotFound };
      role = roleResult[0];
    } else if (roleName) {
      const roleResult = await db.select().from(roles).where(eq(roles.name, roleName));
      if (roleResult.length === 0) return { error: statusCodes.RoleNotFound };
      role = roleResult[0];
    }

    // 6. Check if trying to assign super-admin role (not allowed)
    if (superAdminRole && role!.id === superAdminRole.id) {
      return { error: statusCodes.PermissionDenied };
    }

    // 7. Update the user's role
    const [updatedUser] = await db.update(users).set({ roleId: role!.id, updatedAt: new Date() }).where(eq(users.id, toUserId)).returning();

    return { user: updatedUser, role };
  } catch (error) {
    logger.error(`Error in assignRole: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getUserCounts = async (filters: IGetUserCountsInput) => {
  try {
    const { search, roleId, startDate, endDate } = filters;

    // Get super-admin role to filter it out
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super-admin"));

    // Build conditions for params-based counts
    const paramsConditions = [];
    if (superAdminRole) {
      paramsConditions.push(ne(users.roleId, superAdminRole.id));
    }
    if (roleId) {
      paramsConditions.push(eq(users.roleId, roleId));
    }
    if (search) {
      paramsConditions.push(or(ilike(users.fullName, `%${search}%`), ilike(users.email, `%${search}%`)));
    }
    if (startDate) {
      paramsConditions.push(gte(users.createdAt, startDate));
    }
    if (endDate) {
      paramsConditions.push(lte(users.createdAt, endDate));
    }

    const paramsWhereClause = paramsConditions.length > 0 ? and(...paramsConditions) : undefined;

    // Total conditions (only exclude super-admin)
    const totalConditions = superAdminRole ? [ne(users.roleId, superAdminRole.id)] : [];
    const totalWhereClause = totalConditions.length > 0 ? and(...totalConditions) : undefined;

    // Get total counts (without params filters)
    const [totalCounts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        verified: sql<number>`count(*) filter (where ${users.emailVerified} = true)::int`,
        unverified: sql<number>`count(*) filter (where ${users.emailVerified} = false)::int`,
      })
      .from(users)
      .where(totalWhereClause);

    // Get params-based counts
    const [paramsCounts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        verified: sql<number>`count(*) filter (where ${users.emailVerified} = true)::int`,
        unverified: sql<number>`count(*) filter (where ${users.emailVerified} = false)::int`,
      })
      .from(users)
      .where(paramsWhereClause);

    return {
      totalCount: {
        total: totalCounts?.total || 0,
        verified: totalCounts?.verified || 0,
        unverified: totalCounts?.unverified || 0,
      },
      paramsCount: {
        total: paramsCounts?.total || 0,
        verified: paramsCounts?.verified || 0,
        unverified: paramsCounts?.unverified || 0,
      },
    };
  } catch (error) {
    logger.error(`Error in getUserCounts: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const userService = {
  getAllUsers,
  getUserCounts,
  getOneUser,
  updateUser,
  deleteUser,
  assignRole,
};
