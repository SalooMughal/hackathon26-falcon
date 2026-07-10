import { Request, Response } from "express";
import { methods } from "@app/utils/methods";
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { notificationsService } from "./notifications.service";
import { ICreateNotificationInput, IGetAllNotificationsInput, IGetCountsInput, IGetOneNotificationInput, IUpdateStatusInput, IDeleteNotificationInput, IMarkAllReadInput } from "./validations";

const getAll = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
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
    const userId = (req as any).user?.id as string;
    const { id } = req.query as unknown as IGetOneNotificationInput;

    const { error, notification } = await notificationsService.getOne(userId, id);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notification fetched successfully", { notification });
  } catch (error) {
    logger.error("Error in notifications.getOne:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const sudoCreate = async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, data } = req.body as ICreateNotificationInput;

    const { error, notification } = await notificationsService.create({ userId, type, title, message, data });
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notification created successfully", { notification });
  } catch (error) {
    logger.error("Error in notifications.sudoCreate:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const markAllRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
    const { id } = req.body as IMarkAllReadInput;

    // If id is provided, mark single notification as read
    if (id) {
      const { error, notification } = await notificationsService.markAllRead(userId, id);
      if (error) return methods.sendResponse(res, error);

      methods.sendResponse(res, statusCodes.ReqSuccess, "Notification marked as read", { notification });
      return;
    }

    // Otherwise, mark all notifications as read
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
    const userId = (req as any).user?.id as string;
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
    const userId = (req as any).user?.id as string;
    const { id } = req.body as IDeleteNotificationInput;

    const { error } = await notificationsService.deleteOne(userId, id);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Notification deleted");
  } catch (error) {
    logger.error("Error in notifications.deleteNotification:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getCounts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
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
  sudoCreate,
  markAllRead,
  updateStatus,
  deleteNotification,
  getCounts,
};
