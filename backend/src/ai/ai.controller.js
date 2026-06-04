import * as aiService        from './ai.service.js';
import * as ingestionService  from './ingestion.service.js';

// ─── Chat / RAG ────────────────────────────────────────────────────────────

export const chat = async (req, res) => {
  try {
    const { courseId }               = req.params;
    const { userId, role }           = req.user;
    const { question, moduleId, playheadS } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'question is required and must be a non-empty string' });
    }

    const result = await aiService.askQuestion({
      userId,
      courseId,
      moduleId:  moduleId  || null,
      question:  question.trim(),
      playheadS: playheadS !== undefined ? Number(playheadS) : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
    console.error('[AI chat]', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { courseId }     = req.params;
    const { userId }       = req.user;
    const { moduleId, limit } = req.query;

    const history = await aiService.getChatHistory({
      userId,
      courseId,
      moduleId: moduleId || null,
      limit:    limit ? Number(limit) : 50,
    });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { interactionId } = req.params;
    const { userId }        = req.user;
    const { rating, comment } = req.body;

    if (rating === undefined) {
      return res.status(400).json({ error: 'rating is required (1–5)' });
    }

    const feedback = await aiService.submitFeedback({
      userId,
      interactionId,
      rating:  Number(rating),
      comment: comment || null,
    });

    res.status(200).json({ message: 'Feedback submitted', feedback });
  } catch (error) {
    if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// ─── Ingestion ─────────────────────────────────────────────────────────────

export const ingestModule = async (req, res) => {
  try {
    const { courseId }   = req.params;
    const { role }       = req.user;
    const { moduleId }   = req.body;

    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only instructors can trigger ingestion' });
    }
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required in request body' });
    }

    const result = await ingestionService.ingestModule(moduleId, courseId);
    res.status(200).json({ message: 'Ingestion complete', ...result });
  } catch (error) {
    if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
    console.error('[ingest]', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getIngestionStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const status = await ingestionService.getIngestionStatus(courseId);
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── AI Config ─────────────────────────────────────────────────────────────

export const getAiConfig = async (req, res) => {
  try {
    const { courseId } = req.params;
    const config = await aiService.getAiConfig(courseId);
    res.status(200).json(config || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const upsertAiConfig = async (req, res) => {
  try {
    const { courseId }   = req.params;
    const { userId, role } = req.user;

    const config = await aiService.upsertAiConfig(userId, role, courseId, req.body);
    res.status(200).json({ message: 'AI config saved', config });
  } catch (error) {
    if (error.message.includes('not found'))  return res.status(404).json({ error: error.message });
    if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

// ─── Document Sources ──────────────────────────────────────────────────────

export const getDocumentSources = async (req, res) => {
  try {
    const { courseId } = req.params;
    const sources = await aiService.getDocumentSources(courseId);
    res.status(200).json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addDocumentSource = async (req, res) => {
  try {
    const { courseId }     = req.params;
    const { userId, role } = req.user;
    const { title, sourceUrl } = req.body;

    if (!title || !sourceUrl) {
      return res.status(400).json({ error: 'title and sourceUrl are required' });
    }

    const source = await aiService.addDocumentSource(userId, role, courseId, { title, sourceUrl });
    res.status(201).json({ message: 'Document source added', source });
  } catch (error) {
    if (error.message.includes('not found'))    return res.status(404).json({ error: error.message });
    if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocumentSource = async (req, res) => {
  try {
    const { courseId, sourceId } = req.params;
    const { userId, role }       = req.user;

    await aiService.deleteDocumentSource(userId, role, courseId, sourceId);
    res.status(200).json({ message: 'Document source removed' });
  } catch (error) {
    if (error.message.includes('not found'))    return res.status(404).json({ error: error.message });
    if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};