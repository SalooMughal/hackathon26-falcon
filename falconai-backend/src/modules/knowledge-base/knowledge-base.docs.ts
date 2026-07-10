/**
 * @swagger
 * tags:
 *   name: Knowledge Base
 *   description: Manage markdown documents used as the RAG knowledge base
 */

/**
 * @swagger
 * /v1/knowledge-base/read/get-all:
 *   get:
 *     summary: List knowledge documents
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents retrieved
 */

/**
 * @swagger
 * /v1/knowledge-base/read/get-one:
 *   get:
 *     summary: Get one knowledge document
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document retrieved
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /v1/knowledge-base/create:
 *   post:
 *     summary: Create and index a markdown knowledge document
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               filename:
 *                 type: string
 *                 example: project-overview.md
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document created and indexed
 */

/**
 * @swagger
 * /v1/knowledge-base/update:
 *   post:
 *     summary: Update and re-index a knowledge document
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentId]
 *             properties:
 *               documentId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               filename:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated
 */

/**
 * @swagger
 * /v1/knowledge-base/delete:
 *   post:
 *     summary: Delete a knowledge document and its vectors
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentId]
 *             properties:
 *               documentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Document deleted
 */
