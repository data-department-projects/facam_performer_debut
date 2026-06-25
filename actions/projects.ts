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
          categoryOther: input.category === "OTHER" ? (input.categoryOther ?? null) : null,
          strategicPriority: input.strategicPriority,
          currentStatus: "PENDING",
          isConfirmed: false,
          sponsorUserId: input.projectManagerId,
          projectManagerId: input.projectManagerId,
          beneficiaryType: "INTERNAL",
          beneficiaryDepartmentId: input.beneficiaryDepartmentId ?? null,
          beneficiaryExternalName: null,
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

    if (currentUser.role === "MANAGER") {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          projectManagerId: true,
          teamMembers: { select: { userId: true } },
        },
      });
      const isOwner =
        project?.projectManagerId === currentUser.id ||
        project?.teamMembers.some((m) => m.userId === currentUser.id);
      if (!isOwner) return { success: false, error: "Accès non autorisé." };
    }

    const parsed = projectExpenseSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { label, amount, expenseType, expenseCategory, expenseDate } = parsed.data;
    const [y, m, d] = expenseDate.split("-").map(Number);

    await prisma.projectExpense.create({
      data: {
        projectId,
        label: label.trim(),
        amount,
        expenseType,
        expenseCategory: expenseCategory?.trim() || null,
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

export async function updateProject(
  projectId: string,
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: "Non authentifié." };
    if (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER") {
      return { success: false, error: "Accès non autorisé." };
    }

    const parsed = projectSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
    }

    if (currentUser.role === "MANAGER") {
      const existing = await prisma.project.findUnique({
        where: { id: projectId },
        select: { projectManagerId: true },
      });
      if (!existing) return { success: false, error: "Projet introuvable." };
      if (existing.projectManagerId !== currentUser.id) {
        return { success: false, error: "Accès non autorisé." };
      }
      if (parsed.data.projectManagerId !== currentUser.id) {
        return { success: false, error: "Vous ne pouvez pas transférer la gestion du projet à un autre utilisateur." };
      }
    }

    const input = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          categoryOther: input.category === "OTHER" ? (input.categoryOther ?? null) : null,
          strategicPriority: input.strategicPriority,
          sponsorUserId: input.projectManagerId,
          projectManagerId: input.projectManagerId,
          beneficiaryType: "INTERNAL",
          beneficiaryDepartmentId: input.beneficiaryDepartmentId ?? null,
          beneficiaryExternalName: null,
          estimatedStartDate: new Date(input.estimatedStartDate),
          targetEndDate: new Date(input.targetEndDate),
          actualStartDate: input.actualStartDate ? new Date(input.actualStartDate) : null,
          actualEndDate: input.actualEndDate ? new Date(input.actualEndDate) : null,
          initialBudget: input.initialBudget,
          scopeIncluded: input.scopeIncluded ?? "",
          scopeExcluded: input.scopeExcluded ?? "",
          expectedDeliverables: input.expectedDeliverables.map((d) => d.value),
          successCriteria: input.successCriteria.map((d) => d.value),
          documentationLinks: input.documentationLinks.map((d) => d.value),
        },
      });

      await tx.projectTeamMember.deleteMany({ where: { projectId } });
      if (input.teamMembers.length > 0) {
        await tx.projectTeamMember.createMany({
          data: input.teamMembers.map((m) => ({
            projectId,
            userId: m.userId,
            roleLabel: m.roleLabel,
          })),
        });
      }
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("[actions/projects] updateProject", error);
    return { success: false, error: "Impossible de mettre à jour le projet." };
  }
}

export async function deleteProjectExpense(
  expenseId: string,
  projectId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role as Role)) {
      return { success: false, error: "Accès non autorisé." };
    }

    if (currentUser.role === "MANAGER") {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          projectManagerId: true,
          teamMembers: { select: { userId: true } },
        },
      });
      const isOwner =
        project?.projectManagerId === currentUser.id ||
        project?.teamMembers.some((m) => m.userId === currentUser.id);
      if (!isOwner) return { success: false, error: "Accès non autorisé." };
    }

    const expense = await prisma.projectExpense.findUnique({
      where: { id: expenseId },
      select: { projectId: true },
    });
    if (!expense || expense.projectId !== projectId) {
      return { success: false, error: "Dépense introuvable ou accès refusé." };
    }

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

    if (![0, 25, 50, 75, 100].includes(progressPercent)) {
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
