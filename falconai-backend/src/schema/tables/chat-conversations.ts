import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("New chat"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("chat_conversations_user_id_idx").on(t.userId),
    updatedAtIdx: index("chat_conversations_updated_at_idx").on(t.updatedAt),
  }),
);

export const chatConversationsRelations = relations(chatConversations, ({ one }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
}));
