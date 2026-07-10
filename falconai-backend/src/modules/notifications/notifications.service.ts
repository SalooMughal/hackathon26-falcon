import { db } from "@app/config/db";
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { notifications, users } from "@app/schema/tables";
import {
  ICreateNotificationInput,
  IGetAllNotificationsInput,
  IGetCountsInput,
  ISudoCreateNotificationInput,
  IUpdateNoticeInput,
} from "./validations";
import { randomUUID } from "crypto";

const getAll = async (userId: string, filters: IGetAllNotificationsInput) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, type, status, search } = filters;
    const offset = (page - 1) * limit;

    const conditions = [eq(notifications.userId, userId), eq(notifications.isDeleted, false)];

    if (startDate) {
      conditions.push(gte(notifications.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(notifications.createdAt, new Date(endDate)));
    }
    if (type) {
      conditions.push(eq(notifications.type, type));
    }
    if (status) {
      conditions.push(eq(notifications.status, status));
    }
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(or(ilike(notifications.title, q), ilike(notifications.message, q))!);
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

/** Post a noticeboard item to every user. */
const createBroadcast = async (
  author: { id: string; fullName: string },
  input: ICreateNotificationInput,
) => {
  try {
    const broadcastId = randomUUID();
    const allUsers = await db.select({ id: users.id }).from(users);

    if (allUsers.length === 0) {
      return { error: statusCodes.BadRequest };
    }

    const payload = allUsers.map((u) => ({
      userId: u.id,
      type: input.type ?? "info",
      title: input.title.trim(),
      message: input.message.trim(),
      data: {
        broadcastId,
        authorId: author.id,
        authorName: author.fullName,
        board: true,
      },
    }));

    const inserted = await db.insert(notifications).values(payload).returning();
    const mine = inserted.find((n) => n.userId === author.id) || inserted[0];

    return {
      notification: mine,
      broadcastId,
      recipients: inserted.length,
    };
  } catch (error) {
    logger.error(`Error in notifications.createBroadcast: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const createForUser = async (input: ISudoCreateNotificationInput) => {
  try {
    const [row] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type ?? "info",
        title: input.title.trim(),
        message: input.message.trim(),
        data: input.data ?? {},
      })
      .returning();

    return { notification: row };
  } catch (error) {
    logger.error(`Error in notifications.createForUser: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updateBroadcast = async (input: IUpdateNoticeInput) => {
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.message !== undefined) updateData.message = input.message.trim();
    if (input.type !== undefined) updateData.type = input.type;

    const updated = await db
      .update(notifications)
      .set(updateData)
      .where(
        and(
          eq(notifications.isDeleted, false),
          sql`${notifications.data}->>'broadcastId' = ${input.broadcastId}`,
        ),
      )
      .returning();

    if (updated.length === 0) return { error: statusCodes.NotFound };
    return { updated: updated.length, notification: updated[0] };
  } catch (error) {
    logger.error(`Error in notifications.updateBroadcast: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const markAllRead = async (userId: string, notificationId?: string) => {
  try {
    if (notificationId) {
      const [row] = await db
        .update(notifications)
        .set({ status: "read", readAt: new Date(), updatedAt: new Date() })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId), eq(notifications.isDeleted, false)))
        .returning();

      if (!row) return { error: statusCodes.NotFound };
      return { notification: row };
    }

    await db
      .update(notifications)
      .set({ status: "read", readAt: new Date(), updatedAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.status, "un-read"), eq(notifications.isDeleted, false)));
    return {};
  } catch (error) {
    logger.error(`Error in notifications.markAllRead: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updateStatus = async (userId: string, id: string, status: "read" | "un-read" | "archived") => {
  try {
    const updateData: {
      status: "read" | "un-read" | "archived";
      updatedAt: Date;
      readAt?: Date | null;
    } = {
      status,
      updatedAt: new Date(),
    };

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

/** Soft-delete one personal copy, or an entire broadcast for everyone. */
const deleteOne = async (userId: string, id?: string, broadcastId?: string, canDeleteBoard = false) => {
  try {
    if (broadcastId && canDeleteBoard) {
      const updated = await db
        .update(notifications)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(
          and(
            eq(notifications.isDeleted, false),
            sql`${notifications.data}->>'broadcastId' = ${broadcastId}`,
          ),
        )
        .returning();

      if (updated.length === 0) return { error: statusCodes.NotFound };
      return { deleted: updated.length };
    }

    if (!id) return { error: statusCodes.BadRequest };

    const [row] = await db
      .update(notifications)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId), eq(notifications.isDeleted, false)))
      .returning();

    if (!row) return { error: statusCodes.NotFound };
    return { deleted: 1 };
  } catch (error) {
    logger.error(`Error in notifications.deleteOne: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getCounts = async (userId: string, filters: IGetCountsInput) => {
  try {
    const { startDate, endDate, type, status } = filters;

    const baseConditions = [eq(notifications.userId, userId), eq(notifications.isDeleted, false)];

    if (startDate) {
      baseConditions.push(gte(notifications.createdAt, new Date(startDate)));
    }
    if (endDate) {
      baseConditions.push(lte(notifications.createdAt, new Date(endDate)));
    }
    if (type) {
      baseConditions.push(eq(notifications.type, type));
    }
    if (status) {
      baseConditions.push(eq(notifications.status, status));
    }

    const baseWhereClause = and(...baseConditions);

    const [totalResult, byStatusResult, byTypeResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(baseWhereClause),
      db
        .select({
          status: notifications.status,
          count: sql<number>`count(*)::int`,
        })
        .from(notifications)
        .where(baseWhereClause)
        .groupBy(notifications.status),
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

    const byStatus: Record<string, number> = {};
    byStatusResult.forEach((item) => {
      byStatus[item.status] = item.count;
    });

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
  createBroadcast,
  createForUser,
  updateBroadcast,
  markAllRead,
  updateStatus,
  deleteOne,
  getCounts,
};
