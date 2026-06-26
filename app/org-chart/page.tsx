import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { OrgTree } from "@/components/org-chart/OrgTree";
import { OrgChartView } from "@/components/org-chart/OrgChartView";
import { AppShell } from "@/components/layout/AppShell";
import type { Role } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

// ── Types partagés ────────────────────────────────────────────────────────────

export type OrgUser = { id: string; fullName: string; email: string; role: string };
export type OrgTeam = {
  id: string;
  name: string;
  subDepartmentId: string;
  manager: OrgUser | null;
  members: OrgUser[];
};
export type OrgSubDept = { id: string; name: string; departmentId: string; teams: OrgTeam[] };

export type OrgDeptNode = {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  subDepartments: OrgSubDept[];
  children: OrgDeptNode[];
};

export type OrgDeptFlat = {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  parentName: string | null;
  users: OrgUser[];
  subDepartments: OrgSubDept[];
};

// ── Construction de l'arbre depuis une liste plate ────────────────────────────

function buildDeptTree(depts: Omit<OrgDeptNode, "children">[]): OrgDeptNode[] {
  const map = new Map<string, OrgDeptNode>(
    depts.map((d) => [d.id, { ...d, children: [] }]),
  );
  const roots: OrgDeptNode[] = [];

  for (const node of map.values()) {
    if (node.parentDepartmentId) {
      map.get(node.parentDepartmentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Tri alphabétique des enfants à chaque niveau
  function sortNode(node: OrgDeptNode) {
    node.children.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    node.children.forEach(sortNode);
  }
  roots.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  roots.forEach(sortNode);

  return roots;
}

// ── Requête commune ───────────────────────────────────────────────────────────

const deptInclude = {
  users: {
    where: { isActive: true },
    select: { id: true, fullName: true, email: true, role: true },
    orderBy: { fullName: "asc" as const },
  },
  subDepartments: {
    include: {
      teams: {
        include: {
          manager: { select: { id: true, fullName: true, email: true, role: true } },
          members: {
            select: { id: true, fullName: true, email: true, role: true },
            where: { isActive: true },
            orderBy: { fullName: "asc" as const },
          },
        },
        orderBy: { name: "asc" as const },
      },
    },
    orderBy: { name: "asc" as const },
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function OrgChartPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  const isAdmin = role === "ADMIN";

  if (isAdmin) {
    const [rawDepts, allUsers] = await Promise.all([
      prisma.department.findMany({
        include: deptInclude,
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true, role: true },
        orderBy: { fullName: "asc" },
      }),
    ]);

    // Arbre pour OrgTree (hiérarchie complète)
    const deptTree = buildDeptTree(
      rawDepts.map((d) => ({
        id: d.id,
        name: d.name,
        parentDepartmentId: d.parentDepartmentId,
        subDepartments: d.subDepartments.map((sd) => ({
          id: sd.id,
          name: sd.name,
          departmentId: sd.departmentId,
          teams: sd.teams.map((t) => ({
            id: t.id,
            name: t.name,
            subDepartmentId: t.subDepartmentId,
            manager: t.manager
              ? { id: t.manager.id, fullName: t.manager.fullName, email: t.manager.email, role: t.manager.role }
              : null,
            members: t.members,
          })),
        })),
      })),
    );

    // Liste plate pour l'annuaire (OrgChartView) — avec nom du parent
    const parentNameMap = new Map(rawDepts.map((d) => [d.id, d.name]));
    const deptFlat: OrgDeptFlat[] = rawDepts.map((d) => ({
      id: d.id,
      name: d.name,
      parentDepartmentId: d.parentDepartmentId,
      parentName: d.parentDepartmentId ? (parentNameMap.get(d.parentDepartmentId) ?? null) : null,
      users: d.users,
      subDepartments: d.subDepartments.map((sd) => ({
        id: sd.id,
        name: sd.name,
        departmentId: sd.departmentId,
        teams: sd.teams.map((t) => ({
          id: t.id,
          name: t.name,
          subDepartmentId: t.subDepartmentId,
          manager: t.manager
            ? { id: t.manager.id, fullName: t.manager.fullName, email: t.manager.email, role: t.manager.role }
            : null,
          members: t.members,
        })),
      })),
    }));

    // Liste plate de tous les depts pour le sélecteur du modal
    const allDepts = rawDepts.map((d) => ({ id: d.id, name: d.name, parentDepartmentId: d.parentDepartmentId }));

    return (
      <AppShell pageTitle="Organigramme">
        <div className="flex flex-col gap-12">
          {/* Section 1 — Arbre de gestion (CRUD) */}
          <OrgTree deptTree={deptTree} allDepts={allDepts} allUsers={allUsers} isAdmin={true} />

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

            <OrgChartView departments={deptFlat} />
          </div>
        </div>
      </AppShell>
    );
  }

  // Non-Admin : restreint au propre département de l'utilisateur
  const userDepartmentId = session.user.departmentId;
  if (!userDepartmentId) redirect("/dashboard");

  const rawDepts = await prisma.department.findMany({
    where: { id: userDepartmentId },
    include: deptInclude,
    orderBy: { name: "asc" },
  });

  const deptFlat: OrgDeptFlat[] = rawDepts.map((d) => ({
    id: d.id,
    name: d.name,
    parentDepartmentId: d.parentDepartmentId,
    parentName: null,
    users: d.users,
    subDepartments: d.subDepartments.map((sd) => ({
      id: sd.id,
      name: sd.name,
      departmentId: sd.departmentId,
      teams: sd.teams.map((t) => ({
        id: t.id,
        name: t.name,
        subDepartmentId: t.subDepartmentId,
        manager: t.manager
          ? { id: t.manager.id, fullName: t.manager.fullName, email: t.manager.email, role: t.manager.role }
          : null,
        members: t.members,
      })),
    })),
  }));

  return (
    <AppShell pageTitle="Organigramme">
      <OrgChartView departments={deptFlat} />
    </AppShell>
  );
}
