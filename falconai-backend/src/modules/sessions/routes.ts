import { Router } from "express";
import { sessionController } from "./session.controller";
import { validate } from "@app/middlewares/validateParams";
import { getAllSessionsSchema, getStatsSchema, invalidateSessionsSchema } from "./validations";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";

const sessionsRouter = Router();

sessionsRouter.get("/read/get-all", validate(getAllSessionsSchema, "query"), verifyToken, checkPermissions, sessionController.getAllSessions);
sessionsRouter.get("/read/get-stats", validate(getStatsSchema, "query"), verifyToken, checkPermissions, sessionController.getStats);
sessionsRouter.post("/sudo/invalidate", validate(invalidateSessionsSchema, "body"), verifyToken, checkPermissions, sessionController.invalidateSessions);
sessionsRouter.post("/sudo/invalidate-all", verifyToken, checkPermissions, sessionController.invalidateAllSessions);

export default sessionsRouter;
