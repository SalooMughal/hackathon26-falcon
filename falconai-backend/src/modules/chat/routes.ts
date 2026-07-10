import { Router } from "express";
import { validate } from "@app/middlewares/validateParams";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";
import { chatController } from "./chat.controller";
import {
  askChatSchema,
  createConversationSchema,
  deleteConversationSchema,
  getChatHistorySchema,
  listConversationsSchema,
  updateConversationSchema,
} from "./validations";

const chatRouter = Router();

chatRouter.get(
  "/read/conversations",
  validate(listConversationsSchema, "query"),
  verifyToken,
  checkPermissions,
  chatController.listConversations,
);
chatRouter.get("/read/history", validate(getChatHistorySchema, "query"), verifyToken, checkPermissions, chatController.history);

chatRouter.post(
  "/create/conversation",
  validate(createConversationSchema, "body"),
  verifyToken,
  checkPermissions,
  chatController.createConversation,
);
chatRouter.post("/create/ask", validate(askChatSchema, "body"), verifyToken, checkPermissions, chatController.ask);
chatRouter.post(
  "/create/ask-stream",
  validate(askChatSchema, "body"),
  verifyToken,
  checkPermissions,
  chatController.askStream,
);

chatRouter.post(
  "/update/conversation",
  validate(updateConversationSchema, "body"),
  verifyToken,
  checkPermissions,
  chatController.updateConversation,
);

chatRouter.post(
  "/delete/conversation",
  validate(deleteConversationSchema, "body"),
  verifyToken,
  checkPermissions,
  chatController.deleteConversation,
);

export default chatRouter;
