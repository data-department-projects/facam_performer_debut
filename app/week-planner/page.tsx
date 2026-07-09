import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { CollaboratorWeekPlannerView } from "@/components/week-planner/CollaboratorWeekPlannerView";
import { ManagerWeekPlannerFullView } from "@/components/week-planner/ManagerWeekPlannerFullView";
import { AdminWeekPlannerView } from "@/components/week-planner/AdminWeekPlannerView";
import { EmptyWeekView } from "@/components/week-planner/EmptyWeekView";
import type { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const ts = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff);
  return new Date(ts).toISOString().split("T")[0];
}

function formatWeekLabel(weekStartDate: string): string {
  const monday = new Date(weekStartDate + "T00:00:00");
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return `${monday.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} — ${friday.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`;
}

// Planning + tâches sélectionnables de l'utilisateur connecté — même requête que l'Admin
// soit pour son propre planning, soit pour un Manager/Collaborateur.
async function getOwnPlannerBundle(userId: string, weekStart: Date, projectsWhere: Prisma.ProjectWhereInput) {
  const [confirmedProjects, rawPlanner, assignedGanttTasks, myAssignedTasksRaw, myPersonalTasks] = await Promise.all([
    prisma.project.findMany({
      where: projectsWhere,
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.weekPlanner.findFirst({
      where: { userId, weekStartDate: weekStart },
      select: {
        id: true,
        weekStartDate: true,
        status: true,
        tasks: {
          select: {
            id: true,
            title: true,
            plannedDay: true,
            status: true,
            comment: true,
            deliverableUrl: true,
            isLocked: true,
            project: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.ganttTask.findMany({
      where: {
        responsibleUserId: userId,
        project: { isConfirmed: true },
        status: { notIn: ["DONE", "BLOCKED"] },
      },
      select: { id: true, title: true, projectId: true },
      orderBy: { title: "asc" },
    }),
    prisma.assignedTaskAssignee.findMany({
      where: { userId },
      select: { assignedTask: { select: { id: true, title: true } } },
      orderBy: { assignedTask: { createdAt: "desc" } },
    }),
    prisma.personalTask.findMany({
      where: { userId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    confirmedProjects,
    rawPlanner,
    assignedGanttTasks,
    myAssignedTasks: myAssignedTasksRaw.map((a) => a.assignedTask),
    myPersonalTasks,
  };
}

// Membres d'une équipe (Managers pour l'Admin, Collaborateurs/Stagiaires pour un Manager)
// avec leur planning de la semaine affichée, prêts pour l'affichage (initiales incluses).
async function getTeamMembersForView(where: Prisma.UserWhereInput, weekStart: Date, weekStartDate: string) {
  const members = await prisma.user.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      weekPlanners: {
        where: { weekStartDate: weekStart },
        select: {
          id: true,
          status: true,
          tasks: { select: { id: true, title: true, plannedDay: true, status: true } },
        },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });

  return members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    initials: m.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    weekPlanner: m.weekPlanners[0]
      ? {
          id: m.weekPlanners[0].id,
          status: m.weekPlanners[0].status as "DRAFT" | "SUBMITTED" | "VALIDATED",
          weekStartDate,
          tasks: m.weekPlanners[0].tasks,
        }
      : { id: "", status: "DRAFT" as const, weekStartDate },
  }));
}

type SearchParams = Promise<{ week?: string }>;

export default async function WeekPlannerPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { week } = await searchParams;
  const weekStartDate = (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) ? week : getCurrentWeekMonday();

  const weekStart = new Date(weekStartDate + "T00:00:00");

  const userId = session.user.id;
  const role = session.user.role;

  if (role === "ADMIN") {
    const [managersForView, ownBundle] = await Promise.all([
      getTeamMembersForView({ role: "MANAGER", isActive: true }, weekStart, weekStartDate),
      getOwnPlannerBundle(userId, weekStart, { isConfirmed: true }),
    ]);
    const { confirmedProjects, rawPlanner: rawAdminPlanner, assignedGanttTasks, myAssignedTasks, myPersonalTasks } = ownBundle;

    const weekLabel = formatWeekLabel(weekStartDate);

    return (
      <AppShell pageTitle="Week Planner">
        <AdminWeekPlannerView
          managers={managersForView}
          ownPlanner={
            rawAdminPlanner
              ? {
                  id: rawAdminPlanner.id,
                  weekStartDate: rawAdminPlanner.weekStartDate,
                  status: rawAdminPlanner.status as "DRAFT" | "SUBMITTED" | "VALIDATED",
                  tasks: rawAdminPlanner.tasks,
                }
              : null
          }
          confirmedProjects={confirmedProjects}
          assignedGanttTasks={assignedGanttTasks}
          myAssignedTasks={myAssignedTasks}
          myPersonalTasks={myPersonalTasks}
          weekStartDate={weekStartDate}
          weekLabel={weekLabel}
        />
      </AppShell>
    );
  }

  const { confirmedProjects, rawPlanner, assignedGanttTasks, myAssignedTasks, myPersonalTasks } = await getOwnPlannerBundle(
    userId,
    weekStart,
    { isConfirmed: true, OR: [{ projectManagerId: userId }, { teamMembers: { some: { userId } } }] },
  );

  const weekLabel = formatWeekLabel(weekStartDate);

  if (role === "MANAGER") {
    if (!session.user.departmentId) redirect("/dashboard");

    const membersForView = await getTeamMembersForView(
      { role: { in: ["COLLABORATOR", "INTERN"] }, isActive: true, departmentId: session.user.departmentId },
      weekStart,
      weekStartDate,
    );

    return (
      <AppShell pageTitle="Week Planner">
        <ManagerWeekPlannerFullView
          key={weekStartDate}
          ownPlanner={
            rawPlanner
              ? {
                  id: rawPlanner.id,
                  weekStartDate: rawPlanner.weekStartDate,
                  status: rawPlanner.status as "DRAFT" | "SUBMITTED" | "VALIDATED",
                  tasks: rawPlanner.tasks,
                }
              : null
          }
          confirmedProjects={confirmedProjects}
          assignedGanttTasks={assignedGanttTasks}
          myAssignedTasks={myAssignedTasks}
          myPersonalTasks={myPersonalTasks}
          weekStartDate={weekStartDate}
          weekLabel={weekLabel}
          teamMembers={membersForView}
        />
      </AppShell>
    );
  }

  if (!rawPlanner) {
    return (
      <AppShell pageTitle="Week Planner">
        <EmptyWeekView weekStartDate={weekStartDate} weekLabel={weekLabel} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Week Planner">
      <CollaboratorWeekPlannerView
        key={weekStartDate}
        planner={{
          id: rawPlanner.id,
          weekStartDate: rawPlanner.weekStartDate,
          status: rawPlanner.status as "DRAFT" | "SUBMITTED" | "VALIDATED",
          tasks: rawPlanner.tasks,
        }}
        confirmedProjects={confirmedProjects}
        assignedGanttTasks={assignedGanttTasks}
        myAssignedTasks={myAssignedTasks}
        myPersonalTasks={myPersonalTasks}
        weekStartDate={weekStartDate}
      />
    </AppShell>
  );
}
