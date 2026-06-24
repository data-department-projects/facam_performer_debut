"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { updateTaskExecutionSchema } from "@/lib/schemas/weekPlanner";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateTaskExecution(input: {
  taskId: string;
  status: "STARTED" | "IN_PROGRESS" | "DONE" | "NOT_DONE";
  hoursSpent: number | null;
  comment: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  const role = session.user.role;
  if (role !== "COLLABORATOR" && role !== "INTERN" && role !== "MANAGER") {
    return { success: false, error: "Accès non autorisé" };
  }

  const parsed = updateTaskExecutionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { taskId, status, hoursSpent, comment } = parsed.data;

  try {
    const task = await prisma.weekPlannerTask.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        projectId: true,
        isLocked: true,
        weekPlanner: { select: { userId: true, status: true } },
      },
    });

    if (!task) return { success: false, error: "Tâche introuvable" };
    if (task.weekPlanner.userId !== session.user.id) return { success: false, error: "Accès non autorisé" };
    if (task.weekPlanner.status !== "VALIDATED") return { success: false, error: "La semaine n'est pas encore validée" };

    const today = new Date();
    const [y, m, d] = today.toISOString().split("T")[0].split("-").map(Number);
    const todayUTC = new Date(Date.UTC(y, m - 1, d));

    await prisma.$transaction(async (tx) => {
      await tx.weekPlannerTask.update({
        where: { id: taskId },
        data: { status, comment: comment.trim() || null },
      });

      if (hoursSpent !== null) {
        const existing = await tx.timeEntry.findFirst({
          where: { userId: session.user.id, weekPlannerTaskId: taskId, date: todayUTC },
          select: { id: true },
        });

        if (hoursSpent > 0) {
          if (existing) {
            await tx.timeEntry.update({
              where: { id: existing.id },
              data: { hoursSpent, activityLabel: task.title },
            });
          } else {
            await tx.timeEntry.create({
              data: {
                userId: session.user.id,
                weekPlannerTaskId: taskId,
                date: todayUTC,
                hoursSpent,
                activityLabel: task.title,
              },
            });
          }
        } else if (existing) {
          await tx.timeEntry.delete({ where: { id: existing.id } });
        }
      }

      if (task.projectId) {
        const total = await tx.weekPlannerTask.count({
          where: {
            projectId: task.projectId,
            weekPlanner: { userId: session.user.id, status: "VALIDATED" },
          },
        });

        const done = await tx.weekPlannerTask.count({
          where: {
            projectId: task.projectId,
            status: "DONE",
            weekPlanner: { userId: session.user.id, status: "VALIDATED" },
          },
        });

        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

        await tx.ganttTask.updateMany({
          where: { projectId: task.projectId, responsibleUserId: session.user.id },
          data: { progressPercent: progress },
        });
      }
    });

    revalidatePath("/week-planner");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateTaskExecution]", error);
    return { success: false, error: "Impossible de sauvegarder l'exécution" };
  }
}
