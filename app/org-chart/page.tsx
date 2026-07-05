import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrgHierarchyView, type HierarchyUser, type DeptTreeNode } from "@/components/org-chart/OrgHierarchyView";
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
  responsableId: string | null;
  responsableName: string | null;
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
  responsable: { select: { id: true, fullName: true, email: true, role: true } },
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

  const [rawDepts, activeUsers] = await Promise.all([
    prisma.department.findMany({
      include: deptInclude,
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, email: true, role: true, departmentId: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  // ── Données pour le drawer admin (CRUD) ──────────────────────────────────

  const deptTree = buildDeptTree(
    rawDepts.map((d) => ({
      id: d.id,
      name: d.name,
      parentDepartmentId: d.parentDepartmentId,
      responsableId: d.responsableId,
      responsableName: d.responsable?.fullName ?? null,
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
    responsableId: d.responsableId,
    color: d.color,
  }));

  // ── Données pour la vue hiérarchique (contenu principal) ─────────────────
  // Département → sous-département (département enfant) → responsable → collaborateurs directs

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

  function buildHierarchyTree(): DeptTreeNode[] {
    const map = new Map<string, DeptTreeNode>();
    for (const d of rawDepts) {
      map.set(d.id, {
        id: d.id,
        name: d.name,
        color: d.color,
        responsable: d.responsable
          ? toHierarchyUser({ ...d.responsable, departmentId: d.id })
          : null,
        directUsers: d.users
          .filter((u) => u.id !== d.responsableId)
          .map((u) => toHierarchyUser({ ...u, departmentId: d.id })),
        children: [],
      });
    }

    const roots: DeptTreeNode[] = [];
    for (const d of rawDepts) {
      const node = map.get(d.id)!;
      if (d.parentDepartmentId) {
        map.get(d.parentDepartmentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    function sortNode(node: DeptTreeNode) {
      node.children.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      node.children.forEach(sortNode);
    }
    roots.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    roots.forEach(sortNode);

    return roots;
  }

  const hierarchyTree = buildHierarchyTree();

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
        <OrgHierarchyView deptTree={hierarchyTree} legend={legend} />
      </div>
    </AppShell>
  );
}
