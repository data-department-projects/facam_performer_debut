-- CreateTable: taches personnelles, privees, creees et gerees uniquement par leur proprietaire
CREATE TABLE "PersonalTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PersonalTask_userId_idx" ON "PersonalTask"("userId");
ALTER TABLE "PersonalTask" ADD CONSTRAINT "PersonalTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: lien optionnel vers une tache personnelle placee sur un jour de la semaine
ALTER TABLE "WeekPlannerTask" ADD COLUMN "personalTaskId" TEXT;

CREATE INDEX "WeekPlannerTask_personalTaskId_idx" ON "WeekPlannerTask"("personalTaskId");
ALTER TABLE "WeekPlannerTask" ADD CONSTRAINT "WeekPlannerTask_personalTaskId_fkey" FOREIGN KEY ("personalTaskId") REFERENCES "PersonalTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
