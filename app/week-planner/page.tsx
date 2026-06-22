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
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
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
  const weekStartDate = week ?? getCurrentWeekMonday();

  const weekStart = new Date(weekStartDate + "T00:00:00");

  const userId = session.user.id;
  const role = session.user.role;

  if (role === "ADMIN") {
    const managers = await prisma.user.findMany({
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
    });

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

    return (
      <AppShell pageTitle="Week Planner">
        <AdminWeekPlannerView managers={managersForView} />
      </AppShell>
    );
  }

  const confirmedProjects = await prisma.project.findMany({
    where: {
      isConfirmed: true,
      OR: [
        { projectManagerId: userId },
        { teamMembers: { some: { userId } } },
      ],
    },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  const rawPlanner = await prisma.weekPlanner.findFirst({
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
  });

  const weekLabel = formatWeekLabel(weekStartDate);

  if (role === "MANAGER") {
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
        weekStartDate={weekStartDate}
      />
    </AppShell>
  );
}
