/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management and permissions endpoints
 */

/**
 * @swagger
 * /v1/roles/read/get-all:
 *   get:
 *     summary: Get all roles with pagination
 *     tags: [Roles]
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
 *     responses:
 *       200:
 *         description: Roles fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Roles fetched successfully"
 *                 roles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *                 total:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/roles/read/get-one:
 *   get:
 *     summary: Get a single role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role fetched successfully"
 *                 role:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/roles/create:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
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
 *                 example: "Admin"
 *               description:
 *                 type: string
 *                 example: "Administrator with full access"
 *     responses:
 *       200:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role created successfully"
 *                 role:
 *                   $ref: '#/components/schemas/Role'
 *       414:
 *         description: Role already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/roles/delete:
 *   post:
 *     summary: Delete a role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role deleted successfully"
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/roles/update/add-features:
 *   post:
 *     summary: Add features to a role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - featureIds
 *             properties:
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               featureIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["223e4567-e89b-12d3-a456-426614174001", "323e4567-e89b-12d3-a456-426614174002"]
 *     responses:
 *       200:
 *         description: Features added to role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Features added to role successfully"
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/roles/update/remove-features:
 *   post:
 *     summary: Remove features from a role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - featureIds
 *             properties:
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               featureIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["223e4567-e89b-12d3-a456-426614174001"]
 *     responses:
 *       200:
 *         description: Features removed from role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Features removed from role successfully"
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/roles/update/add-permissions:
 *   post:
 *     summary: Add permissions to a feature in a role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - featureId
 *               - permissionIds
 *             properties:
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               featureId:
 *                 type: string
 *                 format: uuid
 *                 example: "223e4567-e89b-12d3-a456-426614174001"
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["323e4567-e89b-12d3-a456-426614174002", "423e4567-e89b-12d3-a456-426614174003"]
 *     responses:
 *       200:
 *         description: Permissions added to feature in role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Permissions added to feature in role successfully"
 *       404:
 *         description: Role-feature association not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/roles/update/remove-permissions:
 *   post:
 *     summary: Remove permissions from a feature in a role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - featureId
 *               - permissionIds
 *             properties:
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               featureId:
 *                 type: string
 *                 format: uuid
 *                 example: "223e4567-e89b-12d3-a456-426614174001"
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["323e4567-e89b-12d3-a456-426614174002"]
 *     responses:
 *       200:
 *         description: Permissions removed from feature in role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Permissions removed from feature in role successfully"
 *       404:
 *         description: Role-feature association not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/roles/read/permissions/get-all:
 *   get:
 *     summary: Get all permissions with pagination
 *     tags: [Roles]
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
 *     responses:
 *       200:
 *         description: Permissions fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Permissions fetched successfully"
 *                 permissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
 *                 total:
 *                   type: integer
 *                   example: 15
 *       500:
 *         description: Internal server error
 */
