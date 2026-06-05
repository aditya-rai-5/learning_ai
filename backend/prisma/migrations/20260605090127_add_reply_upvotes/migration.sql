/*
  Warnings:

  - You are about to drop the column `upvotes` on the `discussion_replies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "discussion_replies" DROP COLUMN "upvotes";

-- CreateTable
CREATE TABLE "reply_upvotes" (
    "id" TEXT NOT NULL,
    "reply_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reply_upvotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reply_upvotes_reply_id_user_id_key" ON "reply_upvotes"("reply_id", "user_id");

-- AddForeignKey
ALTER TABLE "reply_upvotes" ADD CONSTRAINT "reply_upvotes_reply_id_fkey" FOREIGN KEY ("reply_id") REFERENCES "discussion_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply_upvotes" ADD CONSTRAINT "reply_upvotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
