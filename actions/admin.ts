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

    const { password, teamId, ...rest } = parsed.data;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        ...rest,
        passwordHash,
        ...(teamId ? { teamId } : {}),
      },
      select: { id: true },
    });

    revalidatePath("/admin/users");
    return { success: true, userId: user.id };
  } catch (error) {
    console.error("[actions/admin] createUser", error);
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

    const { password, teamId, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = {
      ...rest,
      teamId: teamId ?? null,
    };

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    await prisma.user.update({ where: { id }, data: updateData });
    revalidatePath("/admin/users");
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
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/users");
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

    await sendEmail({
      to: user.email,
      template: "credentials",
      data: {
        name: user.fullName,
        email: user.email,
        password: plainPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[actions/admin] sendUserCredentials", error);
    return { success: false, error: "Impossible d'envoyer les identifiants." };
  }
}
