import statusCodes from "@app/constants/statusCodes";
import authRouter from "@app/modules/auth/routes";
import chatRouter from "@app/modules/chat/routes";
import featureRouter from "@app/modules/features/routes";
import knowledgeBaseRouter from "@app/modules/knowledge-base/routes";
import notificationsRouter from "@app/modules/notifications/routes";
import platformSettingsRouter from "@app/modules/platform-settings/routes";
import profileRouter from "@app/modules/profile/routes";
import rolesRouter from "@app/modules/roles/routes";
import sessionsRouter from "@app/modules/sessions/routes";
import usersRouter from "@app/modules/users/routes";
import { methods } from "@app/utils/methods";
import { Request, Response, Router } from "express";

const httpRouter = Router();

//--------------Health Checks----------------\\

httpRouter.get("/", (req: Request, res: Response) => {
  methods.sendResponse(res, statusCodes.ReqSuccess, "Welcome To FalconAI Backend");
});

httpRouter.get("/health-check", (req: Request, res: Response) => {
  methods.sendResponse(res, statusCodes.ReqSuccess, "API is running fine");
});

httpRouter.use("/v1/auth", authRouter);
httpRouter.use("/v1/roles", rolesRouter);
httpRouter.use("/v1/features", featureRouter);
httpRouter.use("/v1/users", usersRouter);
httpRouter.use("/v1/sessions", sessionsRouter);
httpRouter.use("/v1/platform-settings", platformSettingsRouter);
httpRouter.use("/v1/notifications", notificationsRouter);
httpRouter.use("/v1/knowledge-base", knowledgeBaseRouter);
httpRouter.use("/v1/chat", chatRouter);
httpRouter.use("/v1/profile", profileRouter);

export default httpRouter;
