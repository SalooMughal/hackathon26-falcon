import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { Request, Response } from "express";
import { userService } from "./user.service";
import { methods } from "@app/utils/methods";
import { IGetAllUsersInput, IGetUserCountsInput, IGetOneUserInput, ICreateUserInput, IUpdateUserInput, IDeleteUserInput, IAssignRoleInput } from "./validations";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const filters = req.query as unknown as IGetAllUsersInput;

    const { error, users, pagination } = await userService.getAllUsers(filters);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Users retrieved successfully", { users, pagination });
  } catch (error) {
    logger.error("Error in getAllUsers:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getUserCounts = async (req: Request, res: Response) => {
  try {
    const filters = req.query as unknown as IGetUserCountsInput;

    const { error, totalCount, paramsCount } = await userService.getUserCounts(filters);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "User counts retrieved successfully", { totalCount, paramsCount });
  } catch (error) {
    logger.error("Error in getUserCounts:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getOneUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query as unknown as IGetOneUserInput;

    const { error, user } = await userService.getOneUser(userId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "User retrieved successfully", { user });
  } catch (error) {
    logger.error("Error in getOneUser:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const createUser = async (req: Request, res: Response) => {
  try {
    const input = req.body as ICreateUserInput;
    const { error, user } = await userService.createUser(input);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "User created successfully", { user });
  } catch (error) {
    logger.error("Error in createUser:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId, ...updateData } = req.body as IUpdateUserInput;

    const { error, user } = await userService.updateUser(userId, updateData, req.user?.id);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "User updated successfully", { user });
  } catch (error) {
    logger.error("Error in updateUser:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as IDeleteUserInput;

    const { error } = await userService.deleteUser(userId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "User deleted successfully");
  } catch (error) {
    logger.error("Error in deleteUser:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const assignRole = async (req: Request, res: Response) => {
  try {
    const { userId, roleId, roleName } = req.body as IAssignRoleInput;

    const { error, user, role } = await userService.assignRole(req.user!, userId, roleId, roleName);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Role assigned successfully", { user, role });
  } catch (error) {
    logger.error("Error in assignRole:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const userController = {
  getAllUsers,
  getUserCounts,
  getOneUser,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
};
