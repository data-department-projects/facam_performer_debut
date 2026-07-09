"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createPersonalTaskSchema, updatePersonalTaskSchema } from "@/lib/schemas/personalTask";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createPersonalTask(
  rawData: unknown,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  const parsed = createPersonalTaskSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const task = await prisma.personalTask.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        userId: session.user.id,
      },
      select: { id: true },
    });

    revalidatePath("/projects");
    return { success: true, data: { id: task.id } };
  } catch (error) {
    console.error("[actions/personalTasks] createPersonalTask", error);
    return { success: false, error: "Impossible de créer la tâche." };
  }
}

export async function updatePersonalTask(id: string, rawData: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  const parsed = updatePersonalTaskSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const existing = await prisma.personalTask.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return { success: false, error: "Tâche introuvable." };
    if (existing.userId !== session.user.id) {
      return { success: false, error: "Accès non autorisé." };
    }

    await prisma.personalTask.update({
      where: { id },
      data: { title: parsed.data.title, description: parsed.data.description ?? null },
    });

    revalidatePath("/projects");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[actions/personalTasks] updatePersonalTask", error);
    return { success: false, error: "Impossible de mettre à jour la tâche." };
  }
}

export async function deletePersonalTask(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non authentifié" };

  try {
    const existing = await prisma.personalTask.findUnique({
      where: { id },
      select: {
        userId: true,
        weekPlannerTasks: {
          where: { weekPlanner: { status: "VALIDATED" } },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!existing) return { success: false, error: "Tâche introuvable." };
    if (existing.userId !== session.user.id) {
      return { success: false, error: "Accès non autorisé." };
    }
    if (existing.weekPlannerTasks.length > 0) {
      return {
        success: false,
        error: "Impossible de supprimer une tâche déjà planifiée dans une semaine validée.",
      };
    }

    await prisma.personalTask.delete({ where: { id } });
    revalidatePath("/projects");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[actions/personalTasks] deletePersonalTask", error);
    return { success: false, error: "Impossible de supprimer la tâche." };
  }
}
