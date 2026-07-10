import { pgEnum } from "drizzle-orm/pg-core";

export const aclTypeEnum = pgEnum("acl_type", ["email", "phone", "ip", "first_name", "last_name", "tokens"]);

export const settingTypeEnum = pgEnum("setting_type", ["string", "number", "boolean"]);

// Notifications
export const notificationTypeEnum = pgEnum("notification_type", ["info", "warn", "error"]);
export const notificationStatusEnum = pgEnum("notification_status", ["read", "un-read", "archived"]);

// Knowledge base
export const knowledgeDocumentStatusEnum = pgEnum("knowledge_document_status", ["pending", "indexed", "failed"]);

// Chat
export const chatMessageRoleEnum = pgEnum("chat_message_role", ["user", "assistant"]);
