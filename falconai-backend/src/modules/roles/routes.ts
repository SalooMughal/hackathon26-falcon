import { Router } from "express";
import { roleController } from "./role.controller";
import { validate } from "@app/middlewares/validateParams";
import {
  getAllRolesSchema,
  getOneRoleSchema,
  createRoleSchema,
  deleteRoleSchema,
  addFeaturesToRoleSchema,
  removeFeaturesFromRoleSchema,
  addPermissionsToFeatureRoleSchema,
  removePermissionsFromFeatureRoleSchema,
  getAllPermissionsSchema,
} from "./validations";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";

const rolesRouter = Router();

rolesRouter.get("/read/get-all", validate(getAllRolesSchema, "query"), verifyToken, checkPermissions, roleController.getAllRoles);
rolesRouter.get("/read/get-one", validate(getOneRoleSchema, "query"), verifyToken, checkPermissions, roleController.getOneRole);
rolesRouter.post("/create", validate(createRoleSchema, "body"), verifyToken, checkPermissions, roleController.createRole);
rolesRouter.post("/delete", validate(deleteRoleSchema, "body"), verifyToken, checkPermissions, roleController.deleteRole);
rolesRouter.post("/update/add-features", validate(addFeaturesToRoleSchema, "body"), verifyToken, checkPermissions, roleController.addFeaturesToRole);
rolesRouter.post("/update/remove-features", validate(removeFeaturesFromRoleSchema, "body"), verifyToken, checkPermissions, roleController.removeFeaturesFromRole);
rolesRouter.post("/update/add-permissions", validate(addPermissionsToFeatureRoleSchema, "body"), verifyToken, checkPermissions, roleController.addPermissionsToFeatureRole);
rolesRouter.post("/update/remove-permissions", validate(removePermissionsFromFeatureRoleSchema, "body"), verifyToken, checkPermissions, roleController.removePermissionsFromFeatureRole);
rolesRouter.get("/read/permissions/get-all", validate(getAllPermissionsSchema, "query"), verifyToken, checkPermissions, roleController.getAllPermissions);

export default rolesRouter;
