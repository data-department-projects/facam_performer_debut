"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createPlannerSchema,
  addTaskSchema,
  deleteTaskSchema,
  submitPlannerSchema,
  validatePlannerSchema,
} from "@/lib/schemas/weekPlanner";
import type { PlannedDay, TaskStatus } from "@/app/generated/prisma/client";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createWeekPlanner(
  weekStartDate: string,
): Promise<ActionResult<{ id: string; weekStartDate: Date; weekEndDate: Date; status: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  const parsed = createPlannerSchema.safeParse({ weekStartDate });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const [y, mo, dy] = parsed.data.weekStartDate.split("-").map(Number);
    const start = new Date(Date.UTC(y, mo - 1, dy));
    const end = new Date(Date.UTC(y, mo - 1, dy + 4));

    const planner = await prisma.weekPlanner.create({
      data: {
        userId: session.user.id,
        weekStartDate: start,
        weekEndDate: end,
        status: "DRAFT",
      },
      select: { id: true, weekStartDate: true, weekEndDate: true, status: true },
    });

    revalidatePath("/week-planner");
    return { success: true, data: planner };
  } catch (error) {
    console.error("[createWeekPlanner]", error);
    return { success: false, error: "Impossible de créer le planning" };
  }
}

export async function addWeekPlannerTask(input: {
  plannerId: string;
  title: string;
  plannedDay: PlannedDay;
  projectId?: string | null;
}): Promise<ActionResult<{ id: string; title: string; plannedDay: PlannedDay; status: TaskStatus; comment: string | null; isLocked: boolean; project: { id: string; name: string; code: string } | null }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  const parsed = addTaskSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const planner = await prisma.weekPlanner.findUnique({
      where: { id: parsed.data.plannerId },
      select: { userId: true, status: true },
    });

    if (!planner) return { success: false, error: "Planning introuvable" };
    if (planner.userId !== session.user.id) return { success: false, error: "Accès non autorisé" };
    if (planner.status !== "DRAFT") return { success: false, error: "Le planning n'est plus modifiable" };

    const task = await prisma.weekPlannerTask.create({
      data: {
        weekPlannerId: parsed.data.plannerId,
        title: parsed.data.title,
        plannedDay: parsed.data.plannedDay,
        projectId: parsed.data.projectId ?? null,
        status: "STARTED",
      },
      select: {
        id: true,
        title: true,
        plannedDay: true,
        status: true,
        comment: true,
        isLocked: true,
        project: { select: { id: true, name: true, code: true } },
      },
    });

    return { success: true, data: task };
  } catch (error) {
    console.error("[addWeekPlannerTask]", error);
    return { success: false, error: "Impossible d'ajouter la tâche" };
  }
}

export async function deleteWeekPlannerTask(
  taskId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  const parsed = deleteTaskSchema.safeParse({ taskId });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const task = await prisma.weekPlannerTask.findUnique({
      where: { id: parsed.data.taskId },
      select: { weekPlanner: { select: { userId: true, status: true } } },
    });

    if (!task) return { success: false, error: "Tâche introuvable" };
    if (task.weekPlanner.userId !== session.user.id) return { success: false, error: "Accès non autorisé" };
    if (task.weekPlanner.status !== "DRAFT") return { success: false, error: "Le planning n'est plus modifiable" };

    await prisma.weekPlannerTask.delete({ where: { id: parsed.data.taskId } });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteWeekPlannerTask]", error);
    return { success: false, error: "Impossible de supprimer la tâche" };
  }
}

export async function validateWeekPlanner(
  plannerId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  const role = session.user.role;
  if (role !== "MANAGER" && role !== "ADMIN") {
    return { success: false, error: "Accès non autorisé" };
  }

  const parsed = validatePlannerSchema.safeParse({ plannerId });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const planner = await prisma.weekPlanner.findUnique({
      where: { id: parsed.data.plannerId },
      select: {
        status: true,
        user: { select: { role: true, departmentId: true } },
      },
    });

    if (!planner) return { success: false, error: "Planning introuvable" };
    if (planner.status !== "SUBMITTED") return { success: false, error: "Le planning n'est pas en attente de validation" };

    if (role === "MANAGER") {
      if (!["COLLABORATOR", "INTERN"].includes(planner.user.role)) {
        return { success: false, error: "Vous ne pouvez valider que les planners de collaborateurs et stagiaires" };
      }
      if (
        !session.user.departmentId ||
        !planner.user.departmentId ||
        planner.user.departmentId !== session.user.departmentId
      ) {
        return { success: false, error: "Ce planning n'appartient pas à votre département" };
      }
    }

    if (role === "ADMIN") {
      if (planner.user.role !== "MANAGER") {
        return { success: false, error: "L'Admin valide uniquement les planners des Managers" };
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.weekPlanner.update({
        where: { id: parsed.data.plannerId },
        data: {
          status: "VALIDATED",
          validatedById: session.user.id,
          validatedAt: new Date(),
        },
      });
      await tx.weekPlannerTask.updateMany({
        where: { weekPlannerId: parsed.data.plannerId },
        data: { isLocked: true },
      });
    });

    revalidatePath("/week-planner");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[validateWeekPlanner]", error);
    return { success: false, error: "Impossible de valider le planning" };
  }
}

export async function submitWeekPlanner(
  plannerId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  if (session.user.role === "ADMIN") {
    return { success: false, error: "Les administrateurs ne soumettent pas de planning." };
  }

  const parsed = submitPlannerSchema.safeParse({ plannerId });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const planner = await prisma.weekPlanner.findUnique({
      where: { id: parsed.data.plannerId },
      select: { userId: true, status: true },
    });

    if (!planner) return { success: false, error: "Planning introuvable" };
    if (planner.userId !== session.user.id) return { success: false, error: "Accès non autorisé" };
    if (planner.status !== "DRAFT") return { success: false, error: "Le planning a déjà été soumis" };

    await prisma.weekPlanner.update({
      where: { id: parsed.data.plannerId },
      data: { status: "SUBMITTED" },
    });

    revalidatePath("/week-planner");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[submitWeekPlanner]", error);
    return { success: false, error: "Impossible de soumettre le planning" };
  }
}
