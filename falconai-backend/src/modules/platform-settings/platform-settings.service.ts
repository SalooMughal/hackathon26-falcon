import { db } from "@app/config/db";
import { platformSettings } from "@app/schema/tables/platform-settings";
import { eq } from "drizzle-orm";
import statusCodes from "@app/constants/statusCodes";
import logger from "@app/services/logging/logger";
import { IUpdateSettingsInput } from "./validations";

const settingsCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a single platform setting by key (used internally)
 * @param key - Setting key
 * @param useCache - Whether to use cache (default: true)
 * @returns Setting value or null if not found
 */
export const getPlatformSetting = async (key: string, useCache = true): Promise<string | null> => {
  try {
    if (useCache) {
      const cached = settingsCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.value;
      }
    }

    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.settingKey, key)).limit(1);

    if (setting) {
      settingsCache.set(key, {
        value: setting.settingValue,
        timestamp: Date.now(),
      });
      return setting.settingValue;
    }

    return null;
  } catch (error) {
    logger.error(`Error fetching platform setting ${key}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

/**
 * Get multiple platform settings by keys (used internally)
 * @param keys - Array of setting keys
 * @param useCache - Whether to use cache (default: true)
 * @returns Object with key-value pairs
 */
export const getPlatformSettings = async (keys: string[], useCache = true): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};

  for (const key of keys) {
    const value = await getPlatformSetting(key, useCache);
    if (value !== null) {
      results[key] = value;
    }
  }

  return results;
};

/**
 * Get all platform settings
 */
const getAllSettings = async () => {
  try {
    const settings = await db.select().from(platformSettings).orderBy(platformSettings.settingKey);

    return { settings };
  } catch (error) {
    logger.error(`Error in getAllSettings: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

/**
 * Update multiple platform settings
 */
const updateSettings = async (input: IUpdateSettingsInput, userId: string) => {
  try {
    const { settings: settingsToUpdate } = input;

    const updateResults = [];

    for (const setting of settingsToUpdate) {
      const [existing] = await db.select().from(platformSettings).where(eq(platformSettings.settingKey, setting.key)).limit(1);

      if (!existing) {
        updateResults.push({
          key: setting.key,
          success: false,
          error: "Setting not found",
        });
        continue;
      }

      const [updated] = await db
        .update(platformSettings)
        .set({
          settingValue: setting.value,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(platformSettings.settingKey, setting.key))
        .returning();

      if (updated) {
        clearSettingsCache(setting.key);

        updateResults.push({
          key: setting.key,
          success: true,
          oldValue: existing.settingValue,
          newValue: updated.settingValue,
        });
      } else {
        updateResults.push({
          key: setting.key,
          success: false,
          error: "Update failed",
        });
      }
    }

    const successCount = updateResults.filter((r) => r.success).length;
    const failedCount = updateResults.length - successCount;

    return {
      results: updateResults,
      summary: {
        total: updateResults.length,
        successful: successCount,
        failed: failedCount,
      },
    };
  } catch (error) {
    logger.error(`Error in updateSettings: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

/**
 * Clear settings cache (useful for testing or after updates)
 */
export const clearSettingsCache = (key?: string) => {
  if (key) {
    settingsCache.delete(key);
  } else {
    settingsCache.clear();
  }
};

export const platformSettingsService = {
  getAllSettings,
  updateSettings,
  getPlatformSetting,
  getPlatformSettings,
};
