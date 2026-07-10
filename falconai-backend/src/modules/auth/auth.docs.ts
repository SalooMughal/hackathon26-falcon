/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /v1/auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "mypassword123"
 *     responses:
 *       200:
 *         description: >
 *           User signed in successfully. Returns tokens and user object.
 *           If email is not verified, returns status 201 with userId and sends OTP instead.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User signed in successfully"
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       201:
 *         description: Email not verified — OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email not verified, OTP sent"
 *                 userId:
 *                   type: string
 *                   format: uuid
 *       401:
 *         description: Invalid credentials or social-login account
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/auth/google-auth:
 *   post:
 *     summary: Authenticate with Google OAuth token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google OAuth access token
 *                 example: "ya29.a0AfH6SMC..."
 *     responses:
 *       200:
 *         description: User authenticated with Google successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User authenticated with google successfully"
 *       400:
 *         description: Invalid Google token or missing email
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/auth/verify-user:
 *   post:
 *     summary: Verify email OTP and complete sign-in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID returned from signin or resend-otp
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               otp:
 *                 type: integer
 *                 description: 6-digit OTP sent to user's email
 *                 example: 123456
 *     responses:
 *       200:
 *         description: User verified and signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User verified successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *       401:
 *         description: Invalid OTP or OTP expired
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/auth/signout:
 *   post:
 *     summary: Sign out and invalidate the current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User signed out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User signed out successfully"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to user's email
 *     tags: [Auth]
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
 *                 description: User ID to resend OTP for
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access and refresh tokens
 *     description: Provide the current refresh token in the Authorization header. Returns new tokens and updated user data.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request — invalid or missing refresh token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/auth/forget-password/send:
 *   post:
 *     summary: Send a forgot-password OTP to the user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset OTP has been sent to your email"
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/auth/forget-password/verify:
 *   post:
 *     summary: Verify the forgot-password OTP and get a short-lived reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               otp:
 *                 type: integer
 *                 example: 123456
 *     responses:
 *       200:
 *         description: OTP verified — returns a 15-minute reset token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *                 resetToken:
 *                   type: string
 *                   description: Short-lived JWT used to change the password (expires in 15 min)
 *       401:
 *         description: Invalid OTP or OTP expired
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /v1/auth/forget-password/change:
 *   post:
 *     summary: Change password using the reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - password
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: The short-lived reset token from forget-password/verify
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       403:
 *         description: Invalid or expired reset token
 *       500:
 *         description: Internal server error
 */
