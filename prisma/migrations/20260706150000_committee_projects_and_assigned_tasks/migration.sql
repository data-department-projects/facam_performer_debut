-- CreateTable: relation plusieurs-a-plusieurs Comite <-> Projet
CREATE TABLE "CommitteeProject" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "CommitteeProject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommitteeProject_committeeId_projectId_key" ON "CommitteeProject"("committeeId", "projectId");
CREATE INDEX "CommitteeProject_committeeId_idx" ON "CommitteeProject"("committeeId");
CREATE INDEX "CommitteeProject_projectId_idx" ON "CommitteeProject"("projectId");

ALTER TABLE "CommitteeProject" ADD CONSTRAINT "CommitteeProject_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommitteeProject" ADD CONSTRAINT "CommitteeProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: les comites ayant deja un projectId simple sont migres vers la table de jointure
INSERT INTO "CommitteeProject" ("id", "committeeId", "projectId")
SELECT gen_random_uuid()::text, "id", "projectId" FROM "Committee" WHERE "projectId" IS NOT NULL;

-- Suppression de l'ancienne relation simple (au moins un projet obligatoire desormais, via CommitteeProject)
ALTER TABLE "Committee" DROP CONSTRAINT "Committee_projectId_fkey";
DROP INDEX "Committee_projectId_idx";
ALTER TABLE "Committee" DROP COLUMN "projectId";

-- CreateTable: taches independantes creees par un Manager, jamais liees a un projet
CREATE TABLE "AssignedTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignedTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssignedTask_createdByUserId_idx" ON "AssignedTask"("createdByUserId");
ALTER TABLE "AssignedTask" ADD CONSTRAINT "AssignedTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: assignation d'une tache independante a un ou plusieurs collaborateurs
CREATE TABLE "AssignedTaskAssignee" (
    "id" TEXT NOT NULL,
    "assignedTaskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AssignedTaskAssignee_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssignedTaskAssignee_assignedTaskId_userId_key" ON "AssignedTaskAssignee"("assignedTaskId", "userId");
CREATE INDEX "AssignedTaskAssignee_assignedTaskId_idx" ON "AssignedTaskAssignee"("assignedTaskId");
CREATE INDEX "AssignedTaskAssignee_userId_idx" ON "AssignedTaskAssignee"("userId");

ALTER TABLE "AssignedTaskAssignee" ADD CONSTRAINT "AssignedTaskAssignee_assignedTaskId_fkey" FOREIGN KEY ("assignedTaskId") REFERENCES "AssignedTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignedTaskAssignee" ADD CONSTRAINT "AssignedTaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: lien "tache du jour" + livrable sur WeekPlannerTask
ALTER TABLE "WeekPlannerTask" ADD COLUMN "assignedTaskId" TEXT;
ALTER TABLE "WeekPlannerTask" ADD COLUMN "deliverableUrl" TEXT;

CREATE INDEX "WeekPlannerTask_assignedTaskId_idx" ON "WeekPlannerTask"("assignedTaskId");
ALTER TABLE "WeekPlannerTask" ADD CONSTRAINT "WeekPlannerTask_assignedTaskId_fkey" FOREIGN KEY ("assignedTaskId") REFERENCES "AssignedTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
