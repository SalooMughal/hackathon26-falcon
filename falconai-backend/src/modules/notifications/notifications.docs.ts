/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /v1/notifications/read/get-all:
 *   get:
 *     summary: Get all notifications for authenticated user with pagination and filters
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notifications from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notifications until this date (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warn, error]
 *         description: Filter by notification type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [read, un-read, archived]
 *         description: Filter by notification status
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Notifications fetched successfully
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     count:
 *                       type: integer
 *                       example: 10
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /v1/notifications/read/get-one:
 *   get:
 *     summary: Get a single notification by ID (must belong to authenticated user)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Notification fetched successfully
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /v1/notifications/read/get-counts:
 *   get:
 *     summary: Get notification counts grouped by status and type with optional filters
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notifications from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notifications until this date (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warn, error]
 *         description: Filter by notification type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [read, un-read, archived]
 *         description: Filter by notification status
 *     responses:
 *       200:
 *         description: Notification counts fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Notification counts fetched
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 byStatus:
 *                   type: object
 *                   properties:
 *                     read:
 *                       type: integer
 *                       example: 100
 *                     un-read:
 *                       type: integer
 *                       example: 45
 *                     archived:
 *                       type: integer
 *                       example: 5
 *                 byType:
 *                   type: object
 *                   properties:
 *                     info:
 *                       type: integer
 *                       example: 120
 *                     warn:
 *                       type: integer
 *                       example: 25
 *                     error:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /v1/notifications/sudo/create:
 *   post:
 *     summary: Create a notification for any user (super admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user to create notification for
 *               type:
 *                 type: string
 *                 enum: [info, warn, error]
 *                 default: info
 *                 description: Notification type
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *                 default: {}
 *                 description: Additional data (optional)
 *           example:
 *             userId: "123e4567-e89b-12d3-a456-426614174000"
 *             type: "info"
 *             title: "Welcome to the platform"
 *             message: "Your account has been created successfully"
 *             data:
 *               actionUrl: "/profile/complete"
 *     responses:
 *       200:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Notification created successfully
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       403:
 *         description: Forbidden (requires super admin permissions)
 */

/**
 * @swagger
 * /v1/notifications/update/mark-all-read:
 *   post:
 *     summary: Mark all unread notifications as read for authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example: {}
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 */

/**
 * @swagger
 * /v1/notifications/update/update-status:
 *   post:
 *     summary: Update notification status (read, un-read, or archived)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Notification ID
 *               status:
 *                 type: string
 *                 enum: [read, un-read, archived]
 *                 description: New status for the notification
 *           example:
 *             id: "123e4567-e89b-12d3-a456-426614174000"
 *             status: "read"
 *     responses:
 *       200:
 *         description: Notification status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Notification status updated
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found
 */

/**
 * @swagger
 * /v1/notifications/delete:
 *   post:
 *     summary: Soft delete a notification (sets isDeleted flag)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Notification ID
 *           example:
 *             id: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Notification deleted
 *       404:
 *         description: Notification not found
 */
