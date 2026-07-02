-- CreateEnum
CREATE TYPE "GanttTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'DELAYED');

-- AlterEnum
ALTER TYPE "CommitteeFrequency" ADD VALUE 'BIMONTHLY';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'INTERN';

-- AlterTable
ALTER TABLE "Committee" ADD COLUMN     "description" TEXT,
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "parentDepartmentId" TEXT;

-- AlterTable
ALTER TABLE "GanttTask" ADD COLUMN     "status" "GanttTaskStatus" NOT NULL DEFAULT 'TODO';

-- AlterTable
ALTER TABLE "KeyResult" ADD COLUMN     "certificateUrl" TEXT;

-- AlterTable
ALTER TABLE "Objective" DROP COLUMN "frequency";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "categoryOther" TEXT;

-- AlterTable
ALTER TABLE "ProjectExpense" ADD COLUMN     "expenseCategory" TEXT;

-- AlterTable
ALTER TABLE "ProjectMilestone" ADD COLUMN     "responsibleUserId" TEXT,
ADD COLUMN     "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Committee_projectId_idx" ON "Committee"("projectId");

-- CreateIndex
CREATE INDEX "Department_parentDepartmentId_idx" ON "Department"("parentDepartmentId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_responsibleUserId_idx" ON "ProjectMilestone"("responsibleUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WeekPlanner_userId_weekStartDate_key" ON "WeekPlanner"("userId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

