import OpenAI from 'openai';
import prisma from '../config/db.config.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dims — matches schema vector(1536)

/**
 * Generate a 1536-dim embedding vector for a text string.
 * Newlines are collapsed to spaces (OpenAI recommendation for embeddings).
 */
export const generateEmbedding = async (text) => {
  const cleaned = text.replace(/\n+/g, ' ').trim();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
  });
  return response.data[0].embedding; // number[1536]
};

/**
 * Cosine-similarity vector search against rag_context using pgvector.
 *
 * Scoping rules:
 *   - moduleId provided → search only chunks for that module (tightest, fastest)
 *   - courseId only     → search all chunks across the whole course (broader fallback)
 *
 * Uses $queryRawUnsafe because Prisma does not support the pgvector <=> operator
 * natively. The values are controlled: embedding is floats from OpenAI,
 * IDs are validated UUIDs, topK is an integer we own.
 */
export const vectorSearch = async ({ embeddingVector, moduleId, courseId, topK = 5 }) => {
  const embStr = `[${embeddingVector.join(',')}]`;

  if (moduleId) {
    return prisma.$queryRawUnsafe(
      `SELECT
         rc.id,
         rc.chunk_text,
         rc.chunk_order,
         rc.module_id,
         1 - (rc.embedding <=> $1::vector) AS similarity
       FROM rag_context rc
       WHERE rc.module_id = $2
         AND rc.embedding IS NOT NULL
       ORDER BY rc.embedding <=> $1::vector
       LIMIT $3`,
      embStr, moduleId, topK
    );
  }

  return prisma.$queryRawUnsafe(
    `SELECT
       rc.id,
       rc.chunk_text,
       rc.chunk_order,
       rc.module_id,
       1 - (rc.embedding <=> $1::vector) AS similarity
     FROM rag_context rc
     JOIN modules m ON m.id = rc.module_id
     WHERE m.course_id = $2
       AND rc.embedding IS NOT NULL
     ORDER BY rc.embedding <=> $1::vector
     LIMIT $3`,
    embStr, courseId, topK
  );
};

/**
 * Hybrid re-ranking for video modules.
 *
 * Blends semantic similarity with timestamp proximity to the user's playhead
 * so that a chunk physically near where they're watching is boosted — even
 * if it's not the most semantically similar result globally.
 *
 * Formula:  finalScore = similarity × wSemantic + proximity × wTemporal
 * Proximity = max(0, 1 - |chunk_midpoint_s - playheadS| / windowS)
 *
 * @param {Array}  chunks     - Results from vectorSearch(), each has similarity, start_time_s, end_time_s
 * @param {number} playheadS  - User's current position in seconds
 * @param {number} windowS    - Decay window: chunks >windowS seconds away score 0 for proximity (default 5 min)
 * @param {number} wSemantic  - Semantic weight (default 0.7)
 * @param {number} wTemporal  - Temporal weight (default 0.3)
 */
export const hybridRankChunks = (chunks, playheadS, windowS = 300, wSemantic = 0.7, wTemporal = 0.3) => {
  return chunks
    .map(chunk => {
      const startS = chunk.start_time_s ?? null;
      const endS = chunk.end_time_s ?? null;
      let temporalScore = 0;

      if (startS !== null && endS !== null) {
        const midS = (startS + endS) / 2;
        temporalScore = Math.max(0, 1 - Math.abs(midS - playheadS) / windowS);
      }

      return {
        ...chunk,
        temporalScore,
        finalScore: Number(chunk.similarity) * wSemantic + temporalScore * wTemporal,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
};