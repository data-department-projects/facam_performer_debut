"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { parseGanttExcel } from "@/lib/gantt-import";
import { uploadAttachment, buildGanttImportKey } from "@/lib/s3-client";

export async function importGanttTasks(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || !projectId) {
      return { success: false, error: "Fichier ou projet manquant." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseGanttExcel(buffer);

    if (!parsed.valid) {
      return {
        success: false,
        error: `Import invalide :\n${parsed.errors.join("\n")}`,
      };
    }

    // Résoudre les emails → userId
    const emails = [...new Set(parsed.rows.map((r) => r["Email responsable"]))];
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true },
    });
    const emailToId = Object.fromEntries(users.map((u) => [u.email, u.id]));

    const missing = emails.filter((e) => !emailToId[e]);
    if (missing.length > 0) {
      return {
        success: false,
        error: `Utilisateurs introuvables : ${missing.join(", ")}`,
      };
    }

    // Create séquentiel pour résoudre dependsOnIds par titre
    // Contrainte : chaque tâche prérequise doit apparaître avant ses dépendants dans le fichier
    await prisma.$transaction(async (tx) => {
      await tx.ganttTask.deleteMany({ where: { projectId } });

      const titleToId: Record<string, string> = {};
      for (const row of parsed.rows) {
        const deps =
          row["Prérequis (titres)"]
            ?.split(",")
            .map((t) => titleToId[t.trim()])
            .filter(Boolean) ?? [];

        const task = await tx.ganttTask.create({
          data: {
            projectId,
            title: row.Titre,
            startDate: new Date(row["Date début"]),
            endDate: new Date(row["Date fin"]),
            progressPercent: 0,
            responsibleUserId: emailToId[row["Email responsable"]],
            dependsOnIds: deps,
          },
          select: { id: true, title: true },
        });

        titleToId[task.title] = task.id;
      }
    });

    // Archivage S3 — non bloquant
    try {
      const key = buildGanttImportKey(projectId, file.name);
      await uploadAttachment(key, buffer, file.type);
    } catch {
      console.error("[ganttTasks/import] Archivage S3 échoué — non bloquant");
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/ganttTasks] importGanttTasks", error);
    return { success: false, error: "Impossible d'importer le planning." };
  }
}
