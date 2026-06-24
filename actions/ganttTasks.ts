"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/permissions";
import { parseGanttExcel } from "@/lib/gantt-import";
import { uploadAttachment, buildGanttImportKey } from "@/lib/s3-client";
import { ganttTaskSchema } from "@/lib/schemas/ganttTask";
import { z } from "zod";

const ganttTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]),
  progressPercent: z.coerce.number().int().min(0).max(100),
});

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

// ── Création manuelle ─────────────────────────────────────────────────────────

export async function createGanttTask(
  projectId: string,
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const parsed = ganttTaskSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
    }

    const { title, startDate, endDate, responsibleUserId, dependsOnIds, progressPercent } =
      parsed.data;

    await prisma.ganttTask.create({
      data: {
        projectId,
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        progressPercent,
        responsibleUserId,
        dependsOnIds,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/ganttTasks] createGanttTask", error);
    return { success: false, error: "Impossible de créer la tâche." };
  }
}

// ── Modification ──────────────────────────────────────────────────────────────

export async function updateGanttTask(
  taskId: string,
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const task = await prisma.ganttTask.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) return { success: false, error: "Tâche introuvable." };

    const parsed = ganttTaskSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
    }

    const { title, startDate, endDate, responsibleUserId, dependsOnIds, progressPercent } =
      parsed.data;

    await prisma.ganttTask.update({
      where: { id: taskId },
      data: {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        progressPercent,
        responsibleUserId,
        dependsOnIds,
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/ganttTasks] updateGanttTask", error);
    return { success: false, error: "Impossible de modifier la tâche." };
  }
}

// ── Mise à jour du statut (responsable + managers) ───────────────────────────

export async function updateGanttTaskStatus(
  taskId: string,
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) return { success: false, error: "Non authentifié." };

    const parsed = ganttTaskStatusSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
    }

    const task = await prisma.ganttTask.findUnique({
      where: { id: taskId },
      select: { projectId: true, responsibleUserId: true },
    });
    if (!task) return { success: false, error: "Tâche introuvable." };

    // COLLABORATOR / INTERN → uniquement leurs propres tâches
    const role = currentUser.role as string;
    if (role !== "ADMIN" && role !== "MANAGER") {
      if (task.responsibleUserId !== currentUser.id) {
        return { success: false, error: "Vous ne pouvez mettre à jour que vos propres tâches." };
      }
    }

    await prisma.ganttTask.update({
      where: { id: taskId },
      data: {
        status: parsed.data.status as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
        progressPercent: parsed.data.progressPercent,
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/ganttTasks] updateGanttTaskStatus", error);
    return { success: false, error: "Impossible de mettre à jour le statut." };
  }
}

// ── Suppression ───────────────────────────────────────────────────────────────

export async function deleteGanttTask(
  taskId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const task = await prisma.ganttTask.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) return { success: false, error: "Tâche introuvable." };

    await prisma.$transaction(async (tx) => {
      // Retirer taskId des prérequis des autres tâches du projet
      const dependents = await tx.ganttTask.findMany({
        where: { projectId: task.projectId, dependsOnIds: { has: taskId } },
        select: { id: true, dependsOnIds: true },
      });
      for (const dep of dependents) {
        await tx.ganttTask.update({
          where: { id: dep.id },
          data: { dependsOnIds: dep.dependsOnIds.filter((id) => id !== taskId) },
        });
      }
      await tx.ganttTask.delete({ where: { id: taskId } });
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/ganttTasks] deleteGanttTask", error);
    return { success: false, error: "Impossible de supprimer la tâche." };
  }
}
