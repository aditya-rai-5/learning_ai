import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

// mergeParams: true so :courseId from the parent route is accessible here
const router = Router({ mergeParams: true });

// ─── Chat / RAG ────────────────────────────────────────────────────────────
// POST /api/courses/:courseId/chat              — ask a question (full RAG pipeline)
// GET  /api/courses/:courseId/chat              — fetch conversation history
// POST /api/courses/:courseId/chat/interactions/:interactionId/feedback — rate a response
router.post('/chat', authenticateUser, aiController.chat);
router.get('/chat',  authenticateUser, aiController.getChatHistory);
router.post('/chat/interactions/:interactionId/feedback', authenticateUser, aiController.submitFeedback);

// ─── Ingestion ─────────────────────────────────────────────────────────────
// POST /api/courses/:courseId/ingest            — trigger RAG ingestion for a module (INSTRUCTOR only)
// GET  /api/courses/:courseId/ingest/status     — check which modules are indexed
router.post('/ingest',         authenticateUser, aiController.ingestModule);
router.get('/ingest/status',   authenticateUser, aiController.getIngestionStatus);

// ─── AI Config ─────────────────────────────────────────────────────────────
// GET  /api/courses/:courseId/ai-config         — get current AI model config
// POST /api/courses/:courseId/ai-config         — create or update AI model config (INSTRUCTOR only)
router.get('/ai-config',  authenticateUser, aiController.getAiConfig);
router.post('/ai-config', authenticateUser, aiController.upsertAiConfig);

// ─── Document Sources ──────────────────────────────────────────────────────
// GET    /api/courses/:courseId/document-sources           — list registered sources
// POST   /api/courses/:courseId/document-sources           — register a new source (INSTRUCTOR only)
// DELETE /api/courses/:courseId/document-sources/:sourceId — remove a source (INSTRUCTOR only)
router.get('/document-sources',                authenticateUser, aiController.getDocumentSources);
router.post('/document-sources',               authenticateUser, aiController.addDocumentSource);
router.delete('/document-sources/:sourceId',   authenticateUser, aiController.deleteDocumentSource);

export default router;