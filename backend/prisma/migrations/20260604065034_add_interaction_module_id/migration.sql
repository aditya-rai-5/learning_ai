-- AlterTable
ALTER TABLE "interactions" ADD COLUMN     "module_id" TEXT;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
