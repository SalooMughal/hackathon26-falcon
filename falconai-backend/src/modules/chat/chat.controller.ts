import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { methods } from "@app/utils/methods";
import { Request, Response } from "express";
import { chatService } from "./chat.service";
import {
  IAskChatInput,
  ICreateConversationInput,
  IDeleteConversationInput,
  IGetChatHistoryInput,
  IListConversationsInput,
  IUpdateConversationInput,
} from "./validations";

const listConversations = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query as unknown as IListConversationsInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error, conversations } = await chatService.listConversations(userId, limit);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Conversations retrieved", { conversations });
  } catch (error) {
    logger.error("Error in listConversations controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const createConversation = async (req: Request, res: Response) => {
  try {
    const { title } = req.body as ICreateConversationInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error, conversation } = await chatService.createConversation(userId, title);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Conversation created", { conversation });
  } catch (error) {
    logger.error("Error in createConversation controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const updateConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId, title } = req.body as IUpdateConversationInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error, conversation } = await chatService.updateConversation(userId, conversationId, title);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Conversation updated", { conversation });
  } catch (error) {
    logger.error("Error in updateConversation controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body as IDeleteConversationInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error } = await chatService.deleteConversation(userId, conversationId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Conversation deleted");
  } catch (error) {
    logger.error("Error in deleteConversation controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const ask = async (req: Request, res: Response) => {
  try {
    const { conversationId, question } = req.body as IAskChatInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error, answer, citations, grounded, provider, conversationTitle } = await chatService.ask(
      userId,
      conversationId,
      question,
    );
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, grounded ? "Answer generated" : "No grounded answer available", {
      answer,
      citations,
      grounded,
      provider,
      conversationId,
      conversationTitle,
    });
  } catch (error) {
    logger.error("Error in chat ask controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const askStream = async (req: Request, res: Response) => {
  try {
    const { conversationId, question } = req.body as IAskChatInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const writeEvent = (payload: unknown) => {
      if (res.writableEnded) return;
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    req.on("close", () => {
      if (!res.writableEnded) {
        res.end();
      }
    });

    await chatService.askStream(userId, conversationId, question, writeEvent);

    if (!res.writableEnded) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (error) {
    logger.error("Error in chat askStream controller:", error);
    if (!res.headersSent) {
      return methods.sendResponse(res, statusCodes.InternalServerError);
    }
    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: statusCodes.InternalServerError.message, code: statusCodes.InternalServerError.code })}\n\n`,
      );
      res.end();
    }
  }
};

const history = async (req: Request, res: Response) => {
  try {
    const { conversationId, limit } = req.query as unknown as IGetChatHistoryInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error, conversation, messages } = await chatService.getHistory(userId, conversationId, limit);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Chat history retrieved", { conversation, messages });
  } catch (error) {
    logger.error("Error in chat history controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const chatController = {
  listConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  ask,
  askStream,
  history,
};
