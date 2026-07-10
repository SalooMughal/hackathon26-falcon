import { verifyToken } from "@app/middlewares/verifyToken";
import { Router } from "express";
import { authController } from "@app/modules/auth/auth.controller";
import { validate } from "@app/middlewares/validateParams";
import { sendOtpSchema, signinSchema, verifyOtpSchema, forgotPasswordSendSchema, forgotPasswordVerifySchema, forgotPasswordChangeSchema, googleAuthSchema } from "./validations";

const authRouter = Router();

authRouter.post("/signin", validate(signinSchema, "body"), authController.signin);
authRouter.post("/google-auth", validate(googleAuthSchema, "body"), authController.googleAuth);
authRouter.post("/verify-user", validate(verifyOtpSchema, "body"), authController.verifyUser);
authRouter.post("/signout", verifyToken, authController.signout);
authRouter.post("/resend-otp", validate(sendOtpSchema, "body"), authController.resendOTP);
authRouter.post("/refresh-token", authController.refreshToken);
authRouter.post("/forget-password/send", validate(forgotPasswordSendSchema, "body"), authController.forgotPasswordSend);
authRouter.post("/forget-password/verify", validate(forgotPasswordVerifySchema, "body"), authController.forgotPasswordVerify);
authRouter.post("/forget-password/change", validate(forgotPasswordChangeSchema, "body"), authController.forgotPasswordChange);

export default authRouter;
