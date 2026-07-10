import { Request, Response } from "express";
import { platformSettingsService } from "./platform-settings.service";
import statusCodes from "@app/constants/statusCodes";
import { methods } from "@app/utils/methods";
import logger from "@app/services/logging/logger";
import { IUpdateSettingsInput } from "./validations";

/**
 * Get all platform settings
 */
const getAllSettings = async (req: Request, res: Response) => {
  try {
    const { error, settings } = await platformSettingsService.getAllSettings();
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Platform settings retrieved successfully", {
      settings,
    });
  } catch (error) {
    logger.error("Error in getAllSettings controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

/**
 * Get public platform settings (e.g. captcha)
 */
const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const { error, settings } = await platformSettingsService.getAllSettings();
    if (error) return methods.sendResponse(res, error);

    const publicSettings = settings.filter((s: any) => s.settingKey && /^app\./.test(s.settingKey));

    methods.sendResponse(res, statusCodes.ReqSuccess, "Public settings retrieved successfully", {
      settings: publicSettings,
    });
  } catch (error) {
    logger.error("Error in getPublicSettings controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

/**
 * Update platform settings (single or multiple)
 */
const updateSettings = async (req: Request, res: Response) => {
  try {
    const input = req.body as IUpdateSettingsInput;
    const userId = (req as any).user?.id; // From verifyToken middleware

    if (!userId) {
      return methods.sendResponse(res, statusCodes.Unauthorized, "User not authenticated");
    }

    const { error, results, summary } = await platformSettingsService.updateSettings(input, userId);
    if (error) return methods.sendResponse(res, error);

    if (summary && summary.successful === 0) {
      return methods.sendResponse(res, statusCodes.InternalServerError, "All setting updates failed", {
        results,
        summary,
      });
    }

    const message = summary && summary.failed > 0 ? `${summary.successful} setting(s) updated successfully, ${summary.failed} failed` : "All settings updated successfully";

    methods.sendResponse(res, statusCodes.ReqSuccess, message, {
      results,
      summary,
    });
  } catch (error) {
    logger.error("Error in updateSettings controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const platformSettingsController = {
  getAllSettings,
  updateSettings,
  getPublicSettings,
};
