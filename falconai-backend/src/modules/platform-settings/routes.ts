import { Router } from "express";
import { platformSettingsController } from "./platform-settings.controller";
import { validate } from "@app/middlewares/validateParams";
import { getAllSettingsSchema, updateSettingsSchema } from "./validations";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";

const platformSettingsRouter = Router();

// Public route for fetching non-sensitive settings
platformSettingsRouter.get("/read/public", platformSettingsController.getPublicSettings);
platformSettingsRouter.get("/read/get-all", validate(getAllSettingsSchema, "query"), verifyToken, checkPermissions, platformSettingsController.getAllSettings);
platformSettingsRouter.post("/update", validate(updateSettingsSchema, "body"), verifyToken, checkPermissions, platformSettingsController.updateSettings);

export default platformSettingsRouter;
