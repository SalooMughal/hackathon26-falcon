import { Request, Response, NextFunction } from "express";
import logger from "@app/services/logging/logger";
import { methods } from "@app/utils/methods";
import statusCodes from "@app/constants/statusCodes";

async function checkPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;

    if (!user) {
      return methods.sendResponse(res, statusCodes.UserNotFound);
    }

    const role = user.role;

    const segments = req.originalUrl.split("/");
    const featureName = segments[2];
    const requiredPermission = segments[3];

    if (!featureName || !requiredPermission) {
      return methods.sendResponse(res, statusCodes.BadRequest);
    }

    const feature = role.roleFeatures?.find((f) => f.feature?.name === featureName);

    if (!feature) {
      return methods.sendResponse(res, statusCodes.RoleRestricted);
    }

    if (!feature.feature?.isActive) {
      return methods.sendResponse(res, statusCodes.FeatureDisabled);
    }

    const populatedPermissions = feature.roleFeaturePermissions?.map((p) => p?.permission).filter(Boolean) || [];

    const hasPermission = populatedPermissions.some((permission) => permission.name === requiredPermission);

    if (!hasPermission) {
      return methods.sendResponse(res, statusCodes.PermissionDenied);
    }

    next();
  } catch (error) {
    logger.error("Error in Check Permissions middleware:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
}

export default checkPermissions;
