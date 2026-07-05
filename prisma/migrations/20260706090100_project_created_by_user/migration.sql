-- AlterTable: ajout de la colonne en nullable d'abord, pour permettre le backfill des lignes existantes
ALTER TABLE "Project" ADD COLUMN "createdByUserId" TEXT;

-- Backfill: pour les projets existants, on n'a pas trace du créateur réel — on utilise le Chef de Projet comme meilleure approximation
UPDATE "Project" SET "createdByUserId" = "projectManagerId" WHERE "createdByUserId" IS NULL;

-- La colonne devient obligatoire une fois le backfill effectué
ALTER TABLE "Project" ALTER COLUMN "createdByUserId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Project_createdByUserId_idx" ON "Project"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
