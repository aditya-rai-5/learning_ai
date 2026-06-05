import OpenAI from 'openai';
import prisma from '../config/db.config.js';
import { generateEmbedding, vectorSearch, hybridRankChunks } from './rag.service.js';

// Groq's API is OpenAI-compatible — same SDK, just a different baseURL and key.
// Free tier: https://console.groq.com → create an API key.
let _groq = null;
const getGroq = () => {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY || (process.env.NODE_ENV === 'test' ? 'test-dummy-key' : undefined);
    _groq = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return _groq;
};

const DEFAULT_MODEL       = 'llama-3.3-70b-versatile'; // fast + free on Groq
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_TOP_K       = 5;
const HISTORY_TURNS       = 6; // last 3 user + assistant pairs

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Load per-course AiModelConfig (if set by instructor) and build the system prompt.
 * Falls back to a sensible default that grounds the LLM to the retrieved context.
 */
const loadCourseConfig = async (courseId, courseTitle) => {
  const config = await prisma.aiModelConfig.findFirst({ where: { courseId } });

  const systemPrompt = config?.systemPrompt?.trim()
    ? config.systemPrompt
    : `You are an expert engineering tutor for the course "${courseTitle}".
Answer questions based ONLY on the provided context.
If the answer is not clearly in the context, acknowledge the limitation and suggest the student consult their instructor or explore the module further.
Be concise, clear, and use practical code examples where helpful.`;

  return {
    model:        config?.modelId     ?? DEFAULT_MODEL,
    temperature:  config?.temperature ?? DEFAULT_TEMPERATURE,
    topK:         config?.topK        ?? DEFAULT_TOP_K,
    systemPrompt,
  };
};

// ─── Chat / RAG Pipeline ───────────────────────────────────────────────────

/**
 * Full RAG pipeline:
 *   embed question -> retrieve chunks -> (optional hybrid re-rank for video)
 *   -> assemble prompt -> call Groq LLM -> persist both turns -> return answer.
 *
 * @param {string}  userId      - Authenticated user
 * @param {string}  courseId    - Course context (used for config + scoping)
 * @param {string}  [moduleId]  - Narrow retrieval to a specific module
 * @param {string}  question    - The user's question
 * @param {number}  [playheadS] - For VIDEO modules: current playhead in seconds
 */
export const askQuestion = async ({ userId, courseId, moduleId, question, playheadS }) => {
  // 1. Load course + AI config
  const course = await prisma.course.findUnique({
    where:  { id: courseId },
    select: { id: true, title: true },
  });
  if (!course) throw new Error('Course not found');

  const { model, temperature, topK, systemPrompt } = await loadCourseConfig(courseId, course.title);

  // 2. Load recent conversation history (scoped to module if provided)
  const history = await prisma.interaction.findMany({
    where: {
      userId,
      courseId,
      ...(moduleId ? { moduleId } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take:    HISTORY_TURNS,
    select:  { role: true, message: true },
  });

  // 3. Embed question + vector search
  const embeddingVector = await generateEmbedding(question);
  let chunks = await vectorSearch({ embeddingVector, moduleId, courseId, topK });

  // 4. For video modules with a known playhead -> hybrid semantic + temporal ranking
  if (playheadS !== undefined && chunks.length > 0) {
    chunks = hybridRankChunks(chunks, playheadS);
  }

  // 5. Assemble context block
  const contextBlock = chunks.length > 0
    ? chunks.map((c, i) => `[Context ${i + 1}]\n${c.chunk_text}`).join('\n\n')
    : 'No relevant context was found for this question.';

  const fullSystemPrompt = `${systemPrompt}\n\n--- RETRIEVED CONTEXT ---\n${contextBlock}\n--- END CONTEXT ---`;

  // 6. Call Groq (OpenAI chat completions format — system goes as first message)
  const messages = [
    { role: 'system',  content: fullSystemPrompt },
    ...history.map(h => ({ role: h.role, content: h.message })),
    { role: 'user',    content: question },
  ];

  const groq = getGroq();
  const aiResponse = await groq.chat.completions.create({
    model,
    max_tokens: 1024,
    temperature,
    messages,
  });

  const answer            = aiResponse.choices[0].message.content;
  const retrievedChunkIds = chunks.map(c => c.id);

  // 7. Persist both turns — user question then assistant answer
  await prisma.interaction.create({
    data: {
      userId,
      courseId,
      moduleId:          moduleId || null,
      role:              'user',
      message:           question,
      retrievedChunkIds: [],
      model,
    },
  });

  const assistantInteraction = await prisma.interaction.create({
    data: {
      userId,
      courseId,
      moduleId:          moduleId || null,
      role:              'assistant',
      message:           answer,
      retrievedChunkIds,
      model,
    },
  });

  return {
    answer,
    interactionId: assistantInteraction.id,
    chunksUsed: chunks.map(c => ({
      id:         c.id,
      chunkText:  c.chunk_text,
      similarity: Number(c.similarity ?? c.finalScore ?? 0),
      moduleId:   c.module_id,
    })),
  };
};

/**
 * Return conversation history for a user + course.
 * Optionally scope to a single module (useful for per-module chat UIs).
 */
export const getChatHistory = async ({ userId, courseId, moduleId, limit = 50 }) => {
  return prisma.interaction.findMany({
    where: {
      userId,
      courseId,
      ...(moduleId ? { moduleId } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take:    limit,
    select:  {
      id:                true,
      role:              true,
      message:           true,
      retrievedChunkIds: true,
      model:             true,
      createdAt:         true,
      moduleId:          true,
      feedback:          { select: { id: true, rating: true, comment: true } },
    },
  });
};

// ─── AI Feedback ───────────────────────────────────────────────────────────

/**
 * Submit (or update) feedback for an assistant response.
 * One feedback record per user per interaction.
 */
export const submitFeedback = async ({ userId, interactionId, rating, comment }) => {
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

  const interaction = await prisma.interaction.findUnique({ where: { id: interactionId } });
  if (!interaction)                     throw new Error('Interaction not found');
  if (interaction.userId !== userId)    throw new Error('Forbidden: you can only rate your own interactions');
  if (interaction.role !== 'assistant') throw new Error('Can only rate assistant responses');

  const existing = await prisma.aiFeedback.findFirst({ where: { interactionId, userId } });

  if (existing) {
    return prisma.aiFeedback.update({
      where: { id: existing.id },
      data:  { rating, comment },
    });
  }

  return prisma.aiFeedback.create({
    data: { interactionId, userId, rating, comment },
  });
};

// ─── AI Model Config ───────────────────────────────────────────────────────

export const getAiConfig = async (courseId) => {
  return prisma.aiModelConfig.findFirst({ where: { courseId } });
};

export const upsertAiConfig = async (userId, userRole, courseId, configData) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');
  if (userRole !== 'ADMIN' && course.createdBy !== userId) {
    throw new Error('Unauthorized: only the course owner can set AI config');
  }

  const { modelId, temperature, topK, systemPrompt } = configData;

  const existing = await prisma.aiModelConfig.findFirst({ where: { courseId } });
  if (existing) {
    return prisma.aiModelConfig.update({
      where: { id: existing.id },
      data: {
        ...(modelId      !== undefined && { modelId }),
        ...(temperature  !== undefined && { temperature: parseFloat(temperature) }),
        ...(topK         !== undefined && { topK: parseInt(topK) }),
        ...(systemPrompt !== undefined && { systemPrompt }),
      },
    });
  }

  return prisma.aiModelConfig.create({
    data: {
      courseId,
      modelId:      modelId      ?? DEFAULT_MODEL,
      temperature:  temperature  !== undefined ? parseFloat(temperature) : DEFAULT_TEMPERATURE,
      topK:         topK         !== undefined ? parseInt(topK)          : DEFAULT_TOP_K,
      systemPrompt: systemPrompt ?? '',
    },
  });
};

// ─── Document Sources ──────────────────────────────────────────────────────

export const getDocumentSources = async (courseId) => {
  return prisma.documentSource.findMany({ where: { courseId } });
};

export const addDocumentSource = async (userId, userRole, courseId, { title, sourceUrl }) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');
  if (userRole !== 'ADMIN' && course.createdBy !== userId) {
    throw new Error('Unauthorized: only the course owner can add document sources');
  }

  return prisma.documentSource.create({
    data: {
      courseId,
      title,
      sourceUrl,
      status:        'pending',
      lastCrawledAt: new Date(),
      chunkCount:    0,
    },
  });
};

export const deleteDocumentSource = async (userId, userRole, courseId, sourceId) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');
  if (userRole !== 'ADMIN' && course.createdBy !== userId) {
    throw new Error('Unauthorized');
  }

  const source = await prisma.documentSource.findUnique({ where: { id: sourceId } });
  if (!source || source.courseId !== courseId) throw new Error('Document source not found');

  return prisma.documentSource.delete({ where: { id: sourceId } });
};