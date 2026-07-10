import { z } from "zod";

export const getAllSettingsSchema = z.object({});

export const updateSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1, "Setting key is required"),
        value: z.string().min(0, "Setting value is required"),
      }),
    )
    .min(1, "At least one setting is required"),
});

export type IGetAllSettingsInput = z.infer<typeof getAllSettingsSchema>;
export type IUpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
