import { Router } from "express";
import { validate } from "@app/middlewares/validateParams";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";
import { profileController } from "./profile.controller";
import { getProfileSchema, updatePasswordSchema, updateProfileSchema } from "./validations";

const profileRouter = Router();

profileRouter.get("/read/me", validate(getProfileSchema, "query"), verifyToken, checkPermissions, profileController.getMe);
profileRouter.post("/update", validate(updateProfileSchema, "body"), verifyToken, checkPermissions, profileController.updateProfile);
profileRouter.post(
  "/update/password",
  validate(updatePasswordSchema, "body"),
  verifyToken,
  checkPermissions,
  profileController.updatePassword,
);

export default profileRouter;
