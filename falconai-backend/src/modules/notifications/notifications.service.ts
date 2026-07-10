import { db } from "@app/config/db";
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { notifications } from "@app/schema/tables";
import { ICreateNotificationInput, IGetAllNotificationsInput, IGetCountsInput } from "./validations";

const getAll = async (userId: string, filters: IGetAllNotificationsInput) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, type, status } = filters;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [eq(notifications.userId, userId), eq(notifications.isDeleted, false)];

    if (startDate) {
      conditions.push(gte(notifications.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(notifications.createdAt, new Date(endDate)));
    }
    if (type) {
      conditions.push(eq(notifications.type, type as any));
    }
    if (status) {
      conditions.push(eq(notifications.status, status as any));
    }

    const whereClause = and(...conditions);

    const [rows, totalCountResult] = await Promise.all([
      db.select().from(notifications).where(whereClause).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(whereClause),
    ]);

    const total = totalCountResult[0]?.count || 0;

    return {
      notifications: rows,
      pagination: {
        total,
        count: rows.length,
        page,
        limit,
      },
    };
  } catch (error) {
    logger.error(`Error in notifications.getAll: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getOne = async (userId: string, id: string) => {
  try {
    const [row] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId), eq(notifications.isDeleted, false)));
    if (!row) return { error: statusCodes.NotFound };
    return { notification: row };
  } catch (error) {
    logger.error(`Error in notifications.getOne: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const create = async (input: ICreateNotificationInput & { userId: string }) => {
  try {
    const [row] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? {},
      })
      .returning();

    return { notification: row };
  } catch (error) {
    logger.error(`Error in notifications.create: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const markAllRead = async (userId: string, notificationId?: string) => {
  try {
    // If notificationId is provided, mark only that notification as read
    if (notificationId) {
      const [row] = await db
        .update(notifications)
        .set({ status: "read" as any, readAt: new Date(), updatedAt: new Date() })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId), eq(notifications.isDeleted, false)))
        .returning();

      if (!row) return { error: statusCodes.NotFound };
      return { notification: row };
    }

    // Otherwise, mark all unread notifications as read
    await db
      .update(notifications)
      .set({ status: "read" as any, readAt: new Date(), updatedAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.status, "un-read" as any), eq(notifications.isDeleted, false)));
    return {};
  } catch (error) {
    logger.error(`Error in notifications.markAllRead: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updateStatus = async (userId: string, id: string, status: "read" | "un-read" | "archived") => {
  try {
    const updateData: any = {
      status: status as any,
      updatedAt: new Date(),
    };

    // Set readAt when marking as read, clear it when marking as un-read
    if (status === "read") {
      updateData.readAt = new Date();
    } else if (status === "un-read") {
      updateData.readAt = null;
    }

    const [row] = await db
      .update(notifications)
      .set(updateData)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId), eq(notifications.isDeleted, false)))
      .returning();

    if (!row) return { error: statusCodes.NotFound };
    return { notification: row };
  } catch (error) {
    logger.error(`Error in notifications.updateStatus: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const deleteOne = async (userId: string, id: string) => {
  try {
    const [row] = await db
      .update(notifications)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId), eq(notifications.isDeleted, false)))
      .returning();

    if (!row) return { error: statusCodes.NotFound };
    return {};
  } catch (error) {
    logger.error(`Error in notifications.deleteOne: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getCounts = async (userId: string, filters: IGetCountsInput) => {
  try {
    const { startDate, endDate, type, status } = filters;

    // Build base WHERE conditions
    const baseConditions = [eq(notifications.userId, userId), eq(notifications.isDeleted, false)];

    if (startDate) {
      baseConditions.push(gte(notifications.createdAt, new Date(startDate)));
    }
    if (endDate) {
      baseConditions.push(lte(notifications.createdAt, new Date(endDate)));
    }
    if (type) {
      baseConditions.push(eq(notifications.type, type as any));
    }
    if (status) {
      baseConditions.push(eq(notifications.status, status as any));
    }

    const baseWhereClause = and(...baseConditions);

    // Get all counts in parallel
    const [totalResult, byStatusResult, byTypeResult] = await Promise.all([
      // Total count
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(baseWhereClause),
      // Count by status
      db
        .select({
          status: notifications.status,
          count: sql<number>`count(*)::int`,
        })
        .from(notifications)
        .where(baseWhereClause)
        .groupBy(notifications.status),
      // Count by type
      db
        .select({
          type: notifications.type,
          count: sql<number>`count(*)::int`,
        })
        .from(notifications)
        .where(baseWhereClause)
        .groupBy(notifications.type),
    ]);

    const totalCount = totalResult[0]?.count || 0;

    // Transform status counts to object
    const byStatus: Record<string, number> = {};
    byStatusResult.forEach((item) => {
      byStatus[item.status] = item.count;
    });

    // Transform type counts to object
    const byType: Record<string, number> = {};
    byTypeResult.forEach((item) => {
      byType[item.type] = item.count;
    });

    return {
      total: totalCount,
      byStatus,
      byType,
    };
  } catch (error) {
    logger.error(`Error in notifications.getCounts: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const notificationsService = {
  getAll,
  getOne,
  create,
  markAllRead,
  updateStatus,
  deleteOne,
  getCounts,
};
