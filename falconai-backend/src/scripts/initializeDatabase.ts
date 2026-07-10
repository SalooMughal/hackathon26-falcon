// Register path aliases when running via ts-node
import "module-alias/register";

// ensure environment variables are available
import dotenv from "dotenv";
dotenv.config();

import { exec } from "child_process";
import { promisify } from "util";
import { db } from "@app/config/db";
import { eq, and } from "drizzle-orm";
import type { InferModel } from "drizzle-orm";
import { permissions, features, roles, role_features, role_feature_permissions, platformSettings, users, knowledgeDocuments } from "@app/schema/tables";
import { permissions as defaultPermissions, features as defaultFeatures, UserRoles, defaultPlatformSettings } from "@app/constants/defaults";
import logger from "@app/services/logging/logger";
import { methods } from "@app/utils/methods";
import { sampleKnowledgeDocs } from "@app/modules/knowledge-base/sample-docs";
import { knowledgeBaseService } from "@app/modules/knowledge-base/knowledge-base.service";
import { pineconeService } from "@app/services/pinecone/client";

const execAsync = promisify(exec);

async function runMigrations() {
  logger.info("Running database migrations...");
  try {
    // Push migrations
    logger.info("Pushing migrations...");
    const { stdout, stderr } = await execAsync("pnpm db:migration:apply");
    logger.info(stdout);
    if (stderr) logger.error(stderr);
    logger.info("Migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed:", error);
    throw error;
  }
}

async function createDefaultPermissions() {
  logger.info("\nCreating default permissions...");

  for (const permission of defaultPermissions) {
    const existingPermission = await db.select().from(permissions).where(eq(permissions.name, permission.name)).limit(1);

    if (existingPermission.length === 0) {
      await db.insert(permissions).values({
        name: permission.name,
        description: permission.description,
      });
      logger.info(`Created permission: ${permission.name}`);
    } else {
      logger.info(`Permission already exists: ${permission.name}`);
    }
  }
}

async function createDefaultFeatures() {
  logger.info("\nCreating default features...");

  for (const feature of defaultFeatures) {
    const existingFeature = await db.select().from(features).where(eq(features.name, feature.name)).limit(1);

    if (existingFeature.length === 0) {
      await db.insert(features).values({
        name: feature.name,
        description: feature.description,
        isActive: feature.is_active,
      });
      logger.info(`Created feature: ${feature.name}`);
    } else {
      logger.info(`Feature already exists: ${feature.name}`);
    }
  }
}

async function createDefaultRoles() {
  logger.info("\nCreating default roles with features and permissions...");

  for (const role of UserRoles) {
    // Check if role exists
    const existingRole = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1);

    let roleId: string;

    if (existingRole.length === 0) {
      const [newRole] = await db
        .insert(roles)
        .values({
          name: role.name,
          description: role.desription,
        })
        .returning();
      roleId = newRole.id;
      logger.info(`Created role: ${role.name}`);
    } else {
      roleId = existingRole[0].id;
      logger.info(`Role already exists: ${role.name}`);
    }

    // Create role features and permissions
    for (const roleFeature of role.features) {
      // Get feature ID
      const [featureRecord] = await db.select().from(features).where(eq(features.name, roleFeature.feature)).limit(1);

      if (!featureRecord) {
        logger.warn(`Feature not found: ${roleFeature.feature}`);
        continue;
      }

      // Check if role-feature mapping exists
      const existingRoleFeature = await db
        .select()
        .from(role_features)
        .where(and(eq(role_features.roleId, roleId), eq(role_features.featureId, featureRecord.id)))
        .limit(1);

      let roleFeatureId: string;

      if (existingRoleFeature.length === 0) {
        const [newRoleFeature] = await db
          .insert(role_features)
          .values({
            roleId,
            featureId: featureRecord.id,
          })
          .returning();
        roleFeatureId = newRoleFeature.id;
        logger.info(`Linked feature '${roleFeature.feature}' to role '${role.name}'`);
      } else {
        roleFeatureId = existingRoleFeature[0].id;
        logger.info(`Feature '${roleFeature.feature}' already linked to role '${role.name}'`);
      }

      // Create permissions for this role-feature
      for (const permission of roleFeature.permissions) {
        // Get permission ID
        const [permissionRecord] = await db.select().from(permissions).where(eq(permissions.name, permission.name)).limit(1);

        if (!permissionRecord) {
          logger.warn(`Permission not found: ${permission.name}`);
          continue;
        }

        // Check if role-feature-permission mapping exists
        const existingRFP = await db
          .select()
          .from(role_feature_permissions)
          .where(and(eq(role_feature_permissions.roleFeatureId, roleFeatureId), eq(role_feature_permissions.permissionId, permissionRecord.id)))
          .limit(1);

        if (existingRFP.length === 0) {
          await db.insert(role_feature_permissions).values({
            roleFeatureId,
            permissionId: permissionRecord.id,
          });
          logger.info(`Added permission '${permission.name}' to feature '${roleFeature.feature}'`);
        } else {
          logger.info(`Permission '${permission.name}' already exists for feature '${roleFeature.feature}'`);
        }
      }
    }
  }
}

async function createDefaultPlatformSettings() {
  logger.info("\nCreating default platform settings...");

  for (const setting of defaultPlatformSettings) {
    const existingSetting = await db.select().from(platformSettings).where(eq(platformSettings.settingKey, setting.key)).limit(1);

    if (existingSetting.length === 0) {
      await db.insert(platformSettings).values({
        settingKey: setting.key,
        settingValue: setting.value,
        settingType: setting.type as "string",
        description: setting.description,
      });
      logger.info(`Created platform setting: ${setting.key}`);
    } else {
      logger.info(`Platform setting already exists: ${setting.key}`);
    }
  }
}

export async function initializeDatabase() {
  try {
    logger.info("🚀 Starting database initialization...\n");

    // Step 1: Run migrations
    await runMigrations();

    // Step 2: Create default permissions
    await createDefaultPermissions();

    // Step 3: Create default features
    await createDefaultFeatures();

    // Step 4: Create default roles with features and permissions
    await createDefaultRoles();

    // Step 5: Create default platform settings
    await createDefaultPlatformSettings();

    // Step 6: Ensure a super-admin user exists
    await createSuperAdminUser();

    // Step 7: Seed sample knowledge docs (indexes when Pinecone + OpenAI are configured)
    await seedSampleKnowledgeDocs();

    logger.info("\n✅ Database initialization completed successfully!");
  } catch (error) {
    logger.error("\n Database initialization failed:", error);
  }
}

// -----------------------------------------------------------------------------
// When this script is executed directly, run the initializer
// -----------------------------------------------------------------------------

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info("Seed script finished, exiting...");
      process.exit(0);
    })
    .catch((err) => {
      logger.error("Seed script encountered an error:", err);
      process.exit(1);
    });
}

// -----------------------------------------------------------------------------
// Additional seeding helpers
// -----------------------------------------------------------------------------

/**
 * Creates a super-admin user if one does not already exist.
 * Uses a hardcoded email/password as specified in the request.
 */
async function createSuperAdminUser() {
  logger.info("\nCreating super-admin user if not present...");

  try {
    const superAdminEmail = "superadmin@falconai.com";
    const superAdminPassword = "Superadmin@123";

    // check for existing user by email
    const [existing] = await db.select().from(users).where(eq(users.email, superAdminEmail.toLowerCase().trim()));
    if (existing) {
      logger.info(`Super-admin user already exists: ${superAdminEmail}`);
      return;
    }

    // retrieve super-admin role id
    const [roleRecord] = await db.select().from(roles).where(eq(roles.name, "admin")).limit(1);
    if (!roleRecord) {
      logger.warn("Super-admin role not found, cannot create user");
      return;
    }

    const hashedPass = methods.encrypt(superAdminPassword);

    const newUser: InferModel<typeof users, "insert"> = {
      email: superAdminEmail.toLowerCase().trim(),
      fullName: "Super Admin",
      password: hashedPass,
      roleId: roleRecord.id,
      emailVerified: true,
      phoneVerified: true,
      profileComplete: true,
    };

    const [inserted] = await db.insert(users).values(newUser).returning();
    logger.info(`Super-admin user created with id ${inserted.id}`);
  } catch (error) {
    logger.error("Error creating super-admin user:", error);
  }
}

async function seedSampleKnowledgeDocs() {
  logger.info("\nSeeding sample knowledge base documents...");

  try {
    for (const doc of sampleKnowledgeDocs) {
      const [existing] = await db
        .select()
        .from(knowledgeDocuments)
        .where(eq(knowledgeDocuments.filename, doc.filename))
        .limit(1);

      if (existing) {
        logger.info(`Knowledge doc already exists: ${doc.filename}`);
        continue;
      }

      if (pineconeService.isPineconeConfigured() && (process.env.OPENAI_API_KEY || "").length > 0) {
        const result = await knowledgeBaseService.createDocument(doc);
        if (result.error && !result.document) {
          logger.warn(`Failed to create/index ${doc.filename}: ${result.error.message}`);
        } else if (result.error) {
          logger.warn(`Created ${doc.filename} but indexing failed: ${result.error.message}`);
        } else {
          logger.info(`Created and indexed knowledge doc: ${doc.filename}`);
        }
      } else {
        await db.insert(knowledgeDocuments).values({
          title: doc.title,
          filename: doc.filename,
          content: doc.content,
          status: "pending",
          chunkCount: 0,
          errorMessage: "Awaiting Pinecone/OpenAI configuration for indexing",
        });
        logger.info(`Inserted pending knowledge doc (not indexed yet): ${doc.filename}`);
      }
    }
  } catch (error) {
    logger.error("Error seeding sample knowledge docs:", error);
  }
}
