import { db } from "@app/config/db";
import statusCodes from "@app/constants/statusCodes";
import { acls, users, roles } from "@app/schema/tables";
import { INewACL } from "@app/schema/types";
import logger from "@app/services/logging/logger";
import { and, between, desc, eq, gte, ilike, inArray, lt, lte, ne, or, sql } from "drizzle-orm";
import { methods } from "@app/utils/methods";

const addTokensSession = async (accessToken: string, refreshToken: string, userId: string) => {
  try {
    const newSession: INewACL = {
      type: "tokens",
      accessToken,
      refreshToken,
      userId,
      isValid: true,
    };
    const [insertedSession] = await db.insert(acls).values(newSession).returning();
    return insertedSession;
  } catch (error) {
    logger.error(`Error in addTokensSession: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const validateSession = async (accessToken?: string, refreshToken?: string) => {
  try {
    const session = await db.query.acls.findFirst({
      where: accessToken ? eq(acls.accessToken, accessToken) : eq(acls.refreshToken, refreshToken!),
    });
    if (!session) {
      return { error: statusCodes.TokenAuthenticationFailed };
    }
    if (!session.isValid) {
      return { error: statusCodes.TokenAuthenticationFailed };
    }
    return { session };
  } catch (error: any) {
    logger.error(`Error in validateSession: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const invalidateSession = async (accessToken?: string, refreshToken?: string) => {
  try {
    const [session] = await db
      .update(acls)
      .set({
        isValid: false,
        updatedAt: new Date(),
      })
      .where(accessToken ? eq(acls.accessToken, accessToken) : eq(acls.refreshToken, refreshToken!))
      .returning();

    if (!session) {
      return { error: statusCodes.TokenAuthenticationFailed };
    }

    return { session };
  } catch (error: any) {
    logger.error(`Error in invalidateSession: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

// Admin: Get all sessions with optional filters
const adminGetAllSessions = async (page: number = 1, limit: number = 10, startDate?: Date, endDate?: Date, isValid?: boolean, search?: string, currentAccessToken?: string) => {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];

    // Get super-admin role ID to filter out their sessions at DB level
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super-admin"));

    // Exclude super-admin users' sessions
    if (superAdminRole) {
      conditions.push(ne(users.roleId, superAdminRole.id));
    }

    // Exclude current user's session (if provided)
    if (currentAccessToken) {
      conditions.push(ne(acls.accessToken, currentAccessToken));
    }

    // Date range filter
    if (startDate) {
      conditions.push(gte(acls.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(acls.createdAt, endDate));
    }

    // isValid filter (optional - if not provided, return all)
    if (isValid !== undefined) {
      conditions.push(eq(acls.isValid, isValid));
    }

    // Search filter (userId/sessionId/accessToken/refreshToken)
    if (search) {
      conditions.push(or(eq(acls.userId, search), eq(acls.id, search), ilike(acls.accessToken, `%${search}%`), ilike(acls.refreshToken, `%${search}%`)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [sessions, totalCountResult] = await Promise.all([
      db
        .select({
          id: acls.id,
          type: acls.type,
          isValid: acls.isValid,
          accessToken: acls.accessToken,
          refreshToken: acls.refreshToken,
          createdAt: acls.createdAt,
          updatedAt: acls.updatedAt,
          user: {
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(acls)
        .leftJoin(users, eq(acls.userId, users.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(acls.createdAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(acls)
        .leftJoin(users, eq(acls.userId, users.id))
        .where(whereClause),
    ]);

    const total = totalCountResult[0]?.count || 0;

    return {
      sessions,
      pagination: {
        total,
        count: sessions.length,
        page,
        limit,
      },
    };
  } catch (error: any) {
    logger.error(`Error in adminGetAllSessions: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

// Admin: Invalidate multiple sessions by IDs
const adminInvalidateSessions = async (sessionIds: string[]) => {
  try {
    const result = await db
      .update(acls)
      .set({
        isValid: false,
        updatedAt: new Date(),
      })
      .where(inArray(acls.id, sessionIds))
      .returning();

    return { invalidatedCount: result.length, sessions: result };
  } catch (error: any) {
    logger.error(`Error in adminInvalidateSessions: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const invalidateAllUserSessions = async (userId: string) => {
  try {
    const result = await db
      .update(acls)
      .set({
        isValid: false,
        updatedAt: new Date(),
      })
      .where(and(eq(acls.userId, userId), eq(acls.isValid, true)))
      .returning();

    return { invalidatedCount: result.length };
  } catch (error: any) {
    logger.error(`Error in invalidateAllUserSessions: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

// Admin: Invalidate all sessions except the current one
const adminInvalidateAllSessions = async (currentAccessToken: string) => {
  try {
    const result = await db
      .update(acls)
      .set({
        isValid: false,
        updatedAt: new Date(),
      })
      .where(and(ne(acls.accessToken, currentAccessToken), eq(acls.isValid, true)))
      .returning();

    return { invalidatedCount: result.length };
  } catch (error: any) {
    logger.error(`Error in adminInvalidateAllSessions: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

// Admin: Invalidate expired sessions
const invalidateExpiredSessions = async () => {
  try {
    // Get all valid sessions
    const validSessions = await db.select().from(acls).where(eq(acls.isValid, true));

    if (validSessions.length === 0) {
      return { invalidatedCount: 0 };
    }

    // Check each session's access token and collect expired session IDs
    const expiredSessionIds: string[] = [];

    for (const session of validSessions) {
      if (session?.accessToken) {
        // Verify the access token - if it fails (expired), mark for invalidation
        const { valid } = methods.verifyToken(session.accessToken, "access");
        if (!valid) {
          expiredSessionIds.push(session.id);
        }
      }
    }

    // Batch update all expired sessions
    if (expiredSessionIds.length > 0) {
      await db
        .update(acls)
        .set({
          isValid: false,
          updatedAt: new Date(),
        })
        .where(inArray(acls.id, expiredSessionIds));

      logger.info(`Invalidated ${expiredSessionIds.length} expired sessions`);
    }

    return { invalidatedCount: expiredSessionIds.length };
  } catch (error: any) {
    logger.error(`Error in invalidateExpiredSessions: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

// Admin: Get session statistics
const adminGetStats = async (startDate?: Date, endDate?: Date) => {
  try {
    // First, invalidate all expired sessions
    await invalidateExpiredSessions();

    const conditions = [];

    // Get super-admin role ID to filter out their sessions
    const [superAdminRole] = await db.select().from(roles).where(eq(roles.name, "super-admin"));

    // Exclude super-admin users' sessions
    if (superAdminRole) {
      conditions.push(ne(users.roleId, superAdminRole.id));
    }

    if (startDate) {
      conditions.push(gte(acls.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(acls.createdAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalSessions, activeSessions, inactiveSessions] = await Promise.all([
      // Total sessions
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(acls)
        .leftJoin(users, eq(acls.userId, users.id))
        .where(whereClause),

      // Active sessions
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(acls)
        .leftJoin(users, eq(acls.userId, users.id))
        .where(whereClause ? and(whereClause, eq(acls.isValid, true)) : eq(acls.isValid, true)),

      // Inactive sessions
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(acls)
        .leftJoin(users, eq(acls.userId, users.id))
        .where(whereClause ? and(whereClause, eq(acls.isValid, false)) : eq(acls.isValid, false)),
    ]);

    return {
      stats: {
        total: totalSessions[0]?.count || 0,
        active: activeSessions[0]?.count || 0,
        inactive: inactiveSessions[0]?.count || 0,
      },
    };
  } catch (error: any) {
    logger.error(`Error in adminGetStats: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const cleanupExpiredSessions = async () => {
  try {
    // Remove sessions older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.delete(acls).where(lt(acls.createdAt, thirtyDaysAgo)).returning();

    logger.info(`Cleaned up ${result.length} expired sessions`);
    return { deletedCount: result.length };
  } catch (error: any) {
    logger.error(`Error in cleanupExpiredSessions: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

export const sessionsService = {
  // Used by other modules (auth, etc.)
  addTokensSession,
  validateSession,
  invalidateSession,
  invalidateAllUserSessions,
  cleanupExpiredSessions,
  // Admin functions
  adminGetAllSessions,
  adminInvalidateSessions,
  adminInvalidateAllSessions,
  invalidateExpiredSessions,
  adminGetStats,
};
