CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) DEFAULT 'New chat' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "chat_conversations_user_id_idx" ON "chat_conversations" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "chat_conversations_updated_at_idx" ON "chat_conversations" USING btree ("updated_at");
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "conversation_id" uuid;
--> statement-breakpoint
INSERT INTO "chat_conversations" ("id", "user_id", "title", "created_at", "updated_at")
SELECT gen_random_uuid(), "user_id", 'Imported chat', MIN("created_at"), MAX("created_at")
FROM "chat_messages"
GROUP BY "user_id";
--> statement-breakpoint
UPDATE "chat_messages" AS m
SET "conversation_id" = c."id"
FROM "chat_conversations" AS c
WHERE c."user_id" = m."user_id" AND c."title" = 'Imported chat' AND m."conversation_id" IS NULL;
--> statement-breakpoint
DELETE FROM "chat_messages" WHERE "conversation_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "conversation_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages" USING btree ("conversation_id");
