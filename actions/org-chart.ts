"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createSubDepartmentSchema,
  updateSubDepartmentSchema,
  createTeamSchema,
  updateTeamSchema,
} from "@/lib/schemas/org-chart";

// ─── Départements ─────────────────────────────────────────────────────────────

export async function createDepartment(
  data: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const parsed = createDepartmentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    await prisma.department.create({
      data: {
        name: parsed.data.name,
        parentDepartmentId: parsed.data.parentDepartmentId ?? null,
      },
    });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] createDepartment", error);
    return { success: false, error: "Impossible de créer le département." };
  }
}

export async function updateDepartment(
  id: string,
  data: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const parsed = updateDepartmentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    await prisma.department.update({
      where: { id },
      data: {
        name: parsed.data.name,
        parentDepartmentId: parsed.data.parentDepartmentId ?? null,
      },
    });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] updateDepartment", error);
    return { success: false, error: "Impossible de mettre à jour le département." };
  }
}

export async function deleteDepartment(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);

    const [userCount, subDeptCount, childDeptCount] = await Promise.all([
      prisma.user.count({ where: { departmentId: id } }),
      prisma.subDepartment.count({ where: { departmentId: id } }),
      prisma.department.count({ where: { parentDepartmentId: id } }),
    ]);

    if (userCount > 0) {
      return {
        success: false,
        error: `Ce département contient ${userCount} collaborateur${userCount > 1 ? "s" : ""}. Transférez-les avant de le supprimer.`,
      };
    }
    if (subDeptCount > 0) {
      return {
        success: false,
        error: `Ce département contient ${subDeptCount} sous-département${subDeptCount > 1 ? "s" : ""}. Supprimez-les d'abord.`,
      };
    }
    if (childDeptCount > 0) {
      return {
        success: false,
        error: `Ce département contient ${childDeptCount} département${childDeptCount > 1 ? "s" : ""} enfant${childDeptCount > 1 ? "s" : ""}. Supprimez-les d'abord.`,
      };
    }

    await prisma.department.delete({ where: { id } });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] deleteDepartment", error);
    return { success: false, error: "Impossible de supprimer le département." };
  }
}

// ─── Sous-départements ────────────────────────────────────────────────────────

export async function createSubDepartment(
  data: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const parsed = createSubDepartmentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    await prisma.subDepartment.create({
      data: { name: parsed.data.name, departmentId: parsed.data.departmentId },
    });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] createSubDepartment", error);
    return { success: false, error: "Impossible de créer le sous-département." };
  }
}

export async function updateSubDepartment(
  id: string,
  data: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const parsed = updateSubDepartmentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    await prisma.subDepartment.update({ where: { id }, data: { name: parsed.data.name } });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] updateSubDepartment", error);
    return { success: false, error: "Impossible de mettre à jour le sous-département." };
  }
}

export async function deleteSubDepartment(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);

    const teamCount = await prisma.team.count({ where: { subDepartmentId: id } });
    if (teamCount > 0) {
      return {
        success: false,
        error: `Ce sous-département contient ${teamCount} équipe${teamCount > 1 ? "s" : ""}. Supprimez-les d'abord.`,
      };
    }

    await prisma.subDepartment.delete({ where: { id } });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] deleteSubDepartment", error);
    return { success: false, error: "Impossible de supprimer le sous-département." };
  }
}

// ─── Équipes ──────────────────────────────────────────────────────────────────

export async function createTeam(
  data: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const parsed = createTeamSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    await prisma.team.create({
      data: {
        name: parsed.data.name,
        subDepartmentId: parsed.data.subDepartmentId,
        managerId: parsed.data.managerId,
      },
    });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] createTeam", error);
    return { success: false, error: "Impossible de créer l'équipe." };
  }
}

export async function updateTeam(
  id: string,
  data: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const parsed = updateTeamSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    await prisma.team.update({
      where: { id },
      data: { name: parsed.data.name, managerId: parsed.data.managerId },
    });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] updateTeam", error);
    return { success: false, error: "Impossible de mettre à jour l'équipe." };
  }
}

export async function deleteTeam(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);

    const memberCount = await prisma.user.count({ where: { teamId: id } });
    if (memberCount > 0) {
      return {
        success: false,
        error: `Cette équipe contient ${memberCount} membre${memberCount > 1 ? "s" : ""}. Transférez-les avant de la supprimer.`,
      };
    }

    await prisma.team.delete({ where: { id } });
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/org-chart] deleteTeam", error);
    return { success: false, error: "Impossible de supprimer l'équipe." };
  }
}
