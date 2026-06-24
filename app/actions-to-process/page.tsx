import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { ActionsToProcessView } from "@/components/actions-to-process/ActionsToProcessView";
import type { ActionsToProcessData } from "@/components/actions-to-process/types";

export const dynamic = "force-dynamic";

export default async function ActionsToProcessPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId, departmentId } = session.user;

  if (role !== "ADMIN" && role !== "MANAGER") redirect("/dashboard");

  // Guard: un Manager sans département ne peut pas filtrer — évite un scope leak Prisma
  // (Prisma ignore silencieusement les champs `undefined` dans un where, ce qui supprimerait
  // le filtre département et retournerait toutes les actions de l'organisation)
  if (role === "MANAGER" && !departmentId) redirect("/dashboard");

  // Minuit UTC — cohérent avec la façon dont dueDate est stocké (Date.UTC dans actions/committees.ts)
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // 3 requêtes indépendantes exécutées en parallèle
  const [rawProjects, rawPlanners, rawActions] = await Promise.all([
    role === "ADMIN"
      ? prisma.project.findMany({
          where: { isConfirmed: false },
          include: { projectManager: { select: { fullName: true } } },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),

    prisma.weekPlanner.findMany({
      where: {
        status: "SUBMITTED",
        ...(role === "MANAGER"
          ? { user: { team: { managerId: userId } } }
          : {}),
      },
      include: {
        user: { select: { fullName: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "asc" },
    }),

    prisma.committeeAction.findMany({
      where: {
        status: "PENDING",
        dueDate: { lt: today },
        ...(role === "MANAGER"
          ? { responsible: { departmentId: departmentId! } }
          : {}),
      },
      include: {
        meeting: { include: { committee: { select: { name: true } } } },
        responsible: { select: { fullName: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const data: ActionsToProcessData = {
    pendingProjects: rawProjects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      strategicPriority: p.strategicPriority,
      managerName: p.projectManager.fullName,
      createdAt: p.createdAt.toISOString().slice(0, 10),
    })),
    pendingWeekPlanners: rawPlanners.map((wp) => ({
      id: wp.id,
      collaboratorName: wp.user.fullName,
      weekStartDate: wp.weekStartDate.toISOString().slice(0, 10),
      weekEndDate: wp.weekEndDate.toISOString().slice(0, 10),
      taskCount: wp._count.tasks,
      submittedAt: wp.createdAt.toISOString().slice(0, 10),
    })),
    overdueActions: rawActions.map((a) => ({
      id: a.id,
      title: a.title,
      committeeName: a.meeting.committee.name,
      responsibleName: a.responsible.fullName,
      dueDate: a.dueDate.toISOString().slice(0, 10),
      overdueDays: Math.max(
        0,
        Math.floor((today.getTime() - a.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      ),
    })),
  };

  return (
    <AppShell pageTitle="Actions à traiter">
      <ActionsToProcessView role={role} data={data} />
    </AppShell>
  );
}
