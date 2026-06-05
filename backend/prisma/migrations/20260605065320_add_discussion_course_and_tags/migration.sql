-- DropForeignKey
ALTER TABLE "discussion_threads" DROP CONSTRAINT "discussion_threads_module_id_fkey";

-- AlterTable
ALTER TABLE "discussion_threads" ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "tags" TEXT[],
ALTER COLUMN "module_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_threads" ADD CONSTRAINT "discussion_threads_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
