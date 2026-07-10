import { IUser } from "@app/schema/types";
import { sendEmail } from "./email";

export const emailService = {
  sendOtp: async (user: IUser, otp: number) => {
    return await sendEmail(
      "FalconAI - OTP for Email Verification",
      {
        heading: "OTP Request",
        subHeading: "Your journey to be a homeowner continues.",
        text: `Please use the following OTP to verify your email address: <strong>${otp}</strong>. This OTP is valid for 5 minutes. If you did not request this, please ignore this email.`,
      },
      user,
    );
  },
  resendOtp: async (user: IUser, otp: number) => {
    return await sendEmail(
      "FalconAI - Resend OTP for Email Verification",
      {
        heading: "Resend OTP Request",
        subHeading: "Your journey to be a homeowner continues.",
        text: `You requested to resend the OTP. Please use the following OTP to verify your email address: <strong>${otp}</strong>. This OTP is valid for 5 minutes. If you did not request this, please ignore this email.`,
      },
      user,
    );
  },

  forgotPassword: async (user: IUser, otp: number) => {
    await sendEmail(
      "FalconAI - Reset Your Password",
      {
        heading: "Password Reset Request",
        subHeading: "Use the OTP below to reset your password.",
        text: `We received a request to reset your password. Use this OTP to proceed: <strong>${otp}</strong>. It expires in 5 minutes. If you didn't request this, you can safely ignore this email.`,
      },
      user,
    );
  },
};
