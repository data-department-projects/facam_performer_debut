"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  updateTaskExecutionSchema,
  addUnplannedTaskSchema,
} from "@/lib/schemas/weekPlanner";
import type { PlannedDay } from "@/app/generated/prisma/client";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function getCurrentWeekMondayUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
}

// Renvoie null le week-end : aucune tâche du jour / saisie possible hors jours ouvrés.
function getTodayPlannedDay(): PlannedDay | null {
  const map: Record<number, PlannedDay | null> = {
    0: null,
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
    6: null,
  };
  return map[new Date().getUTCDay()];
}

// Règle 9 : l'exécution quotidienne (tâche du jour, tâche non planifiée) n'est
// possible que sur la semaine en cours déjà validée par l'Administrateur.
async function requireValidatedCurrentWeekPlanner(
  userId: string,
): Promise<{ id: string } | { error: string }> {
  const weekPlanner = await prisma.weekPlanner.findUnique({
    where: {
      userId_weekStartDate: { userId, weekStartDate: getCurrentWeekMondayUTC() },
    },
    select: { id: true, status: true },
  });
  if (!weekPlanner) return { error: "Aucun planning de semaine en cours." };
  if (weekPlanner.status !== "VALIDATED") {
    return { error: "La semaine n'est pas encore validée." };
  }
  return { id: weekPlanner.id };
}

export async function updateTaskExecution(input: {
  taskId: string;
  status: "STARTED" | "IN_PROGRESS" | "DONE" | "NOT_DONE";
  hoursSpent: number | null;
  comment: string;
  deliverableUrl?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  const role = session.user.role;
  if (role !== "COLLABORATOR" && role !== "INTERN" && role !== "MANAGER") {
    return { success: false, error: "Accès non autorisé" };
  }

  const parsed = updateTaskExecutionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { taskId, status, hoursSpent, comment, deliverableUrl } = parsed.data;

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
        data: {
          status,
          comment: comment.trim() || null,
          deliverableUrl: deliverableUrl || null,
        },
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

// Le collaborateur choisit, parmi les tâches indépendantes qui lui sont assignées,
// celle sur laquelle il travaille aujourd'hui — crée une WeekPlannerTask du jour liée.
// Comme le reste de l'exécution quotidienne (Règle 9), n'est possible que sur une
// semaine déjà validée — jamais sur une semaine en brouillon ou en attente de validation.
export async function setTaskOfTheDay(
  assignedTaskId: string,
): Promise<ActionResult<{ weekPlannerTaskId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };
  if (
    session.user.role !== "COLLABORATOR" &&
    session.user.role !== "INTERN" &&
    session.user.role !== "MANAGER"
  ) {
    return { success: false, error: "Accès non autorisé" };
  }

  const today = getTodayPlannedDay();
  if (!today) return { success: false, error: "Pas de tâche du jour le week-end." };

  try {
    const assignment = await prisma.assignedTaskAssignee.findFirst({
      where: { assignedTaskId, userId: session.user.id },
      select: { assignedTask: { select: { title: true } } },
    });
    if (!assignment) return { success: false, error: "Cette tâche ne vous est pas assignée." };

    const weekPlanner = await requireValidatedCurrentWeekPlanner(session.user.id);
    if ("error" in weekPlanner) return { success: false, error: weekPlanner.error };

    const alreadyAdded = await prisma.weekPlannerTask.findFirst({
      where: { weekPlannerId: weekPlanner.id, assignedTaskId },
      select: { id: true },
    });
    if (alreadyAdded) {
      return { success: false, error: "Cette tâche a déjà été ajoutée à votre planning cette semaine." };
    }

    const task = await prisma.weekPlannerTask.create({
      data: {
        weekPlannerId: weekPlanner.id,
        assignedTaskId,
        title: assignment.assignedTask.title,
        plannedDay: today,
        status: "STARTED",
        isLocked: true,
      },
      select: { id: true },
    });

    revalidatePath("/week-planner");
    return { success: true, data: { weekPlannerTaskId: task.id } };
  } catch (error) {
    console.error("[dailyExecution] setTaskOfTheDay", error);
    return { success: false, error: "Impossible de définir la tâche du jour." };
  }
}

// Permet au collaborateur de renseigner une tâche réalisée dans la journée mais non
// planifiée à l'avance (ni projet, ni tâche assignée) — comme le reste de l'exécution
// quotidienne (Règle 9), uniquement sur une semaine déjà validée ; la tâche est créée
// directement verrouillée car ce n'est pas une correction du plan, juste un constat.
export async function addUnplannedCompletedTask(
  rawInput: unknown,
): Promise<ActionResult<{ weekPlannerTaskId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };
  if (session.user.role !== "COLLABORATOR" && session.user.role !== "INTERN") {
    return { success: false, error: "Accès non autorisé" };
  }

  const parsed = addUnplannedTaskSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const today = getTodayPlannedDay();
  if (!today) return { success: false, error: "Pas de saisie possible le week-end." };

  try {
    const weekPlanner = await requireValidatedCurrentWeekPlanner(session.user.id);
    if ("error" in weekPlanner) return { success: false, error: weekPlanner.error };

    const task = await prisma.weekPlannerTask.create({
      data: {
        weekPlannerId: weekPlanner.id,
        title: parsed.data.title,
        plannedDay: today,
        status: "DONE",
        deliverableUrl: parsed.data.deliverableUrl || null,
        isLocked: true,
      },
      select: { id: true },
    });

    revalidatePath("/week-planner");
    return { success: true, data: { weekPlannerTaskId: task.id } };
  } catch (error) {
    console.error("[dailyExecution] addUnplannedCompletedTask", error);
    return { success: false, error: "Impossible d'ajouter la tâche." };
  }
}
