/*
  Warnings:

  - You are about to drop the column `consumedBudget` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedHrCostDays` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `externalExpensesPlanned` on the `Project` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProjectExpenseType" AS ENUM ('ONE_TIME', 'MONTHLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "consumedBudget",
DROP COLUMN "estimatedHrCostDays",
DROP COLUMN "externalExpensesPlanned";

-- CreateTable
CREATE TABLE "ProjectExpense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "expenseType" "ProjectExpenseType" NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectExpense_projectId_idx" ON "ProjectExpense"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
