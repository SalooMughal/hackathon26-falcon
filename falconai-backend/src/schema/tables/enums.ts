import { pgEnum } from "drizzle-orm/pg-core";

export const aclTypeEnum = pgEnum("acl_type", ["email", "phone", "ip", "first_name", "last_name", "tokens"]);

export const settingTypeEnum = pgEnum("setting_type", ["string", "number", "boolean"]);

// Notifications
export const notificationTypeEnum = pgEnum("notification_type", ["info", "warn", "error"]);
export const notificationStatusEnum = pgEnum("notification_status", ["read", "un-read", "archived"]);
