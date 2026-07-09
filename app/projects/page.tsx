import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import type { MockProject } from "@/components/projects/ProjectList";
import { CollaboratorProjectsView, type CollaboratorProject } from "@/components/projects/CollaboratorProjectsView";
import { ProjectPageTabs } from "@/components/projects/ProjectPageTabs";
import type { MyProjectEntry } from "@/components/projects/MyProjectTasksView";
import type { MyAssignedTask } from "@/components/projects/MyAssignedTasksSection";
import type { MyPersonalTask } from "@/components/projects/MyPersonalTasksSection";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getCurrentWeekMondayUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
}

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const userId = session.user.id;

  // ── Collaborateur / Stagiaire ──────────────────────────────────────────────
  if (role === "COLLABORATOR" || role === "INTERN") {
    const collaboratorData = await prisma.project.findMany({
      where: {
        isConfirmed: true,
        teamMembers: { some: { userId } },
      },
      select: {
        id: true,
        name: true,
        description: true,
        estimatedStartDate: true,
        targetEndDate: true,
        isConfirmed: true,
        currentStatus: true,
        projectManager: { select: { fullName: true } },
        ganttTasks: {
          where: { responsibleUserId: userId },
          select: { id: true, title: true, endDate: true, progressPercent: true, status: true },
          orderBy: { endDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projects: CollaboratorProject[] = collaboratorData.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      estimatedStartDate: p.estimatedStartDate.toISOString().split("T")[0],
      targetEndDate: p.targetEndDate.toISOString().split("T")[0],
      isConfirmed: p.isConfirmed,
      currentStatus: p.currentStatus,
      projectManager: p.projectManager,
      tasks: p.ganttTasks.map((t) => ({
        id: t.id,
        title: t.title,
        endDate: t.endDate.toISOString().split("T")[0],
        progressPercent: t.progressPercent,
        status: t.status as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
      })),
    }));

    const myAssignedTasksRaw = await prisma.assignedTaskAssignee.findMany({
      where: { userId },
      select: {
        assignedTask: {
          select: {
            id: true,
            title: true,
            description: true,
            createdBy: { select: { fullName: true } },
            weekPlannerTasks: {
              where: { weekPlanner: { userId, weekStartDate: getCurrentWeekMondayUTC() } },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { assignedTask: { createdAt: "desc" } },
    });

    const assignedTasks: MyAssignedTask[] = myAssignedTasksRaw.map((a) => ({
      id: a.assignedTask.id,
      title: a.assignedTask.title,
      description: a.assignedTask.description,
      createdByName: a.assignedTask.createdBy.fullName,
      alreadyAddedThisWeek: a.assignedTask.weekPlannerTasks.length > 0,
    }));

    const personalTasks: MyPersonalTask[] = await prisma.personalTask.findMany({
      where: { userId },
      select: { id: true, title: true, description: true },
      orderBy: { createdAt: "desc" },
    });

    return (
      <AppShell pageTitle="Mes projets et tâches">
        <CollaboratorProjectsView
          projects={projects}
          assignedTasks={assignedTasks}
          personalTasks={personalTasks}
        />
      </AppShell>
    );
  }

  // ── Admin / Manager ────────────────────────────────────────────────────────

  // Tous les projets (tab 1)
  const dbProjects = await prisma.project.findMany({
    where:
      role === "MANAGER"
        ? {
            OR: [
              { projectManagerId: userId },
              { teamMembers: { some: { userId } } },
            ],
          }
        : {}, // ADMIN voit tout
    include: {
      projectManager: { select: { fullName: true } },
      ganttTasks: { select: { progressPercent: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const projects: MockProject[] = dbProjects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    projectManager: p.projectManager.fullName,
    currentStatus: p.currentStatus,
    isConfirmed: p.isConfirmed,
    progressPercent:
      p.ganttTasks.length > 0
        ? Math.round(
            p.ganttTasks.reduce((sum, t) => sum + t.progressPercent, 0) /
              p.ganttTasks.length,
          )
        : 0,
    targetEndDate: p.targetEndDate.toISOString().split("T")[0],
  }));

  // Mes projets + mes tâches (tab 2) — projets auxquels l'utilisateur est rattaché
  const myRawProjects = await prisma.project.findMany({
    where: {
      isConfirmed: true,
      OR: [
        { projectManagerId: userId },
        { sponsorUserId: userId },
        { teamMembers: { some: { userId } } },
      ],
      ganttTasks: { some: { responsibleUserId: userId } },
    },
    select: {
      id: true,
      name: true,
      projectManagerId: true,
      ganttTasks: {
        where: { responsibleUserId: userId },
        orderBy: { endDate: "asc" },
        select: {
          id: true,
          title: true,
          status: true,
          progressPercent: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const myProjects: MyProjectEntry[] = myRawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    isManager: p.projectManagerId === userId,
    tasks: p.ganttTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      progressPercent: t.progressPercent,
      startDate: t.startDate.toISOString().split("T")[0],
      endDate: t.endDate.toISOString().split("T")[0],
    })),
  }));

  // Tâches indépendantes (tab 3, Manager uniquement) — hors de tout projet
  let assignedTasksSection;
  if (role === "MANAGER") {
    const [assignedTasksRaw, eligibleAssignees] = await Promise.all([
      prisma.assignedTask.findMany({
        where: { createdByUserId: userId },
        select: {
          id: true,
          title: true,
          description: true,
          assignees: { select: { user: { select: { id: true, fullName: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: {
          departmentId: session.user.departmentId ?? "__none__",
          role: { in: ["COLLABORATOR", "INTERN"] },
          isActive: true,
        },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
      }),
    ]);

    assignedTasksSection = {
      tasks: assignedTasksRaw.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assignees: t.assignees.map((a) => a.user),
      })),
      eligibleAssignees,
    };
  }

  const personalTasks: MyPersonalTask[] = await prisma.personalTask.findMany({
    where: { userId },
    select: { id: true, title: true, description: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell pageTitle="Projets et tâches">
      <ProjectPageTabs
        projects={projects}
        myProjects={myProjects}
        personalTasks={personalTasks}
        assignedTasksSection={assignedTasksSection}
      />
    </AppShell>
  );
}
