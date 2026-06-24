import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const departments = await prisma.department.findMany({
      include: {
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
    });

    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, role: true },
      orderBy: { fullName: "asc" },
    });

    return <OrgTree departments={departments} allUsers={allUsers} isAdmin={true} />;
  }

  // Non-Admin: fetch all departments with ALL their users (via direct departmentId relation)
  // + team structure for hierarchy (who manages whom)
  const departments = await prisma.department.findMany({
    include: {
      // ALL active people in this department
      users: {
        where: { isActive: true },
        select: { id: true, fullName: true, email: true, role: true },
        orderBy: { fullName: "asc" },
      },
      // Team structure — used only to build manager→members relationships
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
