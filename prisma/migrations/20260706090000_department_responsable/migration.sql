-- AlterTable
ALTER TABLE "Department" ADD COLUMN "responsableId" TEXT;

-- CreateIndex
CREATE INDEX "Department_responsableId_idx" ON "Department"("responsableId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
