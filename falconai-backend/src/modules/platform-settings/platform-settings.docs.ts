/**
 * @swagger
 * tags:
 *   name: Platform Settings
 *   description: Platform configuration and settings management endpoints
 */

/**
 * @swagger
 * /v1/platform-settings/read/public:
 *   get:
 *     summary: Get public platform settings (no auth required)
 *     tags: [Platform Settings]
 *     description: Retrieve all non-sensitive public platform settings. This endpoint is open and does not require authentication.
 *     responses:
 *       200:
 *         description: Public platform settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 1000
 *                 message:
 *                   type: string
 *                   example: "Public platform settings retrieved successfully"
 *                 settings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlatformSetting'
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/platform-settings/read/get-all:
 *   get:
 *     summary: Get all platform settings
 *     tags: [Platform Settings]
 *     description: Retrieve all platform settings (no pagination)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 1000
 *                 message:
 *                   type: string
 *                   example: "Platform settings retrieved successfully"
 *                 settings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlatformSetting'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/platform-settings/update:
 *   post:
 *     summary: Update platform settings (single or multiple)
 *     tags: [Platform Settings]
 *     description: Update one or more platform settings. Returns detailed results for each update attempt.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - key
 *                     - value
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: Setting key to update
 *                       example: "upload_provider"
 *                     value:
 *                       type: string
 *                       description: New value for the setting
 *                       example: "s3"
 *           example:
 *             settings:
 *               - key: "upload_provider"
 *                 value: "s3"
 *               - key: "site_name"
 *                 value: "My Home Pathway"
 *     responses:
 *       200:
 *         description: Settings update completed (check summary for details)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 1000
 *                 message:
 *                   type: string
 *                   example: "All settings updated successfully"
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                         example: "upload_provider"
 *                       success:
 *                         type: boolean
 *                         example: true
 *                       oldValue:
 *                         type: string
 *                         example: "cloudinary"
 *                       newValue:
 *                         type: string
 *                         example: "s3"
 *                       error:
 *                         type: string
 *                         description: Error message (only present if success is false)
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 2
 *                     successful:
 *                       type: integer
 *                       example: 2
 *                     failed:
 *                       type: integer
 *                       example: 0
 *             example:
 *               code: 1000
 *               message: "All settings updated successfully"
 *               results:
 *                 - key: "upload_provider"
 *                   success: true
 *                   oldValue: "cloudinary"
 *                   newValue: "s3"
 *                 - key: "site_name"
 *                   success: true
 *                   oldValue: "falconai"
 *                   newValue: "My Home Pathway"
 *               summary:
 *                 total: 2
 *                 successful: 2
 *                 failed: 0
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error or all updates failed
 */
