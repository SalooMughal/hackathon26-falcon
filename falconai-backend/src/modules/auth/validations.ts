import { z } from "zod";

export const signinSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  otp: z.number().min(1, "OTP is required"),
});

export const sendOtpSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const googleAuthSchema = z.object({
  token: z.string().min(1, "Google token is required"),
});

export const forgotPasswordSendSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const forgotPasswordVerifySchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: z.number().min(1, "OTP is required"),
});

export const forgotPasswordChangeSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type ISigninInput = z.infer<typeof signinSchema>;
export type IVerifyOTPInput = z.infer<typeof verifyOtpSchema>;
export type ISendOTPInput = z.infer<typeof sendOtpSchema>;
export type IGoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type IForgotPasswordSendInput = z.infer<typeof forgotPasswordSendSchema>;
export type IForgotPasswordVerifyInput = z.infer<typeof forgotPasswordVerifySchema>;
export type IForgotPasswordChangeInput = z.infer<typeof forgotPasswordChangeSchema>;
