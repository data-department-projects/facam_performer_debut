"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/permissions";
import type { Role } from "@/app/generated/prisma/client";
import { projectSchema, projectExpenseSchema, type ProjectInput } from "@/lib/schemas/project";

export async function createProject(
  rawData: unknown,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const parsed = projectSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const input: ProjectInput = parsed.data;

    const project = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const count = await tx.project.count({
        where: { code: { startsWith: `PRJ-${year}` } },
      });
      const code = `PRJ-${year}-${String(count + 1).padStart(3, "0")}`;

      const created = await tx.project.create({
        data: {
          code,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          strategicPriority: input.strategicPriority,
          currentStatus: "PENDING",
          isConfirmed: false,
          sponsorUserId: input.sponsorUserId,
          projectManagerId: input.projectManagerId,
          beneficiaryType: input.beneficiaryType,
          beneficiaryDepartmentId: input.beneficiaryDepartmentId ?? null,
          beneficiaryExternalName: input.beneficiaryExternalName ?? null,
          estimatedStartDate: new Date(input.estimatedStartDate),
          targetEndDate: new Date(input.targetEndDate),
          actualStartDate: input.actualStartDate
            ? new Date(input.actualStartDate)
            : null,
          actualEndDate: input.actualEndDate
            ? new Date(input.actualEndDate)
            : null,
          initialBudget: input.initialBudget,
          scopeIncluded: input.scopeIncluded ?? "",
          scopeExcluded: input.scopeExcluded ?? "",
          expectedDeliverables: input.expectedDeliverables.map((d) => d.value),
          successCriteria: input.successCriteria.map((d) => d.value),
          documentationLinks: input.documentationLinks.map((d) => d.value),
        },
        select: { id: true },
      });

      if (input.teamMembers.length > 0) {
        await tx.projectTeamMember.createMany({
          data: input.teamMembers.map((m) => ({
            projectId: created.id,
            userId: m.userId,
            roleLabel: m.roleLabel,
          })),
        });
      }

      return created;
    });

    revalidatePath("/projects");
    return { success: true, data: { id: project.id } };
  } catch (error: unknown) {
    // Collision de code (contrainte UNIQUE) — très rare sous charge
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        error:
          "Conflit de code projet. Réessayez dans quelques instants.",
      };
    }
    console.error("[actions/projects] createProject", error);
    return { success: false, error: "Impossible de créer le projet." };
  }
}

export async function createMilestone(
  projectId: string,
  data: { title: string; targetDate: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    await prisma.projectMilestone.create({
      data: {
        projectId,
        title: data.title.trim(),
        targetDate: new Date(data.targetDate),
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/projects] createMilestone", error);
    return { success: false, error: "Impossible de créer le jalon." };
  }
}

export async function deleteMilestone(
  milestoneId: string,
  projectId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    await prisma.projectMilestone.delete({ where: { id: milestoneId } });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/projects] deleteMilestone", error);
    return { success: false, error: "Impossible de supprimer le jalon." };
  }
}

export async function createProjectExpense(
  projectId: string,
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role as Role)) {
      return { success: false, error: "Accès non autorisé." };
    }

    const parsed = projectExpenseSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { label, amount, expenseType, expenseDate } = parsed.data;
    const [y, m, d] = expenseDate.split("-").map(Number);

    await prisma.projectExpense.create({
      data: {
        projectId,
        label: label.trim(),
        amount,
        expenseType,
        expenseDate: new Date(Date.UTC(y, m - 1, d)),
        createdById: currentUser.id,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/projects] createProjectExpense", error);
    return { success: false, error: "Impossible d'enregistrer la dépense." };
  }
}

export async function deleteProjectExpense(
  expenseId: string,
  projectId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    await prisma.projectExpense.delete({ where: { id: expenseId } });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/projects] deleteProjectExpense", error);
    return { success: false, error: "Impossible de supprimer la dépense." };
  }
}

export async function updateMyTaskProgress(
  taskId: string,
  progressPercent: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "COLLABORATOR" && currentUser.role !== "INTERN")) {
      return { success: false, error: "Accès non autorisé." };
    }

    const task = await prisma.ganttTask.findUnique({
      where: { id: taskId },
      select: { responsibleUserId: true },
    });

    if (!task || task.responsibleUserId !== currentUser.id) {
      return { success: false, error: "Tâche introuvable ou accès refusé." };
    }

    if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      return { success: false, error: "L'avancement doit être 0, 25, 50, 75 ou 100." };
    }

    await prisma.ganttTask.update({
      where: { id: taskId },
      data: { progressPercent },
    });

    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("[actions/projects] updateMyTaskProgress", error);
    return { success: false, error: "Impossible de mettre à jour l'avancement." };
  }
}
