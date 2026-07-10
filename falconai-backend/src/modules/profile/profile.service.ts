import { db } from "@app/config/db";
import statusCodes from "@app/constants/statusCodes";
import { users } from "@app/schema/tables";
import logger from "@app/services/logging/logger";
import { methods } from "@app/utils/methods";
import { eq } from "drizzle-orm";
import { IUpdatePasswordInput, IUpdateProfileInput } from "./validations";

const getMe = async (userId: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        roleId: true,
      },
      with: {
        role: {
          columns: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) return { error: statusCodes.UserNotFound };
    return { user };
  } catch (error) {
    logger.error(`Error in profile.getMe: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updateProfile = async (userId: string, input: IUpdateProfileInput) => {
  try {
    const [updated] = await db
      .update(users)
      .set({
        fullName: input.fullName.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        updatedAt: users.updatedAt,
      });

    if (!updated) return { error: statusCodes.UserNotFound };
    return { user: updated };
  } catch (error) {
    logger.error(`Error in profile.updateProfile: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

const updatePassword = async (userId: string, input: IUpdatePasswordInput) => {
  try {
    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existing) return { error: statusCodes.UserNotFound };
    if (!existing.password) return { error: statusCodes.SocialLogin };

    const current = methods.decrypt(existing.password);
    if (current !== input.currentPassword) {
      return { error: statusCodes.InvalidCredentials };
    }

    if (input.currentPassword === input.newPassword) {
      return { error: statusCodes.BadRequest };
    }

    await db
      .update(users)
      .set({
        password: methods.encrypt(input.newPassword),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {};
  } catch (error) {
    logger.error(`Error in profile.updatePassword: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

export const profileService = {
  getMe,
  updateProfile,
  updatePassword,
};
