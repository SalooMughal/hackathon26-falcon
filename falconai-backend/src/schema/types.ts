import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { acls, features, permissions, platformSettings, notifications, role_feature_permissions, role_features, roles, users } from "./tables";
import { db } from "@app/config/db";

export type IUser = InferSelectModel<typeof users>;
export type IRole = InferSelectModel<typeof roles>;
export type IFeature = InferSelectModel<typeof features>;
export type IPermission = InferSelectModel<typeof permissions>;
export type IRoleFeature = InferSelectModel<typeof role_features>;
export type IRoleFeaturePermission = InferSelectModel<typeof role_feature_permissions>;
export type IACL = InferSelectModel<typeof acls>;
export type IPlatformSetting = InferSelectModel<typeof platformSettings>;
export type INotification = InferSelectModel<typeof notifications>;

export type INewUser = InferInsertModel<typeof users>;
export type INewRole = InferInsertModel<typeof roles>;
export type INewFeature = InferInsertModel<typeof features>;
export type INewPermission = InferInsertModel<typeof permissions>;
export type INewRoleFeature = InferInsertModel<typeof role_features>;
export type INewRoleFeaturePermission = InferInsertModel<typeof role_feature_permissions>;
export type INewACL = InferInsertModel<typeof acls>;
export type INewPlatformSetting = InferInsertModel<typeof platformSettings>;
export type INewNotification = InferInsertModel<typeof notifications>;

const query = db.query.users.findFirst({
  where: eq(users.id, ""),
  with: {
    role: {
      with: {
        roleFeatures: {
          with: {
            feature: true,
            roleFeaturePermissions: { with: { permission: true } },
          },
        },
      },
    },
  },
});

export type IUserWithRole = Awaited<typeof query>;
