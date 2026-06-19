import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectList } from "@/components/projects/ProjectList";
import type { MockProject } from "@/components/projects/ProjectList";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const userId = session.user.id;

  // Collaborateur — sa vue "Mes Projets" est construite en feature 16
  if (role === "COLLABORATOR") {
    return (
      <AppShell pageTitle="Projets & Planification">
        <ProjectList projects={[]} />
      </AppShell>
    );
  }

  const include = {
    projectManager: { select: { fullName: true } },
    ganttTasks: { select: { progressPercent: true } },
  } as const;

  const dbProjects = await prisma.project.findMany({
    where:
      role === "MANAGER"
        ? {
            OR: [
              { projectManagerId: userId },
              { teamMembers: { some: { userId } } },
            ],
          }
        : {},
    include,
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

  return (
    <AppShell pageTitle="Projets & Planification">
      <ProjectList projects={projects} />
    </AppShell>
  );
}
