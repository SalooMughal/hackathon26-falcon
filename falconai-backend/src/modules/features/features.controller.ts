import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { Request, Response } from "express";
import { featureServices } from "./features.services";
import { methods } from "@app/utils/methods";
import { IGetAllFeaturesInput, IGetOneFeatureInput, ICreateFeatureInput, IUpdateFeatureInput, IDeleteFeatureInput } from "./validations";

const getAllFeatures = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as unknown as IGetAllFeaturesInput;

    const { error, features, pagination } = await featureServices.getAllFeatures(page, limit);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Features retrieved successfully", { features, pagination });
  } catch (error) {
    logger.error("Error in getAllFeatures:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getOneFeature = async (req: Request, res: Response) => {
  try {
    const { featureId } = req.query as IGetOneFeatureInput;

    const { error, feature } = await featureServices.getOneFeature(featureId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Feature retrieved successfully", { feature });
  } catch (error) {
    logger.error("Error in getOneFeature:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const createFeature = async (req: Request, res: Response) => {
  try {
    const { name, description, isActive } = req.body as ICreateFeatureInput;

    const { error, feature } = await featureServices.createFeature(name, description, isActive);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Feature created successfully", { feature });
  } catch (error) {
    logger.error("Error in createFeature:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const updateFeature = async (req: Request, res: Response) => {
  try {
    const { featureId, name, description, isActive } = req.body as IUpdateFeatureInput;

    const { error, feature } = await featureServices.updateFeature(featureId, name, description, isActive);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Feature updated successfully", { feature });
  } catch (error) {
    logger.error("Error in updateFeature:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const deleteFeature = async (req: Request, res: Response) => {
  try {
    const { featureId } = req.body as IDeleteFeatureInput;

    const { error } = await featureServices.deleteFeature(featureId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Feature deleted successfully");
  } catch (error) {
    logger.error("Error in deleteFeature:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const featureController = {
  getAllFeatures,
  getOneFeature,
  createFeature,
  updateFeature,
  deleteFeature,
};
