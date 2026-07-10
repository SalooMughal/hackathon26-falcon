/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Current user profile endpoints
 */

/**
 * @swagger
 * /v1/profile/read/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 */

/**
 * @swagger
 * /v1/profile/update:
 *   post:
 *     summary: Update the authenticated user's full name
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName]
 *             properties:
 *               fullName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /v1/profile/update/password:
 *   post:
 *     summary: Change the authenticated user's password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 */
