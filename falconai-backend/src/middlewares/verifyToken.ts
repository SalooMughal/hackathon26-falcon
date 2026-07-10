require("dotenv").config();
import statusCodes from "@app/constants/statusCodes";
import { authServices } from "@app/modules/auth/auth.services";
import { methods } from "@app/utils/methods";
import logger from "@app/services/logging/logger";
import { Request, Response, NextFunction } from "express";
import { IUserWithRole } from "@app/schema/types";
import { sessionsService } from "@app/modules/sessions/session.service";

declare global {
  namespace Express {
    interface Request {
      user: IUserWithRole;
    }
  }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      methods.sendResponse(res, statusCodes.MissingAuthHeader);
      return;
    }

    const token = authHeader.split(" ")[1];

    let userId: string;

    const verifyToken = methods.verifyToken(token, "access");
    if (!verifyToken.valid) {
      methods.sendResponse(res, statusCodes.TokenAuthenticationFailed);
      return;
    }
    if (verifyToken.userId) {
      userId = verifyToken.userId;

      const { user } = await authServices.getUser(userId, undefined, true);

      if (!user) {
        methods.sendResponse(res, statusCodes.UserNotFound);
        return;
      }

      const { error } = await sessionsService.validateSession(token);
      if (error) return methods.sendResponse(res, error);

      req.user = user as IUserWithRole;

      next();
    }
  } catch (error) {
    methods.sendResponse(res, statusCodes.InternalServerError);
    logger.error("Error in verifyToken middleware:", error);
    return;
  }
};
