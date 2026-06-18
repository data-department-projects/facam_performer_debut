"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { projectSchema, type ProjectInput } from "@/lib/schemas/project";

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
          consumedBudget: 0,
          estimatedHrCostDays: input.estimatedHrCostDays,
          externalExpensesPlanned: input.externalExpensesPlanned,
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
