import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import type { MockProject } from "@/components/projects/ProjectList";
import { CollaboratorProjectsView } from "@/components/projects/CollaboratorProjectsView";
import { ProjectPageTabs } from "@/components/projects/ProjectPageTabs";
import type { MyProjectEntry } from "@/components/projects/MyProjectTasksView";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
        projectManager: { select: { fullName: true } },
        ganttTasks: {
          where: { responsibleUserId: userId },
          select: { id: true, title: true, endDate: true, progressPercent: true },
          orderBy: { endDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projects = collaboratorData.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      estimatedStartDate: p.estimatedStartDate.toISOString().split("T")[0],
      targetEndDate: p.targetEndDate.toISOString().split("T")[0],
      projectManager: p.projectManager,
    }));

    const tasks = collaboratorData.flatMap((p) =>
      p.ganttTasks.map((t) => ({
        id: t.id,
        title: t.title,
        endDate: t.endDate.toISOString().split("T")[0],
        progressPercent: t.progressPercent,
        projectName: p.name,
      })),
    );

    return (
      <AppShell pageTitle="Mes Projets">
        <CollaboratorProjectsView projects={projects} tasks={tasks} />
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

  return (
    <AppShell pageTitle="Projets">
      <ProjectPageTabs projects={projects} myProjects={myProjects} />
    </AppShell>
  );
}
