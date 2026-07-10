import logger from "@app/services/logging/logger";
import { IGenerateTokensResult, IRefreshTokensResult, IVerifyOtpResult } from "@app/modules/auth/types";
import { methods } from "@app/utils/methods";
import statusCodes from "@app/constants/statusCodes";
import { users } from "@app/schema/tables";
import { ISigninInput } from "./validations";
import { db } from "@app/config/db";
import { eq, or } from "drizzle-orm";
import { sessionsService } from "../sessions/session.service";
import { INewUser } from "@app/schema/types";
import { emailService } from "@app/services/email/emails";
import axios from "axios";

const registerUser = async (userData: Omit<INewUser, "roleId">) => {
  try {
    return {};
  } catch (error) {
    logger.error(`Error in registerUser: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const authenticateUser = async (data: ISigninInput) => {
  try {
    const { error, user } = await getUser(undefined, data?.email, true);
    if (error) return { authenticated: false, error };
    if (!user) return { authenticated: false, error: statusCodes.Unauthorized };
    if (user?.password === null) return { authenticated: false, error: statusCodes.SocialLogin };
    if (data?.password !== methods.decrypt(user.password)) return { authenticated: false, error: statusCodes.InvalidCredentials };
    return { authenticated: true, user };
  } catch (error) {
    logger.error(`Error in authenticateUser: ${error instanceof Error ? error.message : String(error)}`);
    return {
      authenticated: false,
      error: statusCodes.InternalServerError,
    };
  }
};

const getUser = async (userId?: string, email?: string, populateRole?: boolean) => {
  try {
    if (!userId && !email) {
      throw new Error("At least one of userId or email must be provided");
    }

    // Normalize email to lowercase if provided
    const normalizedEmail = email ? email.toLowerCase().trim() : email;

    let query;

    if (populateRole) {
      query = await db.query.users.findFirst({
        where: userId ? eq(users.id, userId) : eq(users.email, normalizedEmail!),
        with: {
          role: {
            with: {
              roleFeatures: {
                with: {
                  feature: true,
                  roleFeaturePermissions: {
                    with: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else {
      query = db.query.users.findFirst({
        where: userId ? eq(users.id, userId) : eq(users.email, normalizedEmail!),
      });
    }

    const user = await query;

    return {
      user,
    };
  } catch (error) {
    logger.error(`Error in getUser: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const verifyOTP = async (userId: string, otp: number): Promise<IVerifyOtpResult> => {
  try {
    const { error, user } = await getUser(userId, undefined, true);
    if (error) return { verified: false, error };
    if (!user) return { verified: false, error: statusCodes.Unauthorized };

    // Static OTP for testing - check if provided OTP matches static OTP from env
    const staticOtp = process.env.STATIC_OTP;
    if (staticOtp && otp.toString() === staticOtp) {
      // Static OTP matched, bypass normal validation
    } else {
      // Normal OTP validation
      if (!user.otp || user.otp !== otp) {
        return { verified: false, error: statusCodes.InvalidOTP };
      }

      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return { verified: false, error: statusCodes.OTPExpired };
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        otp: null,
        otpExpiry: null,
        emailVerified: true,
      })
      .where(eq(users.id, userId))
      .returning();

    // Fetch user with role populated to include in response
    const { user: userWithRole, error: fetchError } = await getUser(userId, undefined, true);
    if (fetchError || !userWithRole) {
      // If fetching with role fails, return the updated user without role
      logger.warn(`Failed to fetch user with role after OTP verification: ${fetchError?.message || "Unknown error"}`);
      return { verified: true, user: updatedUser };
    }

    return { verified: true, user: userWithRole };
  } catch (error) {
    const errorMessage = `Error in verifyOTP: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const generateTokens = (userId: string): IGenerateTokensResult => {
  try {
    const access_token = methods.generateToken(userId, 1440, "access");
    const refresh_token = methods.generateToken(userId, 43800, "refresh");

    return { access_token, refresh_token };
  } catch (error) {
    const errorMessage = `Error in generateTokens: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const refreshToken = async (token: string): Promise<IRefreshTokensResult> => {
  try {
    const { userId, error } = methods.verifyToken(token, "refresh");
    if (error) return { error: error };

    const { error: sessionErr, session } = await sessionsService.invalidateSession(undefined, token);
    if (sessionErr) return { error: sessionErr };
    if (!session) return { error: statusCodes.BadRequest };

    const access_token = methods.generateToken(userId, 1440, "access");
    const refresh_token = methods.generateToken(userId, 43800, "refresh");

    sessionsService.addTokensSession(access_token, refresh_token, userId!);

    return { access_token, refresh_token, userId };
  } catch (error) {
    const errorMessage = `Error in refreshToken: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const updateUserStatus = async (userId: string, status: string) => {
  try {
    await db
      .update(users)
      .set({
        status: status,
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    logger.error(`Error in updateUserLoginStatus: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const sendOTP = async (userId: string) => {
  try {
    const { otp, otpExpiry } = methods.generateOTP();
    const [user] = await db
      .update(users)
      .set({
        otp,
        otpExpiry,
      })
      .where(eq(users.id, userId))
      .returning();

    return { user };
  } catch (error) {
    logger.error(`Error in sendOTP: ${error instanceof Error ? error.message : String(error)}`);
    return {
      error: statusCodes.InternalServerError,
    };
  }
};

const sendForgotPasswordOtp = async (email: string) => {
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const { user, error } = await getUser(undefined, normalizedEmail);
    if (error) return { error };
    if (!user) return { error: statusCodes.UserNotFound };
    if (user.password === null) return { error: statusCodes.SocialLogin };

    const { otp, otpExpiry } = methods.generateOTP();
    const [updated] = await db.update(users).set({ otp, otpExpiry }).where(eq(users.id, user.id)).returning();

    emailService.forgotPassword(updated, otp);
    return { success: true };
  } catch (error) {
    logger.error(`Error in sendForgotPasswordOtp: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const verifyForgotPasswordOtp = async (email: string, otp: number) => {
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const { user, error } = await getUser(undefined, normalizedEmail);
    if (error) return { error };
    if (!user) return { error: statusCodes.NotFound };
    const staticOtp = process.env.STATIC_OTP;
    if (staticOtp && otp.toString() === staticOtp) {
      // Static OTP matched, bypass normal validation
    } else {
      if (!user.otp || user.otp !== otp) return { error: statusCodes.InvalidOTP };
      if (!user.otpExpiry || new Date() > user.otpExpiry) return { error: statusCodes.OTPExpired };
    }

    // Invalidate OTP immediately and issue short-lived reset token
    await db.update(users).set({ otp: null, otpExpiry: null }).where(eq(users.id, user.id));
    const resetToken = methods.generateToken(user.id, 15, "access");
    return { resetToken };
  } catch (error) {
    logger.error(`Error in verifyForgotPasswordOtp: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const changePasswordWithToken = async (resetToken: string, newPassword: string) => {
  try {
    const { userId, error, valid } = methods.verifyToken(resetToken, "access");
    if (error || !valid || !userId) return { error: statusCodes.Forbidden };

    const hashedPass = methods.encrypt(newPassword);
    const [updated] = await db.update(users).set({ password: hashedPass }).where(eq(users.id, userId)).returning();

    return { user: updated };
  } catch (error) {
    logger.error(`Error in changePasswordWithToken: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const getUserInfoFromGoogle = async (token: string) => {
  const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const userInfo: { email: string; given_name: string; family_name: string; picture: string; email_verified: boolean } = response.data;
  if (!userInfo || !userInfo.email) return { error: statusCodes.BadRequest };
  // Normalize email to lowercase
  userInfo.email = userInfo.email.toLowerCase().trim();
  return {
    userInfo,
  };
};

export const authServices = {
  registerUser,
  authenticateUser,
  getUser,
  verifyOTP,
  generateTokens,
  refreshToken,
  updateUserStatus,
  sendOTP,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  changePasswordWithToken,
  getUserInfoFromGoogle,
};
