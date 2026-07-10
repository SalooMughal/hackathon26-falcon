import { Request, Response } from "express";
import { methods } from "@app/utils/methods";
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { notificationsService } from "./notifications.service";
import {
  ICreateNotificationInput,
  IGetAllNotificationsInput,
  IGetCountsInput,
  IGetOneNotificationInput,
  IUpdateStatusInput,
  IDeleteNotificationInput,
  IMarkAllReadInput,
  ISudoCreateNotificationInput,
  IUpdateNoticeInput,
} from "./validations";

const getAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const filters = req.query as unknown as IGetAllNotificationsInput;

    const { error, notifications, pagination } = await notificationsService.getAll(userId, filters);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notifications fetched successfully", { notifications, pagination });
  } catch (error) {
    logger.error("Error in notifications.getAll:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getOne = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { id } = req.query as unknown as IGetOneNotificationInput;

    const { error, notification } = await notificationsService.getOne(userId, id);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notification fetched successfully", { notification });
  } catch (error) {
    logger.error("Error in notifications.getOne:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const create = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) return methods.sendResponse(res, statusCodes.Unauthorized);

    const input = req.body as ICreateNotificationInput;
    const { error, notification, broadcastId, recipients } = await notificationsService.createBroadcast(
      { id: user.id, fullName: user.fullName || "Admin" },
      input,
    );
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notice posted to the board", {
      notification,
      broadcastId,
      recipients,
    });
  } catch (error) {
    logger.error("Error in notifications.create:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const sudoCreate = async (req: Request, res: Response) => {
  try {
    const input = req.body as ISudoCreateNotificationInput;

    const { error, notification } = await notificationsService.createForUser(input);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notification created successfully", { notification });
  } catch (error) {
    logger.error("Error in notifications.sudoCreate:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const updateNotice = async (req: Request, res: Response) => {
  try {
    const input = req.body as IUpdateNoticeInput;
    const { error, notification, updated } = await notificationsService.updateBroadcast(input);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notice updated", { notification, updated });
  } catch (error) {
    logger.error("Error in notifications.updateNotice:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const markAllRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { id } = req.body as IMarkAllReadInput;

    if (id) {
      const { error, notification } = await notificationsService.markAllRead(userId, id);
      if (error) return methods.sendResponse(res, error);

      methods.sendResponse(res, statusCodes.ReqSuccess, "Notification marked as read", { notification });
      return;
    }

    const { error } = await notificationsService.markAllRead(userId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "All notifications marked as read");
  } catch (error) {
    logger.error("Error in notifications.markAllRead:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const updateStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { id, status } = req.body as IUpdateStatusInput;

    const { error, notification } = await notificationsService.updateStatus(userId, id, status);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notification status updated", { notification });
  } catch (error) {
    logger.error("Error in notifications.updateStatus:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { id, broadcastId } = req.body as IDeleteNotificationInput;

    // Board-wide delete requires delete permission (already checked by middleware on /delete)
    const canDeleteBoard = Boolean(broadcastId);
    const { error, deleted } = await notificationsService.deleteOne(userId, id, broadcastId, canDeleteBoard);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notification deleted", { deleted });
  } catch (error) {
    logger.error("Error in notifications.deleteNotification:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getCounts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const filters = req.query as unknown as IGetCountsInput;

    const { error, total, byStatus, byType } = await notificationsService.getCounts(userId, filters);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notification counts fetched", { total, byStatus, byType });
  } catch (error) {
    logger.error("Error in notifications.getCounts:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const notificationsController = {
  getAll,
  getOne,
  create,
  sudoCreate,
  updateNotice,
  markAllRead,
  updateStatus,
  deleteNotification,
  getCounts,
};
