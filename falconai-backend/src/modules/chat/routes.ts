import { Router } from "express";
import { validate } from "@app/middlewares/validateParams";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";
import { chatController } from "./chat.controller";
import { askChatSchema, deleteChatHistorySchema, getChatHistorySchema } from "./validations";

const chatRouter = Router();

chatRouter.post("/create/ask", validate(askChatSchema, "body"), verifyToken, checkPermissions, chatController.ask);
chatRouter.post(
  "/create/ask-stream",
  validate(askChatSchema, "body"),
  verifyToken,
  checkPermissions,
  chatController.askStream,
);
chatRouter.get("/read/history", validate(getChatHistorySchema, "query"), verifyToken, checkPermissions, chatController.history);
chatRouter.post(
  "/delete/history",
  validate(deleteChatHistorySchema, "body"),
  verifyToken,
  checkPermissions,
  chatController.clearHistory,
);

export default chatRouter;
