import { pgTable, uuid, varchar, boolean, integer, date, timestamp, uniqueIndex, index, text } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { eq, relations } from "drizzle-orm";
import { acls } from "./acls";
import { notifications } from "./notifications";
import { userPreferences } from "./user-preferences";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }),
    fullName: varchar("full_name", { length: 255 }).notNull(),

    // Basic Info
    avatarUrl: varchar("avatar_url", { length: 500 }),
    location: varchar("location", { length: 255 }),

    // Contact
    phone: varchar("phone", { length: 20 }),
    dateOfBirth: date("date_of_birth"),
    gender: varchar("gender", { length: 50 }),
    country: varchar("country", { length: 100 }),
    timeZone: varchar("time_zone", { length: 100 }),

    // Auth & Security
    otp: integer("otp"),
    otpExpiry: timestamp("otp_expiry"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    phoneVerified: boolean("phone_verified").default(false).notNull(),

    // Profile & Activity
    profileComplete: boolean("profile_complete").default(true).notNull(),
    status: varchar("status", { length: 100 }),

    // Role & Permissions
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    roleIdIdx: index("users_role_id_idx").on(t.roleId),
  }),
);

export const userRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  acls: many(acls),
  notifications: many(notifications),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));
