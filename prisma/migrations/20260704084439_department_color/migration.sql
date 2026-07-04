-- CreateEnum
CREATE TYPE "DepartmentColor" AS ENUM ('BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'TEAL', 'GRAY');

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "color" "DepartmentColor";
