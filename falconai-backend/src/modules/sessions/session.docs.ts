/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Admin session management endpoints for monitoring and controlling all platform sessions
 */

/**
 * @swagger
 * /v1/sessions/read/get-all:
 *   get:
 *     summary: Get all sessions with optional filters
 *     description: Retrieve all sessions across the platform with optional filtering by date range, validity status, and search
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
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
 *         description: Filter sessions created on or after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sessions created on or before this date
 *       - in: query
 *         name: isValid
 *         schema:
 *           type: boolean
 *         description: Filter by validity - true for active sessions, false for inactive, omit for all
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by userId, sessionId, accessToken, or refreshToken
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sessions retrieved successfully"
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: Session ID
 *                       type:
 *                         type: string
 *                         enum: [tokens]
 *                       isValid:
 *                         type: boolean
 *                       accessToken:
 *                         type: string
 *                       refreshToken:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           fullName:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           avatarUrl:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/sessions/read/get-stats:
 *   get:
 *     summary: Get session statistics
 *     description: Get platform-wide session statistics including total, active, inactive counts and breakdown by user type
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter stats for sessions created on or after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter stats for sessions created on or before this date
 *     responses:
 *       200:
 *         description: Session statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session statistics retrieved successfully"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of sessions
 *                       example: 1500
 *                     active:
 *                       type: integer
 *                       description: Number of active sessions
 *                       example: 850
 *                     inactive:
 *                       type: integer
 *                       description: Number of inactive sessions
 *                       example: 650
 *                     byUserType:
 *                       type: array
 *                       description: Session count breakdown by user type
 *                       items:
 *                         type: object
 *                         properties:
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/sessions/sudo/invalidate:
 *   post:
 *     summary: Invalidate specific sessions
 *     description: Invalidate multiple sessions by providing an array of session IDs
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionIds
 *             properties:
 *               sessionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 description: Array of session IDs to invalidate
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "987f6543-e21c-34b5-d678-543210987654"]
 *     responses:
 *       200:
 *         description: Sessions invalidated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sessions invalidated successfully"
 *                 invalidatedCount:
 *                   type: integer
 *                   description: Number of sessions that were invalidated
 *                   example: 2
 *                 sessions:
 *                   type: array
 *                   description: Array of invalidated session objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       isValid:
 *                         type: boolean
 *                         example: false
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/sessions/sudo/invalidate-all:
 *   post:
 *     summary: Invalidate all sessions except current
 *     description: Invalidate all active sessions across the platform, excluding the session making the request
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions invalidated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All sessions invalidated successfully"
 *                 invalidatedCount:
 *                   type: integer
 *                   description: Number of sessions that were invalidated
 *                   example: 247
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
