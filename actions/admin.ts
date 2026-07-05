"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";
import { createUserSchema, updateUserSchema } from "@/lib/schemas/admin";

export async function createUser(
  data: unknown,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const parsed = createUserSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    if (parsed.data.role === "MANAGER") {
      const existingManager = await prisma.user.findFirst({
        where: { departmentId: parsed.data.departmentId, role: "MANAGER", isActive: true },
        select: { fullName: true },
      });
      if (existingManager) {
        return {
          success: false,
          error: `${existingManager.fullName} est déjà Manager de ce département. Désactivez-le ou changez son rôle avant d'en créer un nouveau.`,
        };
      }
    }

    const { password, teamId, ...rest } = parsed.data;
    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          ...rest,
          passwordHash,
          ...(teamId ? { teamId } : {}),
        },
        select: { id: true },
      });
      if (parsed.data.role === "MANAGER") {
        await tx.department.update({
          where: { id: parsed.data.departmentId },
          data: { responsableId: created.id },
        });
      }
      return created;
    });

    revalidatePath("/admin/users");
    revalidatePath("/org-chart");
    return { success: true, userId: user.id };
  } catch (error) {
    console.error("[actions/admin] createUser", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { success: false, error: "Un utilisateur avec cet email existe déjà." };
    }
    return { success: false, error: "Impossible de créer l'utilisateur." };
  }
}

export async function updateUser(
  id: string,
  data: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const parsed = updateUserSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, departmentId: true },
    });
    if (!currentUser) {
      return { success: false, error: "Utilisateur introuvable." };
    }

    if (parsed.data.role === "MANAGER") {
      const existingManager = await prisma.user.findFirst({
        where: {
          departmentId: parsed.data.departmentId,
          role: "MANAGER",
          isActive: true,
          id: { not: id },
        },
        select: { fullName: true },
      });
      if (existingManager) {
        return {
          success: false,
          error: `${existingManager.fullName} est déjà Manager de ce département. Désactivez-le ou changez son rôle avant d'en assigner un nouveau.`,
        };
      }
    }

    const { password, teamId, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = {
      ...rest,
      teamId: teamId ?? null,
    };

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const wasManager = currentUser.role === "MANAGER";
    const isManager = parsed.data.role === "MANAGER";
    const departmentChanged = currentUser.departmentId !== parsed.data.departmentId;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: updateData });

      if (wasManager && (!isManager || departmentChanged)) {
        await tx.department.updateMany({
          where: { id: currentUser.departmentId, responsableId: id },
          data: { responsableId: null },
        });
      }
      if (isManager) {
        await tx.department.update({
          where: { id: parsed.data.departmentId },
          data: { responsableId: id },
        });
      }
    });

    revalidatePath("/admin/users");
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin] updateUser", error);
    return { success: false, error: "Impossible de mettre à jour l'utilisateur." };
  }
}

export async function deactivateUser(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { isActive: false } });
      await tx.department.updateMany({
        where: { responsableId: id },
        data: { responsableId: null },
      });
    });
    revalidatePath("/admin/users");
    revalidatePath("/org-chart");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin] deactivateUser", error);
    return { success: false, error: "Impossible de désactiver l'utilisateur." };
  }
}

// Le mot de passe en clair ne transite que dans cette action — jamais loggé
export async function sendUserCredentials(
  userId: string,
  plainPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);

    const passwordHash = await hashPassword(plainPassword);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { email: true, fullName: true },
    });

    const sent = await sendEmail({
      to: user.email,
      template: "credentials",
      data: {
        name: user.fullName,
        email: user.email,
        password: plainPassword,
      },
    });

    if (!sent) {
      return { success: false, error: "Le mot de passe a été enregistré, mais l'email n'a pas pu être envoyé." };
    }

    return { success: true };
  } catch (error) {
    console.error("[actions/admin] sendUserCredentials", error);
    return { success: false, error: "Impossible d'envoyer les identifiants." };
  }
}
