import dotenv from "dotenv";
dotenv.config();
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { Request, Response } from "express";
import { authServices } from "@app/modules/auth/auth.services";
import { methods } from "@app/utils/methods";
import { IForgotPasswordChangeInput, IForgotPasswordSendInput, IForgotPasswordVerifyInput, ISendOTPInput, ISigninInput, IVerifyOTPInput, IGoogleAuthInput } from "./validations";
import { sessionsService } from "../sessions/session.service";
import { emailService } from "@app/services/email/emails";

const signin = async (req: Request, res: Response) => {
  try {
    const data = req.body as ISigninInput;

    const { authenticated, error, user } = await authServices.authenticateUser(data);
    if (error) return methods.sendResponse(res, error);
    if (!authenticated || !user) return methods.sendResponse(res, statusCodes.InvalidCredentials);

    if (!user.emailVerified) {
      const { user: OtpUser, error: OtpErr } = await authServices.sendOTP(user.id);
      if (OtpErr) return methods.sendResponse(res, OtpErr);
      emailService.sendOtp(OtpUser, OtpUser.otp!);
      return methods.sendResponse(res, statusCodes.ReqSuccess201, "Email not verified, OTP sent", { userId: user?.id });
    }

    const { access_token, refresh_token, error: TokenErr } = authServices.generateTokens(user.id);
    if (TokenErr) return methods.sendResponse(res, TokenErr);

    authServices.updateUserStatus(user.id, `Logged in at ${new Date().toISOString()}`);

    // Await session creation to ensure it's saved before returning tokens
    const sessionResult = await sessionsService.addTokensSession(access_token!, refresh_token!, user.id);
    if (sessionResult && "error" in sessionResult) {
      logger.error("Failed to create session:", sessionResult.error);
      return methods.sendResponse(res, statusCodes.InternalServerError);
    }

    methods.sendResponse(res, statusCodes.ReqSuccess, "User signed in successfully", { tokens: { access_token, refresh_token }, user: methods.filterUser(user, true) });
  } catch (error) {
    logger.error("Error in verifyUser:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const googleAuth = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body as IGoogleAuthInput;
    const { error: googleErr, userInfo } = await authServices.getUserInfoFromGoogle(token);
    if (googleErr) return methods.sendResponse(res, googleErr);
    const { email, given_name, family_name, picture, email_verified } = userInfo;
    const fullName = `${given_name} ${family_name}`;

    return methods.sendResponse(res, statusCodes.ReqSuccess, "User authenticated with google successfully");
  } catch (error) {
    logger.error("Error in googleAuth:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const verifyUser = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body as IVerifyOTPInput;
    const { error, verified, user } = await authServices.verifyOTP(userId, otp);
    if (error) return methods.sendResponse(res, error);
    if (!verified) return methods.sendResponse(res, statusCodes.InvalidOTP);
    if (!user) return { verified: false, error: statusCodes.Unauthorized };

    const { access_token, refresh_token, error: tokenErr } = authServices.generateTokens(user.id);
    if (tokenErr) return methods.sendResponse(res, tokenErr);

    authServices.updateUserStatus(user.id, `Logged in at ${new Date().toISOString()}`);

    // Await session creation to ensure it's saved before returning tokens
    const sessionResult = await sessionsService.addTokensSession(access_token!, refresh_token!, user.id);
    if (sessionResult && "error" in sessionResult) {
      logger.error("Failed to create session:", sessionResult.error);
      return methods.sendResponse(res, statusCodes.InternalServerError);
    }

    methods.sendResponse(res, statusCodes.ReqSuccess, "User verified successfully", { user: methods.filterUser(user, true), tokens: { access_token, refresh_token } });
  } catch (error) {
    logger.error("Error in verifyUser:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const signout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const user = req.user;
    const token = authHeader?.split(" ")[1];
    authServices.updateUserStatus(user?.id!, `Logged out at ${new Date().toISOString()}`);
    sessionsService.invalidateSession(token);
    methods.sendResponse(res, statusCodes.ReqSuccess, "User signed out successfully");
  } catch (error) {
    logger.error("Error in signout:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const resendOTP = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as ISendOTPInput;
    const { error, user } = await authServices.sendOTP(userId);
    if (error) return methods.sendResponse(res, error);
    emailService.resendOtp(user!, user!.otp!);
    methods.sendResponse(res, statusCodes.ReqSuccess, "OTP sent successfully");
  } catch (error) {
    logger.error("Error in resendOTP:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const refreshToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const { access_token, refresh_token, error, userId } = await authServices.refreshToken(token!);
    if (error) return methods.sendResponse(res, error);

    const { user, error: userErr } = await authServices.getUser(userId, undefined, true);
    if (userErr) return methods.sendResponse(res, userErr);
    if (!user) return { verified: false, error: statusCodes.Unauthorized };

    authServices.updateUserStatus(user.id, `Refreshed Token at ${new Date().toISOString()}`);

    // Await session creation to ensure it's saved before returning tokens
    const sessionResult = await sessionsService.addTokensSession(access_token!, refresh_token!, user.id);
    if (sessionResult && "error" in sessionResult) {
      logger.error("Failed to create session:", sessionResult.error);
      return methods.sendResponse(res, statusCodes.InternalServerError);
    }

    methods.sendResponse(res, statusCodes.ReqSuccess, "Token refreshed successfully", { tokens: { access_token, refresh_token }, user: methods.filterUser(user, true) });
  } catch (error) {
    logger.error("Error in refreshToken:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const forgotPasswordSend = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as IForgotPasswordSendInput;
    const { error } = await authServices.sendForgotPasswordOtp(email);
    if (error) return methods.sendResponse(res, error);
    methods.sendResponse(res, statusCodes.ReqSuccess, " Password reset OTP has been sent to your email");
  } catch (error) {
    logger.error("Error in forgotPasswordSend:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const forgotPasswordVerify = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body as IForgotPasswordVerifyInput;
    const { error, resetToken } = await authServices.verifyForgotPasswordOtp(email, otp);
    if (error) return methods.sendResponse(res, error);
    methods.sendResponse(res, statusCodes.ReqSuccess, "OTP verified successfully", { resetToken });
  } catch (error) {
    logger.error("Error in forgotPasswordVerify:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

const forgotPasswordChange = async (req: Request, res: Response) => {
  try {
    const { resetToken, password } = req.body as IForgotPasswordChangeInput;
    const { error } = await authServices.changePasswordWithToken(resetToken, password);
    if (error) return methods.sendResponse(res, error);
    methods.sendResponse(res, statusCodes.ReqSuccess, "Password changed successfully");
  } catch (error) {
    logger.error("Error in forgotPasswordChange:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};

export const authController = {
  verifyUser,
  signin,
  signout,
  resendOTP,
  refreshToken,
  googleAuth,
  forgotPasswordSend,
  forgotPasswordVerify,
  forgotPasswordChange,
};
