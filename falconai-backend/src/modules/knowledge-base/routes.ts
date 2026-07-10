import { Router } from "express";
import { validate } from "@app/middlewares/validateParams";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";
import { knowledgeBaseController } from "./knowledge-base.controller";
import {
  createKnowledgeDocSchema,
  deleteKnowledgeDocSchema,
  getAllKnowledgeDocsSchema,
  getOneKnowledgeDocSchema,
  reindexKnowledgeDocSchema,
  updateKnowledgeDocSchema,
} from "./validations";

const knowledgeBaseRouter = Router();

knowledgeBaseRouter.get(
  "/read/get-all",
  validate(getAllKnowledgeDocsSchema, "query"),
  verifyToken,
  checkPermissions,
  knowledgeBaseController.getAll,
);
knowledgeBaseRouter.get(
  "/read/get-one",
  validate(getOneKnowledgeDocSchema, "query"),
  verifyToken,
  checkPermissions,
  knowledgeBaseController.getOne,
);
knowledgeBaseRouter.post(
  "/create",
  validate(createKnowledgeDocSchema, "body"),
  verifyToken,
  checkPermissions,
  knowledgeBaseController.create,
);
knowledgeBaseRouter.post(
  "/update",
  validate(updateKnowledgeDocSchema, "body"),
  verifyToken,
  checkPermissions,
  knowledgeBaseController.update,
);
knowledgeBaseRouter.post(
  "/update/reindex",
  validate(reindexKnowledgeDocSchema, "body"),
  verifyToken,
  checkPermissions,
  knowledgeBaseController.reindex,
);
knowledgeBaseRouter.post(
  "/delete",
  validate(deleteKnowledgeDocSchema, "body"),
  verifyToken,
  checkPermissions,
  knowledgeBaseController.remove,
);

export default knowledgeBaseRouter;
