import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { methods } from "@app/utils/methods";
import { Request, Response } from "express";
import { chatService } from "./chat.service";
import { IAskChatInput, IGetChatHistoryInput } from "./validations";

const ask = async (req: Request, res: Response) => {
  try {
    const { question } = req.body as IAskChatInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error, answer, citations, grounded, provider } = await chatService.ask(userId, question);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, grounded ? "Answer generated" : "No grounded answer available", {
      answer,
      citations,
      grounded,
      provider,
    });
  } catch (error) {
    logger.error("Error in chat ask controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const askStream = async (req: Request, res: Response) => {
  try {
    const { question } = req.body as IAskChatInput;
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

    await chatService.askStream(userId, question, writeEvent);

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
    const { limit } = req.query as unknown as IGetChatHistoryInput;
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error, messages } = await chatService.getHistory(userId, limit);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Chat history retrieved", { messages });
  } catch (error) {
    logger.error("Error in chat history controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const clearHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return methods.sendResponse(res, statusCodes.Unauthorized);

    const { error } = await chatService.clearHistory(userId);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Chat history cleared");
  } catch (error) {
    logger.error("Error in chat clearHistory controller:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const chatController = {
  ask,
  askStream,
  history,
  clearHistory,
};
