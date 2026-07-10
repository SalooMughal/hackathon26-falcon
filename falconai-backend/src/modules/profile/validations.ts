import { z } from "zod";

export const getProfileSchema = z.object({});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(255, "Full name too long"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128, "Password too long"),
});

export type IUpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type IUpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
