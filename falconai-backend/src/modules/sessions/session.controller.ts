import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { Request, Response } from "express";
import { sessionsService } from "./session.service";
import { methods } from "@app/utils/methods";
import { IGetAllSessionsInput, IGetStatsInput, IInvalidateSessionsInput } from "./validations";

// Admin: Get all sessions with optional filters
const getAllSessions = async (req: Request, res: Response) => {
  try {
    const { page, limit, startDate, endDate, isValid, search } = req.query as unknown as IGetAllSessionsInput;

    // Get current access token from authorization header
    const authHeader = req.headers.authorization;
    const currentAccessToken = authHeader ? authHeader.replace("Bearer ", "") : undefined;

    const { error, sessions, pagination } = await sessionsService.adminGetAllSessions(page, limit, startDate, endDate, isValid, search, currentAccessToken);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Sessions retrieved successfully", { sessions, pagination });
  } catch (error) {
    logger.error("Error in getAllSessions:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

// Admin: Get session statistics
const getStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as unknown as IGetStatsInput;

    const { error, stats } = await sessionsService.adminGetStats(startDate, endDate);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Session statistics retrieved successfully", { stats });
  } catch (error) {
    logger.error("Error in getStats:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

// Admin: Invalidate specific sessions
const invalidateSessions = async (req: Request, res: Response) => {
  try {
    const { sessionIds } = req.body as IInvalidateSessionsInput;

    const { error, invalidatedCount, sessions } = await sessionsService.adminInvalidateSessions(sessionIds);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Sessions invalidated successfully", {
      invalidatedCount,
      sessions,
    });
  } catch (error) {
    logger.error("Error in invalidateSessions:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

// Admin: Invalidate all sessions except current
const invalidateAllSessions = async (req: Request, res: Response) => {
  try {
    // Get current access token from authorization header
    const authHeader = req.headers.authorization;
    const currentToken = authHeader ? authHeader.replace("Bearer ", "") : "";

    const { error, invalidatedCount } = await sessionsService.adminInvalidateAllSessions(currentToken);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "All sessions invalidated successfully", { invalidatedCount });
  } catch (error) {
    logger.error("Error in invalidateAllSessions:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const sessionController = {
  getAllSessions,
  getStats,
  invalidateSessions,
  invalidateAllSessions,
};
