"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/permissions";

export async function confirmProject(
  projectId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Session introuvable." };

    await prisma.project.update({
      where: { id: projectId },
      data: {
        isConfirmed: true,
        confirmedById: user.id,
        confirmedAt: new Date(),
        confirmationNote: null, // Règle 13 — on efface la note d'attente à la confirmation
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/projectValidation] confirmProject", error);
    return { success: false, error: "Impossible de confirmer le projet." };
  }
}

export async function addConfirmationNote(
  projectId: string,
  note: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN"]);

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      return { success: false, error: "La note ne peut pas être vide." };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { confirmationNote: trimmedNote },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/projectValidation] addConfirmationNote", error);
    return { success: false, error: "Impossible d'enregistrer la note." };
  }
}
