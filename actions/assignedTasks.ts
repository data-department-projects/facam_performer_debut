"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { createAssignedTaskSchema, updateAssignedTaskSchema } from "@/lib/schemas/assignedTask";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

async function assigneesOutsideManagerDepartment(
  assigneeIds: string[],
  managerDepartmentId: string | null | undefined,
): Promise<string | null> {
  if (assigneeIds.length === 0) return null;
  if (!managerDepartmentId) {
    return "Vous devez appartenir à un département pour assigner une tâche.";
  }
  const count = await prisma.user.count({
    where: {
      id: { in: assigneeIds },
      departmentId: managerDepartmentId,
      role: { in: ["COLLABORATOR", "INTERN"] },
      isActive: true,
    },
  });
  if (count !== assigneeIds.length) {
    return "Vous ne pouvez assigner une tâche qu'aux collaborateurs de votre propre département.";
  }
  return null;
}

export async function createAssignedTask(
  rawData: unknown,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const currentUser = await requireRole(["MANAGER"]);
    const parsed = createAssignedTaskSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const scopeError = await assigneesOutsideManagerDepartment(
      parsed.data.assigneeIds,
      currentUser.departmentId,
    );
    if (scopeError) return { success: false, error: scopeError };

    const task = await prisma.assignedTask.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        createdByUserId: currentUser.id,
        assignees: { create: parsed.data.assigneeIds.map((userId) => ({ userId })) },
      },
      select: { id: true },
    });

    revalidatePath("/projects");
    return { success: true, data: { id: task.id } };
  } catch (error) {
    console.error("[actions/assignedTasks] createAssignedTask", error);
    return { success: false, error: "Impossible de créer la tâche." };
  }
}

export async function updateAssignedTask(id: string, rawData: unknown): Promise<ActionResult> {
  try {
    const currentUser = await requireRole(["MANAGER"]);
    const parsed = updateAssignedTaskSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existing = await prisma.assignedTask.findUnique({
      where: { id },
      select: { createdByUserId: true },
    });
    if (!existing) return { success: false, error: "Tâche introuvable." };
    if (existing.createdByUserId !== currentUser.id) {
      return { success: false, error: "Accès non autorisé." };
    }

    const scopeError = await assigneesOutsideManagerDepartment(
      parsed.data.assigneeIds,
      currentUser.departmentId,
    );
    if (scopeError) return { success: false, error: scopeError };

    await prisma.$transaction(async (tx) => {
      await tx.assignedTask.update({
        where: { id },
        data: { title: parsed.data.title, description: parsed.data.description ?? null },
      });
      await tx.assignedTaskAssignee.deleteMany({ where: { assignedTaskId: id } });
      if (parsed.data.assigneeIds.length > 0) {
        await tx.assignedTaskAssignee.createMany({
          data: parsed.data.assigneeIds.map((userId) => ({ assignedTaskId: id, userId })),
        });
      }
    });

    revalidatePath("/projects");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[actions/assignedTasks] updateAssignedTask", error);
    return { success: false, error: "Impossible de mettre à jour la tâche." };
  }
}

export async function deleteAssignedTask(id: string): Promise<ActionResult> {
  try {
    const currentUser = await requireRole(["MANAGER"]);

    const existing = await prisma.assignedTask.findUnique({
      where: { id },
      select: { createdByUserId: true, assignees: { select: { id: true }, take: 1 } },
    });
    if (!existing) return { success: false, error: "Tâche introuvable." };
    if (existing.createdByUserId !== currentUser.id) {
      return { success: false, error: "Accès non autorisé." };
    }
    if (existing.assignees.length > 0) {
      return {
        success: false,
        error: "Impossible de supprimer une tâche déjà attribuée à un collaborateur.",
      };
    }

    await prisma.assignedTask.delete({ where: { id } });
    revalidatePath("/projects");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[actions/assignedTasks] deleteAssignedTask", error);
    return { success: false, error: "Impossible de supprimer la tâche." };
  }
}
