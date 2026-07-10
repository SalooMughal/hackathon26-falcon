import { Router } from "express";
import { userController } from "./user.controller";
import { validate } from "@app/middlewares/validateParams";
import {
  getAllUsersSchema,
  getUserCountsSchema,
  getOneUserSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  assignRoleSchema,
} from "./validations";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";

const usersRouter = Router();

usersRouter.get("/read/get-all", validate(getAllUsersSchema, "query"), verifyToken, checkPermissions, userController.getAllUsers);
usersRouter.get("/read/get-counts", validate(getUserCountsSchema, "query"), verifyToken, checkPermissions, userController.getUserCounts);
usersRouter.get("/read/get-one", validate(getOneUserSchema, "query"), verifyToken, checkPermissions, userController.getOneUser);
usersRouter.post("/create", validate(createUserSchema, "body"), verifyToken, checkPermissions, userController.createUser);
usersRouter.post("/update", validate(updateUserSchema, "body"), verifyToken, checkPermissions, userController.updateUser);
usersRouter.post("/delete", validate(deleteUserSchema, "body"), verifyToken, checkPermissions, userController.deleteUser);
usersRouter.post("/sudo/assign-role", validate(assignRoleSchema, "body"), verifyToken, checkPermissions, userController.assignRole);

export default usersRouter;
