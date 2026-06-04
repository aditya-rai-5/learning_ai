import prisma from '../config/db.config.js';
import { generateEmbedding } from './rag.service.js';

const CHUNK_SIZE    = 1500; // characters (~400 tokens)
const CHUNK_OVERLAP = 200;  // characters (~50 token carry-over between chunks)

/**
 * Split a body of text into overlapping chunks at paragraph / sentence boundaries.
 *
 * Strategy:
 *   1. Split on double-newlines (paragraph breaks).
 *   2. Accumulate paragraphs until the running chunk exceeds CHUNK_SIZE.
 *   3. Flush the current chunk, carry the last ~CHUNK_OVERLAP chars forward as overlap.
 *   4. Fallback to a sliding window if the text has no paragraph breaks at all.
 *
 * @param {string} text - Raw module body
 * @returns {{ text: string, order: number }[]}
 */
const chunkText = (text) => {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const chunks = [];
  let current = '';
  let order   = 0;

  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para;

    if (candidate.length > CHUNK_SIZE && current.length > 0) {
      chunks.push({ text: current.trim(), order: order++ });
      // Carry the last CHUNK_OVERLAP chars as context into the next chunk
      const overlapStart = Math.max(0, current.length - CHUNK_OVERLAP);
      current = current.slice(overlapStart) + '\n\n' + para;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push({ text: current.trim(), order: order });
  }

  // Fallback: dense text with no paragraph breaks — sliding window
  if (chunks.length === 0 && text.trim().length > 0) {
    let i = 0;
    while (i < text.length) {
      const slice = text.slice(i, i + CHUNK_SIZE).trim();
      if (slice) chunks.push({ text: slice, order: order++ });
      i += CHUNK_SIZE - CHUNK_OVERLAP;
    }
  }

  return chunks;
};

/**
 * Ingest a module's latest ContentVersion into rag_context.
 *
 * Steps:
 *  1. Load the module + its latest version (verifies moduleId + courseId match).
 *  2. Delete all existing RAG chunks for this module (safe re-ingestion).
 *  3. Chunk the content text.
 *  4. Generate an embedding per chunk (sequential — keeps OpenAI rate-limits safe).
 *  5. Insert each chunk via raw SQL (Prisma can't write the vector type directly).
 *
 * For VIDEO modules the `body` field should contain the cleaned transcript text.
 * Full video transcription (Whisper) is handled separately; call this after
 * the transcript has been written into the module body / ContentVersion.
 *
 * @param {string} moduleId        - The module to ingest
 * @param {string} expectedCourseId - Validates the module belongs to this course
 */
export const ingestModule = async (moduleId, expectedCourseId) => {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      versions: { orderBy: { version: 'desc' }, take: 1 },
    },
  });

  if (!module) throw new Error('Module not found');
  if (expectedCourseId && module.courseId !== expectedCourseId) {
    throw new Error('Module not found in this course');
  }
  if (module.versions.length === 0) {
    throw new Error('Module has no content version to ingest');
  }

  const latestVersion = module.versions[0];
  const chunks = chunkText(latestVersion.body);

  if (chunks.length === 0) throw new Error('Module content produced no chunks after splitting');

  // Wipe existing chunks so re-ingestion is idempotent
  await prisma.$executeRawUnsafe(
    `DELETE FROM rag_context WHERE module_id = $1`,
    moduleId
  );

  // Embed + insert each chunk (sequential to stay inside OpenAI rate limits)
  for (const chunk of chunks) {
    const embedding  = await generateEmbedding(chunk.text);
    const embStr     = `[${embedding.join(',')}]`;
    const tokenCount = Math.ceil(chunk.text.length / 4); // rough 4-char-per-token estimate

    await prisma.$executeRawUnsafe(
      `INSERT INTO rag_context
         (id, module_id, version_id, chunk_text, embedding, chunk_order, token_count)
       VALUES
         (gen_random_uuid(), $1, $2, $3, $4::vector, $5, $6)`,
      moduleId,
      latestVersion.id,
      chunk.text,
      embStr,
      chunk.order,
      tokenCount
    );
  }

  return {
    moduleId,
    versionId:     latestVersion.id,
    versionNumber: latestVersion.version,
    chunksCreated: chunks.length,
  };
};

/**
 * Return ingestion status (chunk count) for every module in a course.
 * Useful for the instructor dashboard to see which modules are indexed.
 */
export const getIngestionStatus = async (courseId) => {
  const modules = await prisma.module.findMany({
    where: { courseId },
    select: { id: true, title: true, contentType: true },
    orderBy: { order: 'asc' },
  });

  const status = await Promise.all(
    modules.map(async (mod) => {
      const result = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS chunk_count FROM rag_context WHERE module_id = $1`,
        mod.id
      );
      const chunkCount = result[0]?.chunk_count ?? 0;
      return {
        moduleId:    mod.id,
        title:       mod.title,
        contentType: mod.contentType,
        chunkCount,
        indexed:     chunkCount > 0,
      };
    })
  );

  return status;
};