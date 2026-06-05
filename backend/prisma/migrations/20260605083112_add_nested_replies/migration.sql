-- AlterTable
ALTER TABLE "discussion_replies" ADD COLUMN     "parent_reply_id" TEXT;

-- AddForeignKey
ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_parent_reply_id_fkey" FOREIGN KEY ("parent_reply_id") REFERENCES "discussion_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
