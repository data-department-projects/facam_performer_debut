import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrgHierarchyView, type HierarchyUser, type ManagerGroup } from "@/components/org-chart/OrgHierarchyView";
import { OrgStructureDrawer } from "@/components/org-chart/OrgStructureDrawer";
import { AppShell } from "@/components/layout/AppShell";
import type { Role } from "@/app/generated/prisma/client";
import type { DepartmentColorValue } from "@/lib/department-colors";

export const dynamic = "force-dynamic";

// ── Types partagés (drawer admin / CRUD) ──────────────────────────────────────

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
  color: DepartmentColorValue | null;
  users: OrgUser[];
  subDepartments: OrgSubDept[];
  children: OrgDeptNode[];
};

// ── Construction de l'arbre depuis une liste plate (drawer admin) ────────────

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

  function sortNode(node: OrgDeptNode) {
    node.children.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    node.children.forEach(sortNode);
  }
  roots.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  roots.forEach(sortNode);

  return roots;
}

// ── Résolution de la couleur héritée (département → parent → …) ─────────────

type FlatDept = { id: string; name: string; parentDepartmentId: string | null; color: DepartmentColorValue | null };

function resolveColor(deptId: string, depts: Map<string, FlatDept>): DepartmentColorValue | null {
  let current = depts.get(deptId);
  let guard = 0;
  while (current && guard < 20) {
    if (current.color) return current.color;
    current = current.parentDepartmentId ? depts.get(current.parentDepartmentId) : undefined;
    guard += 1;
  }
  return null;
}

// ── Requête Prisma (drawer admin) ─────────────────────────────────────────────

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

  const [rawDepts, activeUsers, teams] = await Promise.all([
    prisma.department.findMany({
      include: deptInclude,
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, email: true, role: true, departmentId: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.team.findMany({
      select: {
        managerId: true,
        members: {
          where: { isActive: true },
          select: { id: true, fullName: true, email: true, role: true, departmentId: true },
        },
      },
    }),
  ]);

  // ── Données pour le drawer admin (CRUD) ──────────────────────────────────

  const deptTree = buildDeptTree(
    rawDepts.map((d) => ({
      id: d.id,
      name: d.name,
      parentDepartmentId: d.parentDepartmentId,
      color: d.color,
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
    })),
  );

  const allDepts = rawDepts.map((d) => ({
    id: d.id,
    name: d.name,
    parentDepartmentId: d.parentDepartmentId,
    color: d.color,
  }));

  // ── Données pour la vue hiérarchique (contenu principal) ─────────────────

  const flatDepts = new Map<string, FlatDept>(
    rawDepts.map((d) => [d.id, { id: d.id, name: d.name, parentDepartmentId: d.parentDepartmentId, color: d.color }]),
  );
  const deptNameById = new Map(rawDepts.map((d) => [d.id, d.name]));

  function toHierarchyUser(u: { id: string; fullName: string; email: string; role: string; departmentId: string }): HierarchyUser {
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      departmentName: deptNameById.get(u.departmentId) ?? "—",
      color: resolveColor(u.departmentId, flatDepts),
    };
  }

  const admins = activeUsers.filter((u) => u.role === "ADMIN").map(toHierarchyUser);
  const managers = activeUsers.filter((u) => u.role === "MANAGER");

  const reportsByManagerId = new Map<string, HierarchyUser[]>();
  const assignedIds = new Set<string>();

  // 1) Rattachement explicite via Équipe (Team.manager → Team.members)
  for (const team of teams) {
    if (!team.managerId) continue;
    const reports = team.members.filter((m) => m.id !== team.managerId).map(toHierarchyUser);
    const existing = reportsByManagerId.get(team.managerId) ?? [];
    reportsByManagerId.set(team.managerId, [...existing, ...reports]);
    reports.forEach((r) => assignedIds.add(r.id));
  }

  // 2) Repli : rattachement direct au manager du même département quand aucune Équipe n'existe
  const firstManagerIdByDept = new Map<string, string>();
  for (const m of managers) {
    if (!firstManagerIdByDept.has(m.departmentId)) firstManagerIdByDept.set(m.departmentId, m.id);
  }
  for (const u of activeUsers) {
    if (u.role !== "COLLABORATOR" && u.role !== "INTERN") continue;
    if (assignedIds.has(u.id)) continue;
    const managerId = firstManagerIdByDept.get(u.departmentId);
    if (!managerId) continue;
    const existing = reportsByManagerId.get(managerId) ?? [];
    reportsByManagerId.set(managerId, [...existing, toHierarchyUser(u)]);
    assignedIds.add(u.id);
  }

  const managerGroups: ManagerGroup[] = managers.map((m) => ({
    manager: toHierarchyUser(m),
    reports: reportsByManagerId.get(m.id) ?? [],
  }));

  const unassigned = activeUsers
    .filter((u) => (u.role === "COLLABORATOR" || u.role === "INTERN") && !assignedIds.has(u.id))
    .map(toHierarchyUser);

  const legend = rawDepts
    .filter((d) => d.color)
    .map((d) => ({ name: d.name, color: d.color as DepartmentColorValue }));

  return (
    <AppShell pageTitle="Organigramme">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray400">
            {activeUsers.length} collaborateur{activeUsers.length !== 1 ? "s" : ""} actif{activeUsers.length !== 1 ? "s" : ""}
          </p>
          {isAdmin && (
            <OrgStructureDrawer
              deptTree={deptTree}
              allDepts={allDepts}
              allUsers={activeUsers}
            />
          )}
        </div>

        {/* Vue hiérarchique */}
        <OrgHierarchyView
          admins={admins}
          managerGroups={managerGroups}
          unassigned={unassigned}
          legend={legend}
          totalHeadcount={activeUsers.length}
        />
      </div>
    </AppShell>
  );
}
