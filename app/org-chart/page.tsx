import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrgTree } from "@/components/org-chart/OrgTree";
import type { Role } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function OrgChartPage() {
  const session = await auth();
  const role = session!.user.role as Role;
  const userDepartmentId = session!.user.departmentId;

  const whereClause =
    role === "ADMIN" ? {} : { id: userDepartmentId };

  const departments = await prisma.department.findMany({
    where: whereClause,
    include: {
      subDepartments: {
        include: {
          teams: {
            include: {
              manager: {
                select: { id: true, fullName: true, email: true, role: true },
              },
              members: {
                select: { id: true, fullName: true, email: true, role: true },
                where: { isActive: true },
                orderBy: { fullName: "asc" },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Liste des utilisateurs actifs — utilisée dans la modale "Créer une équipe"
  // pour sélectionner le responsable (Admin uniquement)
  const allUsers =
    role === "ADMIN"
      ? await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, fullName: true, role: true },
          orderBy: { fullName: "asc" },
        })
      : [];

  return (
    <OrgTree
      departments={departments}
      allUsers={allUsers}
      isAdmin={role === "ADMIN"}
    />
  );
}
