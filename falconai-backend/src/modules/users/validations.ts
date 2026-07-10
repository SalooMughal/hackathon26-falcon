import { z } from "zod";

export const getAllUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  roleId: z.uuid("Invalid role ID format").optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(["name", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const getUserCountsSchema = z.object({
  search: z.string().optional(),
  roleId: z.uuid("Invalid role ID format").optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const getOneUserSchema = z.object({
  userId: z.uuid("Invalid user ID format"),
});

export const updateUserSchema = z.object({
  userId: z.uuid("Invalid user ID format"),
  fullName: z.string().min(1, "Full name is required").max(255, "Full name too long").optional(),
  location: z.string().max(255, "Location too long").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").max(500, "Avatar URL too long").optional(),
  status: z.string().max(100, "Status too long").optional(),
  dateOfBirth: z.string().date().optional(),
  gender: z.string().max(50, "Gender too long").optional(),
  country: z.string().max(100, "Country too long").optional(),
  phone: z.string().max(20, "Phone number too long").optional(),
  timeZone: z.string().max(100, "Time zone too long").optional(),
});

export const deleteUserSchema = z.object({
  userId: z.uuid("Invalid user ID format"),
});

export const assignRoleSchema = z
  .object({
    userId: z.uuid("Invalid user ID format"),
    roleId: z.uuid("Invalid role ID format").optional(),
    roleName: z.string().optional(),
  })
  .refine((data) => data.roleId || data.roleName, { message: "Either roleId or roleName must be provided" });

export type IGetAllUsersInput = z.infer<typeof getAllUsersSchema>;
export type IGetUserCountsInput = z.infer<typeof getUserCountsSchema>;
export type IGetOneUserInput = z.infer<typeof getOneUserSchema>;
export type IUpdateUserInput = z.infer<typeof updateUserSchema>;
export type IDeleteUserInput = z.infer<typeof deleteUserSchema>;
export type IAssignRoleInput = z.infer<typeof assignRoleSchema>;
