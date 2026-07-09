-- AlterTable
ALTER TABLE "GanttTask" ADD COLUMN "lastOverdueReminderAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CommitteeAction" ADD COLUMN "lastOverdueReminderAt" TIMESTAMP(3);
