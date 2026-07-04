-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DepartmentColor" ADD VALUE 'RED';
ALTER TYPE "DepartmentColor" ADD VALUE 'INDIGO';
ALTER TYPE "DepartmentColor" ADD VALUE 'CYAN';
ALTER TYPE "DepartmentColor" ADD VALUE 'LIME';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "jobTitle" TEXT;
