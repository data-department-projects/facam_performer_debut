import type { Role } from "@/app/generated/prisma/client";
import type { DashboardFilterOptions } from "@/components/dashboard/types";
import { prisma } from "@/lib/prisma";
import { activeDepartmentMembersWhere } from "@/lib/permissions";

export async function getDashboardFilterOptions(
  role: Role,
  departmentId: string | null,
): Promise<DashboardFilterOptions> {
  if (role === "ADMIN") {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return {
      departments: departments.map((d) => ({ value: d.id, label: d.name })),
      members: [],
    };
  }

  if (role === "MANAGER") {
    const members = await prisma.user.findMany({
      where: activeDepartmentMembersWhere(departmentId),
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    });

    return {
      departments: [],
      members: members.map((u) => ({ value: u.id, label: u.fullName })),
    };
  }

  return { departments: [], members: [] };
}
