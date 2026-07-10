/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Named conversations and grounded RAG chatbot endpoints
 */

/**
 * @swagger
 * /v1/chat/read/conversations:
 *   get:
 *     summary: List the current user's conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved
 */

/**
 * @swagger
 * /v1/chat/create/conversation:
 *   post:
 *     summary: Create a new named conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation created
 */

/**
 * @swagger
 * /v1/chat/update/conversation:
 *   post:
 *     summary: Rename a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation updated
 */

/**
 * @swagger
 * /v1/chat/delete/conversation:
 *   post:
 *     summary: Delete a conversation and its messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation deleted
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
 *             required: [conversationId, question]
 *             properties:
 *               conversationId:
 *                 type: string
 *                 format: uuid
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
 *             required: [conversationId, question]
 *             properties:
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: text/event-stream with status, token, done, and error events
 */

/**
 * @swagger
 * /v1/chat/read/history:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: History retrieved
 */
