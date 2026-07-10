CREATE TYPE "public"."acl_type" AS ENUM('email', 'phone', 'ip', 'first_name', 'last_name', 'tokens');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('read', 'un-read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'warn', 'error');--> statement-breakpoint
CREATE TYPE "public"."setting_type" AS ENUM('string', 'number', 'boolean');--> statement-breakpoint
CREATE TABLE "acls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"identifier" varchar(255),
	"type" "acl_type" NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"is_valid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "acls_identifier_unique" UNIQUE("identifier"),
	CONSTRAINT "acls_access_token_unique" UNIQUE("access_token"),
	CONSTRAINT "acls_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "features_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"full_name" varchar(255) NOT NULL,
	"avatar_url" varchar(500),
	"location" varchar(255),
	"phone" varchar(20),
	"date_of_birth" date,
	"gender" varchar(50),
	"country" varchar(100),
	"time_zone" varchar(100),
	"otp" integer,
	"otp_expiry" timestamp,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"profile_complete" boolean DEFAULT true NOT NULL,
	"status" varchar(100),
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_feature_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_feature_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar(255) NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" "setting_type" NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "notification_status" DEFAULT 'un-read' NOT NULL,
	"read_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"biometrics" boolean DEFAULT false NOT NULL,
	"notifications" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "acls" ADD CONSTRAINT "acls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_features" ADD CONSTRAINT "role_features_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_features" ADD CONSTRAINT "role_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_feature_permissions" ADD CONSTRAINT "role_feature_permissions_role_feature_id_role_features_id_fk" FOREIGN KEY ("role_feature_id") REFERENCES "public"."role_features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_feature_permissions" ADD CONSTRAINT "role_feature_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acls_user_id_idx" ON "acls" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "acls_identifier_idx" ON "acls" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "acls_access_token_idx" ON "acls" USING btree ("access_token");--> statement-breakpoint
CREATE UNIQUE INDEX "acls_refresh_token_idx" ON "acls" USING btree ("refresh_token");--> statement-breakpoint
CREATE UNIQUE INDEX "features_name_idx" ON "features" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "permissions_name_idx" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_role_feature" ON "role_features" USING btree ("role_id","feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_role_feature_permission" ON "role_feature_permissions" USING btree ("role_feature_id","permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_settings_key_idx" ON "platform_settings" USING btree ("setting_key");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_is_deleted_idx" ON "notifications" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_user_id_idx" ON "user_preferences" USING btree ("user_id");