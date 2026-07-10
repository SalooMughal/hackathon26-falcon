/**
 * @swagger
 * tags:
 *   name: Features
 *   description: Feature management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Feature:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Feature unique identifier
 *         name:
 *           type: string
 *           description: Feature name
 *           example: "User Management"
 *         description:
 *           type: string
 *           description: Feature description
 *           example: "Manage user accounts and profiles"
 *         isActive:
 *           type: boolean
 *           description: Whether the feature is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Feature creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /v1/features/read/get-all:
 *   get:
 *     summary: Get all features with pagination
 *     tags: [Features]
 *     description: Retrieve a paginated list of all features
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Features retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Features retrieved successfully"
 *                 features:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feature'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of features
 *                       example: 15
 *                     count:
 *                       type: integer
 *                       description: Number of features in current page
 *                       example: 10
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       description: Items per page
 *                       example: 10
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/features/read/get-one:
 *   get:
 *     summary: Get a single feature by ID
 *     tags: [Features]
 *     description: Retrieve detailed information about a specific feature
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: featureId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feature unique identifier
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Feature retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feature retrieved successfully"
 *                 feature:
 *                   $ref: '#/components/schemas/Feature'
 *       400:
 *         description: Bad request - invalid feature ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Feature not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/features/create:
 *   post:
 *     summary: Create a new feature
 *     tags: [Features]
 *     description: Create a new feature in the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Feature name (must be unique)
 *                 example: "User Management"
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Feature description
 *                 example: "Manage user accounts and profiles"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the feature is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Feature created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feature created successfully"
 *                 feature:
 *                   $ref: '#/components/schemas/Feature'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Feature already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/features/update:
 *   post:
 *     summary: Update an existing feature
 *     tags: [Features]
 *     description: Update feature information (name, description, or active status)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featureId
 *             properties:
 *               featureId:
 *                 type: string
 *                 format: uuid
 *                 description: Feature unique identifier
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Updated feature name (optional)
 *                 example: "User Management Updated"
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Updated feature description (optional)
 *                 example: "Updated description for user management"
 *               isActive:
 *                 type: boolean
 *                 description: Updated active status (optional)
 *                 example: false
 *     responses:
 *       200:
 *         description: Feature updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feature updated successfully"
 *                 feature:
 *                   $ref: '#/components/schemas/Feature'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Feature not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Feature name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /v1/features/delete:
 *   post:
 *     summary: Delete a feature
 *     tags: [Features]
 *     description: Permanently delete a feature from the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featureId
 *             properties:
 *               featureId:
 *                 type: string
 *                 format: uuid
 *                 description: Feature unique identifier
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Feature deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feature deleted successfully"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Feature not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
