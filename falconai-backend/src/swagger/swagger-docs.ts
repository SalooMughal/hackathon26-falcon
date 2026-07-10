import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const isDist = __dirname.includes("dist");
const baseDir = isDist ? "dist" : "src";
const fileExt = isDist ? "js" : "ts";

export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "FalconAI API",
    version: "1.0.0",
    description: "API documentation for FalconAI Backend - A platform connecting homeowners with services and resources",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

export const options = {
  swaggerDefinition,
  apis: [
    `${baseDir}/swagger/swagger-docs.${fileExt}`,
    `${baseDir}/modules/auth/auth.docs.${fileExt}`,
    `${baseDir}/modules/roles/roles.docs.${fileExt}`,
    `${baseDir}/modules/features/features.docs.${fileExt}`,
    `${baseDir}/modules/users/user.docs.${fileExt}`,
    `${baseDir}/modules/sessions/session.docs.${fileExt}`,
    `${baseDir}/modules/platform-settings/platform-settings.docs.${fileExt}`,
    `${baseDir}/modules/notifications/notifications.docs.${fileExt}`,
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

/**
 * @swagger
 * tags:
 *   name: Health Check
 *   description: Health Check routes
 */

/**
 * @swagger
 * /health-check:
 *   get:
 *     summary: Check if API is running fine or not
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: API is running fine
 *       500:
 *         description: API is not running
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - fullName
 *         - roleId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           description: Unique email address
 *         fullName:
 *           type: string
 *           maxLength: 255
 *           description: Full name of the user
 *         avatarUrl:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           description: URL to user avatar image
 *         location:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           description: User location
 *         phone:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           description: User phone number
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: User date of birth
 *         gender:
 *           type: string
 *           maxLength: 50
 *           nullable: true
 *           description: User gender
 *         country:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: User country
 *         timeZone:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: User timezone
 *         emailVerified:
 *           type: boolean
 *           default: false
 *           description: Whether email is verified
 *         phoneVerified:
 *           type: boolean
 *           default: false
 *           description: Whether phone is verified
 *         profileComplete:
 *           type: boolean
 *           default: true
 *           description: Whether user profile is complete
 *         status:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: User account status / last activity
 *         roleId:
 *           type: string
 *           format: uuid
 *           description: Reference to user role
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     Role:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the role
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Unique role name
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Role description
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Role creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     Feature:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - isActive
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the feature
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Unique feature name
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Feature description
 *         isActive:
 *           type: boolean
 *           description: Whether the feature is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Feature creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     Permission:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the permission
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Permission name
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Permission description
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Permission creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     PlatformSetting:
 *       type: object
 *       required:
 *         - settingKey
 *         - settingValue
 *         - settingType
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the setting
 *         settingKey:
 *           type: string
 *           maxLength: 255
 *           description: Unique setting key
 *         settingValue:
 *           type: string
 *           description: Setting value
 *         settingType:
 *           type: string
 *           enum: [string, number, boolean]
 *           description: Type of setting value
 *         description:
 *           type: string
 *           nullable: true
 *           description: Setting description
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Reference to user who last updated
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     ACL:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the ACL entry (session)
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Reference to user
 *         identifier:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           description: Unique identifier for the ACL entry
 *         type:
 *           type: string
 *           enum: [email, phone, ip, first_name, last_name, tokens]
 *           description: Type of ACL entry
 *         accessToken:
 *           type: string
 *           nullable: true
 *           description: Unique access token
 *         refreshToken:
 *           type: string
 *           nullable: true
 *           description: Unique refresh token
 *         isValid:
 *           type: boolean
 *           default: true
 *           description: Whether the ACL entry is valid
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: ACL creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     RoleFeature:
 *       type: object
 *       required:
 *         - roleId
 *         - featureId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the role-feature association
 *         roleId:
 *           type: string
 *           format: uuid
 *           description: Reference to role
 *         featureId:
 *           type: string
 *           format: uuid
 *           description: Reference to feature
 *
 *     RoleFeaturePermission:
 *       type: object
 *       required:
 *         - roleFeatureId
 *         - permissionId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the role-feature-permission association
 *         roleFeatureId:
 *           type: string
 *           format: uuid
 *           description: Reference to role-feature association
 *         permissionId:
 *           type: string
 *           format: uuid
 *           description: Reference to permission
 *
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - title
 *         - message
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the notification
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Reference to user who owns this notification
 *         type:
 *           type: string
 *           enum: [info, warn, error]
 *           default: info
 *           description: Notification type
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message body
 *         data:
 *           type: object
 *           default: {}
 *           description: Additional payload data (arbitrary key-value pairs)
 *         status:
 *           type: string
 *           enum: [read, un-read, archived]
 *           default: un-read
 *           description: Notification read status
 *         readAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Timestamp when the notification was read
 *         isDeleted:
 *           type: boolean
 *           default: false
 *           description: Soft delete flag
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Notification creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *
 *     UserPreferences:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the preferences record
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Reference to user (unique)
 *         biometrics:
 *           type: boolean
 *           default: false
 *           description: Whether biometric login is enabled
 *         notifications:
 *           type: boolean
 *           default: false
 *           description: Whether push notifications are enabled
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Preferences creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
