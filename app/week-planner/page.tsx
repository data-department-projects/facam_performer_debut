import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { CollaboratorWeekPlannerView } from "@/components/week-planner/CollaboratorWeekPlannerView";
import { ManagerWeekPlannerFullView } from "@/components/week-planner/ManagerWeekPlannerFullView";
import { AdminWeekPlannerView } from "@/components/week-planner/AdminWeekPlannerView";
import { EmptyWeekView } from "@/components/week-planner/EmptyWeekView";

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
    const [managers, rawAdminPlanner, adminProjects, adminGanttTasks] = await Promise.all([
      prisma.user.findMany({
        where: { role: "MANAGER", isActive: true },
        select: {
          id: true,
          fullName: true,
          weekPlanners: {
            where: { weekStartDate: weekStart },
            select: { id: true, status: true, weekStartDate: true },
            take: 1,
          },
        },
        orderBy: { fullName: "asc" },
      }),
      // Propre planning de l'Admin
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
              isLocked: true,
              project: { select: { id: true, name: true, code: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      // Tous les projets confirmés accessibles à l'Admin
      prisma.project.findMany({
        where: { isConfirmed: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
      // Tâches Gantt assignées à l'Admin
      prisma.ganttTask.findMany({
        where: {
          responsibleUserId: userId,
          project: { isConfirmed: true },
          status: { notIn: ["DONE", "BLOCKED"] },
        },
        select: { id: true, title: true, projectId: true },
        orderBy: { title: "asc" },
      }),
    ]);

    const managersForView = managers.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      initials: m.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      weekPlanner: m.weekPlanners[0]
        ? {
            id: m.weekPlanners[0].id,
            status: m.weekPlanners[0].status as "DRAFT" | "SUBMITTED" | "VALIDATED",
            weekStartDate: weekStartDate,
          }
        : { id: "", status: "DRAFT" as const, weekStartDate },
    }));

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
          confirmedProjects={adminProjects}
          assignedGanttTasks={adminGanttTasks}
          weekStartDate={weekStartDate}
          weekLabel={weekLabel}
        />
      </AppShell>
    );
  }

  const [confirmedProjects, rawPlanner, assignedGanttTasks] = await Promise.all([
    prisma.project.findMany({
      where: {
        isConfirmed: true,
        OR: [
          { projectManagerId: userId },
          { teamMembers: { some: { userId } } },
        ],
      },
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
  ]);

  const weekLabel = formatWeekLabel(weekStartDate);

  if (role === "MANAGER") {
    if (!session.user.departmentId) redirect("/dashboard");

    const teamMembers = await prisma.user.findMany({
      where: {
        role: { in: ["COLLABORATOR", "INTERN"] },
        isActive: true,
        departmentId: session.user.departmentId,
      },
      select: {
        id: true,
        fullName: true,
        weekPlanners: {
          where: { weekStartDate: weekStart },
          select: { id: true, status: true },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
    });

    const membersForView = teamMembers.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      initials: m.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      weekPlanner: m.weekPlanners[0]
        ? {
            id: m.weekPlanners[0].id,
            status: m.weekPlanners[0].status as "DRAFT" | "SUBMITTED" | "VALIDATED",
            weekStartDate,
          }
        : { id: "", status: "DRAFT" as const, weekStartDate },
    }));

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
        weekStartDate={weekStartDate}
      />
    </AppShell>
  );
}
