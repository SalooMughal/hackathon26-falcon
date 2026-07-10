import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { Request, Response } from "express";
import { roleServices } from "./role.services";
import { methods } from "@app/utils/methods";
import {
  IGetAllRolesInput,
  IGetOneRoleInput,
  ICreateRoleInput,
  IDeleteRoleInput,
  IAddFeaturesToRoleInput,
  IRemoveFeaturesFromRoleInput,
  IAddPermissionsToFeatureRoleInput,
  IRemovePermissionsFromFeatureRoleInput,
  IGetAllPermissionsInput,
} from "./validations";

const getAllRoles = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as unknown as IGetAllRolesInput;

    const { error, roles, pagination } = await roleServices.getAllRoles(page, limit, false, true);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Roles fetched successfully", { roles, pagination });
  } catch (error) {
    logger.error("Error in getAllRoles:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getOneRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.query as unknown as IGetOneRoleInput;

    const { error, role } = await roleServices.getOneRole(roleId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Role fetched successfully", { role });
  } catch (error) {
    logger.error("Error in getOneRole:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body as ICreateRoleInput;

    const { error, role } = await roleServices.createRole(name, description);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Role created successfully", { role });
  } catch (error) {
    logger.error("Error in createRole:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const deleteRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.body as IDeleteRoleInput;

    const { error } = await roleServices.deleteRole(req.user, roleId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Role deleted successfully");
  } catch (error) {
    logger.error("Error in deleteRole:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const addFeaturesToRole = async (req: Request, res: Response) => {
  try {
    const { roleId, featureIds } = req.body as IAddFeaturesToRoleInput;

    const { error } = await roleServices.addFeaturesToRole(req.user, roleId, featureIds);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Features added to role successfully");
  } catch (error) {
    logger.error("Error in addFeaturesToRole:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const removeFeaturesFromRole = async (req: Request, res: Response) => {
  try {
    const { roleId, featureIds } = req.body as IRemoveFeaturesFromRoleInput;

    const { error } = await roleServices.removeFeaturesFromRole(req.user, roleId, featureIds);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Features removed from role successfully");
  } catch (error) {
    logger.error("Error in removeFeaturesFromRole:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const addPermissionsToFeatureRole = async (req: Request, res: Response) => {
  try {
    const { roleId, featureId, permissionIds } = req.body as IAddPermissionsToFeatureRoleInput;

    const { error } = await roleServices.addPermissionsToFeatureRole(req.user, roleId, featureId, permissionIds);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Permissions added to feature in role successfully");
  } catch (error) {
    logger.error("Error in addPermissionsToFeatureRole:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const removePermissionsFromFeatureRole = async (req: Request, res: Response) => {
  try {
    const { roleId, featureId, permissionIds } = req.body as IRemovePermissionsFromFeatureRoleInput;

    const { error } = await roleServices.removePermissionsFromFeatureRole(req.user, roleId, featureId, permissionIds);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Permissions removed from feature in role successfully");
  } catch (error) {
    logger.error("Error in removePermissionsFromFeatureRole:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as unknown as IGetAllPermissionsInput;

    const { error, permissions, pagination } = await roleServices.getAllPermissions(page, limit);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Permissions fetched successfully", { permissions, pagination });
  } catch (error) {
    logger.error("Error in getAllPermissions:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const roleController = {
  getAllRoles,
  getOneRole,
  createRole,
  deleteRole,
  addFeaturesToRole,
  removeFeaturesFromRole,
  addPermissionsToFeatureRole,
  removePermissionsFromFeatureRole,
  getAllPermissions,
};
