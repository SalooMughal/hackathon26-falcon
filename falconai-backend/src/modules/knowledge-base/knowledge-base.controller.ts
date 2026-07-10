import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { methods } from "@app/utils/methods";
import { Request, Response } from "express";
import { knowledgeBaseService } from "./knowledge-base.service";
import {
  ICreateKnowledgeDocInput,
  IDeleteKnowledgeDocInput,
  IGetAllKnowledgeDocsInput,
  IGetOneKnowledgeDocInput,
  IReindexKnowledgeDocInput,
  IUpdateKnowledgeDocInput,
} from "./validations";

const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = req.query as unknown as IGetAllKnowledgeDocsInput;
    const { error, documents, pagination } = await knowledgeBaseService.getAllDocuments(page, limit, search);
    if (error) return methods.sendResponse(res, error);
    methods.sendResponse(res, statusCodes.ReqSuccess, "Knowledge documents retrieved successfully", {
      documents,
      pagination,
    });
  } catch (error) {
    logger.error("Error in knowledge-base getAll:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const getOne = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.query as unknown as IGetOneKnowledgeDocInput;
    const { error, document } = await knowledgeBaseService.getOneDocument(documentId);
    if (error) return methods.sendResponse(res, error);
    methods.sendResponse(res, statusCodes.ReqSuccess, "Knowledge document retrieved successfully", { document });
  } catch (error) {
    logger.error("Error in knowledge-base getOne:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const create = async (req: Request, res: Response) => {
  try {
    const data = req.body as ICreateKnowledgeDocInput;
    const userId = req.user?.id;
    const { error, document } = await knowledgeBaseService.createDocument(data, userId);
    if (error && !document) return methods.sendResponse(res, error);
    if (error && document) {
      return methods.sendResponse(res, error, error.message, { document });
    }
    methods.sendResponse(res, statusCodes.ReqSuccess, "Knowledge document created and indexed", { document });
  } catch (error) {
    logger.error("Error in knowledge-base create:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const update = async (req: Request, res: Response) => {
  try {
    const data = req.body as IUpdateKnowledgeDocInput;
    const { documentId, ...rest } = data;
    const { error, document } = await knowledgeBaseService.updateDocument(documentId, rest);
    if (error && !document) return methods.sendResponse(res, error);
    if (error && document) {
      return methods.sendResponse(res, error, error.message, { document });
    }
    methods.sendResponse(res, statusCodes.ReqSuccess, "Knowledge document updated", { document });
  } catch (error) {
    logger.error("Error in knowledge-base update:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const remove = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body as IDeleteKnowledgeDocInput;
    const { error } = await knowledgeBaseService.deleteDocument(documentId);
    if (error) return methods.sendResponse(res, error);
    methods.sendResponse(res, statusCodes.ReqSuccess, "Knowledge document deleted");
  } catch (error) {
    logger.error("Error in knowledge-base delete:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const reindex = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.body as IReindexKnowledgeDocInput;
    const { error, results, reindexed, failed } = await knowledgeBaseService.reindexDocuments(documentId);
    if (error) return methods.sendResponse(res, error);
    methods.sendResponse(res, statusCodes.ReqSuccess, "Reindex completed", { results, reindexed, failed });
  } catch (error) {
    logger.error("Error in knowledge-base reindex:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const knowledgeBaseController = {
  getAll,
  getOne,
  create,
  update,
  remove,
  reindex,
};
