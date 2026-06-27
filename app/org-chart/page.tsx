import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamsOrgView } from "@/components/org-chart/TeamsOrgView";
import { OrgStructureDrawer } from "@/components/org-chart/OrgStructureDrawer";
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

export type UserNode = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  departmentName: string;
  teamName: string | null;
  managerId: string | null;
  directReportIds: string[];
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

  function sortNode(node: OrgDeptNode) {
    node.children.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    node.children.forEach(sortNode);
  }
  roots.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  roots.forEach(sortNode);

  return roots;
}

// ── Requête Prisma ────────────────────────────────────────────────────────────

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

  // Tous les rôles voient toute l'organisation en lecture
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

  // ── Construction du UserNode[] flat ──────────────────────────────────────

  // Map userId → managerId (déduit de l'équipe dont l'utilisateur est membre)
  const managerOfUser = new Map<string, string>();
  // Map userId → teamName
  const teamOfUser = new Map<string, string>();
  // Map managerId → directReportIds
  const directReportsOf = new Map<string, string[]>();

  for (const dept of rawDepts) {
    for (const sd of dept.subDepartments) {
      for (const team of sd.teams) {
        for (const member of team.members) {
          if (team.manager && member.id !== team.manager.id) {
            managerOfUser.set(member.id, team.manager.id);
          }
          teamOfUser.set(member.id, team.name);
        }
        if (team.manager) {
          const existing = directReportsOf.get(team.manager.id) ?? [];
          const newReports = team.members
            .filter((m) => m.id !== team.manager!.id)
            .map((m) => m.id);
          directReportsOf.set(team.manager.id, [...new Set([...existing, ...newReports])]);
        }
      }
    }
  }

  // Map userId → departmentName
  const deptOfUser = new Map<string, string>();
  for (const dept of rawDepts) {
    for (const user of dept.users) {
      deptOfUser.set(user.id, dept.name);
    }
    for (const sd of dept.subDepartments) {
      for (const team of sd.teams) {
        for (const member of team.members) {
          if (!deptOfUser.has(member.id)) {
            deptOfUser.set(member.id, dept.name);
          }
        }
        if (team.manager && !deptOfUser.has(team.manager.id)) {
          deptOfUser.set(team.manager.id, dept.name);
        }
      }
    }
  }

  // Collecte de tous les utilisateurs uniques
  const allUsersSet = new Map<string, OrgUser>();
  for (const dept of rawDepts) {
    for (const u of dept.users) allUsersSet.set(u.id, u);
    for (const sd of dept.subDepartments) {
      for (const team of sd.teams) {
        if (team.manager) allUsersSet.set(team.manager.id, team.manager);
        for (const m of team.members) allUsersSet.set(m.id, m);
      }
    }
  }

  const userNodes: UserNode[] = Array.from(allUsersSet.values()).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    departmentName: deptOfUser.get(u.id) ?? "—",
    teamName: teamOfUser.get(u.id) ?? null,
    managerId: managerOfUser.get(u.id) ?? null,
    directReportIds: directReportsOf.get(u.id) ?? [],
  }));

  // ── Données Admin pour le drawer CRUD ────────────────────────────────────

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

  const allDepts = rawDepts.map((d) => ({
    id: d.id,
    name: d.name,
    parentDepartmentId: d.parentDepartmentId,
  }));

  return (
    <AppShell pageTitle="Organigramme">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray400">
            {userNodes.length} collaborateur{userNodes.length !== 1 ? "s" : ""} actif{userNodes.length !== 1 ? "s" : ""}
          </p>
          {isAdmin && (
            <OrgStructureDrawer
              deptTree={deptTree}
              allDepts={allDepts}
              allUsers={allUsers}
            />
          )}
        </div>

        {/* Vue Teams-style */}
        <TeamsOrgView
          userNodes={userNodes}
          currentUserId={session.user.id}
        />
      </div>
    </AppShell>
  );
}
