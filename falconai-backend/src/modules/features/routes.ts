import { verifyToken } from "@app/middlewares/verifyToken";
import { Router } from "express";
import checkPermissions from "@app/middlewares/checkPermissions";
import { featureController } from "./features.controller";
import { validate } from "@app/middlewares/validateParams";
import { getAllFeaturesSchema, createFeatureSchema, updateFeatureSchema, deleteFeatureSchema, getOneFeatureSchema } from "./validations";

const featureRouter = Router();

featureRouter.get("/read/get-all", validate(getAllFeaturesSchema, "query"), verifyToken, checkPermissions, featureController.getAllFeatures);
featureRouter.get("/read/get-one", validate(getOneFeatureSchema, "query"), verifyToken, checkPermissions, featureController.getOneFeature);
featureRouter.post("/create", validate(createFeatureSchema, "body"), verifyToken, checkPermissions, featureController.createFeature);
featureRouter.post("/update", validate(updateFeatureSchema, "body"), verifyToken, checkPermissions, featureController.updateFeature);
featureRouter.post("/delete", validate(deleteFeatureSchema, "body"), verifyToken, checkPermissions, featureController.deleteFeature);

export default featureRouter;
