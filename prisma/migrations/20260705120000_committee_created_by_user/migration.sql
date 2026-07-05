-- AlterTable: ajout de la colonne en nullable d'abord, pour permettre le backfill des lignes existantes
ALTER TABLE "Committee" ADD COLUMN "createdByUserId" TEXT;

-- Backfill: pour les comités existants, on n'a pas trace du créateur réel — on utilise le Responsable comme meilleure approximation
UPDATE "Committee" SET "createdByUserId" = "responsibleUserId" WHERE "createdByUserId" IS NULL;

-- La colonne devient obligatoire une fois le backfill effectué
ALTER TABLE "Committee" ALTER COLUMN "createdByUserId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Committee_createdByUserId_idx" ON "Committee"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
