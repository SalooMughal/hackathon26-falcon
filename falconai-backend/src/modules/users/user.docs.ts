/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /v1/users/read/get-all:
 *   get:
 *     summary: Get all users with pagination, filters, and sorting
 *     description: Returns a paginated list of users. Super-admin users are always excluded from results.
 *     tags: [Users]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in fullName and email
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by role ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created on or after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created on or before this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Users retrieved successfully"
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       email:
 *                         type: string
 *                         format: email
 *                       fullName:
 *                         type: string
 *                       location:
 *                         type: string
 *                         nullable: true
 *                       avatarUrl:
 *                         type: string
 *                         nullable: true
 *                       emailVerified:
 *                         type: boolean
 *                       phoneVerified:
 *                         type: boolean
 *                       phone:
 *                         type: string
 *                         nullable: true
 *                       dateOfBirth:
 *                         type: string
 *                         nullable: true
 *                       gender:
 *                         type: string
 *                         nullable: true
 *                       country:
 *                         type: string
 *                         nullable: true
 *                       timeZone:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                         nullable: true
 *                       profileComplete:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       role:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     count:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/users/read/get-counts:
 *   get:
 *     summary: Get user count analytics
 *     description: >
 *       Returns user counts in two groups:
 *       - `totalCount`: All users (excluding super-admin), ignoring filters
 *       - `paramsCount`: Users matching the provided filters
 *       Each group includes total, verified, and unverified email counts.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in fullName and email
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by role ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created on or after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created on or before this date
 *     responses:
 *       200:
 *         description: User counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User counts retrieved successfully"
 *                 totalCount:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 1500
 *                     verified:
 *                       type: integer
 *                       example: 1200
 *                     unverified:
 *                       type: integer
 *                       example: 300
 *                 paramsCount:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 450
 *                     verified:
 *                       type: integer
 *                       example: 400
 *                     unverified:
 *                       type: integer
 *                       example: 50
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/users/read/get-one:
 *   get:
 *     summary: Get a single user by ID with full details
 *     description: >
 *       Returns all user fields (except password), the user's role, and the latest 5 notifications.
 *       Super-admin users are not accessible through this endpoint.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User retrieved successfully"
 *                 user:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         role:
 *                           $ref: '#/components/schemas/Role'
 *                         notifications:
 *                           type: array
 *                           description: Latest 5 notifications for the user
 *                           items:
 *                             $ref: '#/components/schemas/Notification'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/users/create:
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, fullName, password, roleId]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               roleId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: User created successfully
 */

/**
 * @swagger
 * /v1/users/update:
 *   post:
 *     summary: Update a user's profile information
 *     description: >
 *       Updates one or more user profile fields. Super-admin users cannot be updated.
 *       At least one optional field must be provided alongside userId.
 *     tags: [Users]
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
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               fullName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: "John Doe"
 *               location:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Sydney, Australia"
 *               avatarUrl:
 *                 type: string
 *                 format: url
 *                 maxLength: 500
 *                 example: "https://example.com/avatar.jpg"
 *               status:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Active"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *               gender:
 *                 type: string
 *                 maxLength: 50
 *                 example: "male"
 *               country:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Australia"
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 example: "+61400000000"
 *               timeZone:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Australia/Sydney"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden — cannot update super-admin
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/users/delete:
 *   post:
 *     summary: Delete a user and all associated data
 *     description: >
 *       Permanently deletes the user along with their sessions (ACLs) and notifications.
 *       Super-admin users cannot be deleted.
 *     tags: [Users]
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
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       403:
 *         description: Forbidden — cannot delete super-admin
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/users/sudo/assign-role:
 *   post:
 *     summary: Assign a role to a user
 *     description: >
 *       Assigns a role to a user by either roleId or roleName (at least one must be provided).
 *       Cannot assign super-admin role. Cannot change super-admin's role. Cannot change own role.
 *     tags: [Users]
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
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user to assign the role to
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 description: Role ID to assign (required if roleName is not provided)
 *                 example: "660e8400-e29b-41d4-a716-446655440001"
 *               roleName:
 *                 type: string
 *                 description: Role name to assign (required if roleId is not provided)
 *                 example: "admin"
 *           example:
 *             userId: "550e8400-e29b-41d4-a716-446655440000"
 *             roleName: "admin"
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role assigned successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 role:
 *                   $ref: '#/components/schemas/Role'
 *       403:
 *         description: Forbidden — cannot assign super-admin role, change super-admin's role, or change own role
 *       404:
 *         description: User or role not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
