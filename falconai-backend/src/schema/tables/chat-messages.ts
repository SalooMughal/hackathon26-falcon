import { relations } from "drizzle-orm";
import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { chatMessageRoleEnum } from "./enums";

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: chatMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations").notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("chat_messages_user_id_idx").on(t.userId),
    createdAtIdx: index("chat_messages_created_at_idx").on(t.createdAt),
  }),
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));
