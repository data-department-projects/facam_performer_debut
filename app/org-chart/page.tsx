import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { OrgTree } from "@/components/org-chart/OrgTree";
import { OrgChartView } from "@/components/org-chart/OrgChartView";
import { AppShell } from "@/components/layout/AppShell";
import type { Role } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function OrgChartPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  const isAdmin = role === "ADMIN";

  if (isAdmin) {
    const [departments, allUsers] = await Promise.all([
      prisma.department.findMany({
        include: {
          users: {
            where: { isActive: true },
            select: { id: true, fullName: true, email: true, role: true },
            orderBy: { fullName: "asc" },
          },
          subDepartments: {
            include: {
              teams: {
                include: {
                  manager: { select: { id: true, fullName: true, email: true, role: true } },
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
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true, role: true },
        orderBy: { fullName: "asc" },
      }),
    ]);

    const orgChartDepts = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      users: dept.users,
      subDepartments: dept.subDepartments.map((sd) => ({
        id: sd.id,
        name: sd.name,
        teams: sd.teams.map((t) => ({
          id: t.id,
          name: t.name,
          manager: t.manager ? { id: t.manager.id } : null,
          members: t.members,
        })),
      })),
    }));

    return (
      <AppShell pageTitle="Organigramme">
        <div className="flex flex-col gap-12">
          {/* Section 1 — Arbre de gestion (CRUD) */}
          <OrgTree departments={departments} allUsers={allUsers} isAdmin={true} />

          {/* Section 2 — Annuaire des collaborateurs */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray200" />
              <div className="flex items-center gap-2 rounded-full border border-gray200 bg-facamWhite px-4 py-1.5 shadow-sm">
                <Users size={13} className="text-facamBlue" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray500">
                  Annuaire des collaborateurs
                </span>
              </div>
              <div className="h-px flex-1 bg-gray200" />
            </div>

            <OrgChartView departments={orgChartDepts} />
          </div>
        </div>
      </AppShell>
    );
  }

  // Non-Admin : restreint au propre département de l'utilisateur
  const userDepartmentId = session.user.departmentId;
  if (!userDepartmentId) redirect("/dashboard");

  const departments = await prisma.department.findMany({
    where: { id: userDepartmentId },
    include: {
      users: {
        where: { isActive: true },
        select: { id: true, fullName: true, email: true, role: true },
        orderBy: { fullName: "asc" },
      },
      subDepartments: {
        include: {
          teams: {
            include: {
              manager: { select: { id: true } },
              members: {
                where: { isActive: true },
                select: { id: true, fullName: true, email: true, role: true },
                orderBy: { fullName: "asc" },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell pageTitle="Organigramme">
      <OrgChartView departments={departments} />
    </AppShell>
  );
}
