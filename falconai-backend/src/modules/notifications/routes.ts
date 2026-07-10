import { Router } from "express";
import { notificationsController } from "./notifications.controller";
import { validate } from "@app/middlewares/validateParams";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";
import { createSchema, getAllSchema, getCountsSchema, getOneSchema, markAllReadSchema, updateStatusSchema, deleteSchema } from "./validations";

const notificationsRouter = Router();

notificationsRouter.get("/read/get-all", validate(getAllSchema, "query"), verifyToken, checkPermissions, notificationsController.getAll);
notificationsRouter.get("/read/get-one", validate(getOneSchema, "query"), verifyToken, checkPermissions, notificationsController.getOne);
notificationsRouter.get("/read/get-counts", validate(getCountsSchema, "query"), verifyToken, checkPermissions, notificationsController.getCounts);
notificationsRouter.post("/sudo/create", validate(createSchema, "body"), verifyToken, checkPermissions, notificationsController.sudoCreate);
notificationsRouter.post("/update/mark-all-read", validate(markAllReadSchema, "body"), verifyToken, checkPermissions, notificationsController.markAllRead);
notificationsRouter.post("/update/update-status", validate(updateStatusSchema, "body"), verifyToken, checkPermissions, notificationsController.updateStatus);
notificationsRouter.post("/delete", validate(deleteSchema, "body"), verifyToken, checkPermissions, notificationsController.deleteNotification);

export default notificationsRouter;
