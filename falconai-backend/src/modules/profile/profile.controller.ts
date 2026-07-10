import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { methods } from "@app/utils/methods";
import { Request, Response } from "express";
import { profileService } from "./profile.service";
import { IUpdatePasswordInput, IUpdateProfileInput } from "./validations";

const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error, user } = await profileService.getMe(userId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Profile retrieved successfully", { user });
  } catch (error) {
    logger.error("Error in profile.getMe:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const input = req.body as IUpdateProfileInput;
    const { error, user } = await profileService.updateProfile(userId, input);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Profile updated successfully", { user });
  } catch (error) {
    logger.error("Error in profile.updateProfile:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const input = req.body as IUpdatePasswordInput;
    const { error } = await profileService.updatePassword(userId, input);
    if (error) {
      if (error === statusCodes.BadRequest) {
        return methods.sendResponse(res, error, "New password must be different from the current password");
      }
      if (error === statusCodes.InvalidCredentials) {
        return methods.sendResponse(res, error, "Current password is incorrect");
      }
      return methods.sendResponse(res, error);
    }

    methods.sendResponse(res, statusCodes.ReqSuccess, "Password updated successfully");
  } catch (error) {
    logger.error("Error in profile.updatePassword:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const profileController = {
  getMe,
  updateProfile,
  updatePassword,
};
