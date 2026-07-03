import prisma from '../config/db.config.js';
import { pipeline } from '@xenova/transformers';
import crypto from 'crypto';

// Singleton for local embedding pipeline
let extractor = null;
const getExtractor = async () => {
    if (!extractor) {
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return extractor;
};

/**
 * Generate a 384-dim embedding vector for a text string using local model.
 */
export const generateEmbedding = async (text) => {
    const cleaned = text.replace(/\n+/g, ' ').trim();
    const extract = await getExtractor();
    const output = await extract(cleaned, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
};

export const vectorSearch = async ({ embeddingVector, moduleId, courseId, topK = 5 }) => {
  const embStr = `[${embeddingVector.join(',')}]`;

  if (moduleId) {
    return prisma.$queryRawUnsafe(
      `SELECT
         rc.id,
         rc.chunk_text,
         rc.chunk_order,
         rc.module_id,
         1 - (rc.embedding <=> $1::vector(384)) AS similarity
       FROM rag_context rc
       WHERE rc.module_id = $2
         AND rc.embedding IS NOT NULL
       ORDER BY rc.embedding <=> $1::vector(384)
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
       1 - (rc.embedding <=> $1::vector(384)) AS similarity
     FROM rag_context rc
     JOIN modules m ON m.id = rc.module_id
     WHERE m.course_id = $2
       AND rc.embedding IS NOT NULL
     ORDER BY rc.embedding <=> $1::vector(384)
     LIMIT $3`,
    embStr, courseId, topK
  );
};

export const hybridRankChunks = (chunks, playheadS, windowS = 300, wSemantic = 0.7, wTemporal = 0.3) => {
  return chunks
    .map(chunk => {
      const startS = chunk.start_time_s ?? null;
      const endS   = chunk.end_time_s   ?? null;
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