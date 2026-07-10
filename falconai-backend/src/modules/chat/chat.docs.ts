/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Grounded RAG chatbot endpoints
 */

/**
 * @swagger
 * /v1/chat/create/ask:
 *   post:
 *     summary: Ask a question against the knowledge base
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 example: How do I set up the backend locally?
 *     responses:
 *       200:
 *         description: Answer returned (may be a refusal if ungrounded)
 */

/**
 * @swagger
 * /v1/chat/create/ask-stream:
 *   post:
 *     summary: Ask a question and stream the answer via SSE
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 example: How do I set up the backend locally?
 *     responses:
 *       200:
 *         description: text/event-stream with status, token, done, and error events
 */

/**
 * @swagger
 * /v1/chat/read/history:
 *   get:
 *     summary: Get current user's chat history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: History retrieved
 */

/**
 * @swagger
 * /v1/chat/delete/history:
 *   post:
 *     summary: Clear current user's chat history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History cleared
 */
