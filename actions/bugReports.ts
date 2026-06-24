"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { requireRole } from "@/lib/permissions";
import { bugReportSchema } from "@/lib/schemas/bugReport";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborateur",
  INTERN: "Stagiaire",
};

export async function submitBugReport(
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "COLLABORATOR", "INTERN"]);

    const parsed = bugReportSchema.safeParse(rawData);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Données invalides.";
      return { success: false, error: message };
    }

    await prisma.bugReport.create({
      data: { userId: user.id, description: parsed.data.description },
    });

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail) {
      await sendEmail({
        to: supportEmail,
        template: "bug-report",
        data: {
          fullName: user.name ?? "Inconnu",
          role: ROLE_LABELS[user.role] ?? user.role,
          description: parsed.data.description,
          submittedAt: new Date().toLocaleString("fr-FR", { timeZone: "UTC" }),
        },
      });
    }

    return { success: true };
  } catch {
    return { success: false, error: "Une erreur est survenue. Veuillez réessayer." };
  }
}
