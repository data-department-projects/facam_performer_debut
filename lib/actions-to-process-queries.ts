import { prisma } from "@/lib/prisma";
import { getTodayUtc } from "@/lib/overdue";
import { departmentMemberWhere } from "@/lib/permissions";
import type { ActionsToProcessData } from "@/components/actions-to-process/types";
import type { Role } from "@/app/generated/prisma/client";

// Réservé aux rôles ADMIN et MANAGER — appelant responsable de vérifier le rôle
// et, pour un Manager, qu'il appartient bien à un département avant d'appeler.
export async function getActionsToProcessData(
  role: "ADMIN" | "MANAGER",
  departmentId: string | null | undefined,
): Promise<ActionsToProcessData> {
  const today = getTodayUtc();

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
          ? { user: departmentMemberWhere(departmentId) }
          : { user: { role: "MANAGER" as Role } }),
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
        ...(role === "MANAGER" ? { responsible: { departmentId: departmentId! } } : {}),
      },
      include: {
        meeting: { include: { committee: { select: { name: true } } } },
        responsible: { select: { fullName: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  return {
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
}
