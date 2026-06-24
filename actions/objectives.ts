"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { uploadAttachment, buildKeyResultKey, getAttachmentUrl, deleteAttachments } from "@/lib/s3-client";
import {
  createObjectiveSchema,
  updateObjectiveSchema,
  addKeyResultSchema,
  updateKeyResultProgressSchema,
  type CreateObjectiveInput,
  type UpdateObjectiveInput,
  type AddKeyResultInput,
  type UpdateKeyResultProgressInput,
} from "@/lib/schemas/objective";
import type { ObjectiveType, KeyResultStatus } from "@/app/generated/prisma/client";

// ── createObjective ────────────────────────────────────────────────────────────

export async function createObjective(
  rawData: unknown,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await requireRole(["COLLABORATOR", "MANAGER"]);

    const parsed = createObjectiveSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const input: CreateObjectiveInput = parsed.data;
    const filteredRisks = input.risks.filter((r) => r.trim() !== "");

    const objective = await prisma.objective.create({
      data: {
        userId: user.id,
        name: input.name.trim(),
        description: input.description.trim(),
        type: input.type as ObjectiveType,
        risks: filteredRisks,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
      },
      select: { id: true },
    });

    revalidatePath("/objectives");
    return { success: true, id: objective.id };
  } catch (error) {
    console.error("[objectives/create]", error);
    return { success: false, error: "Erreur lors de la création de l'objectif" };
  }
}

// ── updateObjective ────────────────────────────────────────────────────────────

export async function updateObjective(
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(["COLLABORATOR", "MANAGER"]);

    const parsed = updateObjectiveSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const input: UpdateObjectiveInput = parsed.data;

    const existing = await prisma.objective.findUnique({ where: { id: input.id }, select: { userId: true } });
    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Objectif introuvable ou accès refusé" };
    }

    await prisma.objective.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.type && { type: input.type as ObjectiveType }),
        ...(input.risks !== undefined && { risks: input.risks.filter((r) => r.trim() !== "") }),
        ...(input.periodStart && { periodStart: new Date(input.periodStart) }),
        ...(input.periodEnd && { periodEnd: new Date(input.periodEnd) }),
      },
    });

    revalidatePath("/objectives");
    return { success: true };
  } catch (error) {
    console.error("[objectives/update]", error);
    return { success: false, error: "Erreur lors de la mise à jour de l'objectif" };
  }
}

// ── deleteObjective ────────────────────────────────────────────────────────────

export async function deleteObjective(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(["COLLABORATOR", "MANAGER"]);

    const existing = await prisma.objective.findUnique({
      where: { id },
      select: {
        userId: true,
        keyResults: { select: { attachments: { select: { s3Key: true } } } },
      },
    });

    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Objectif introuvable ou accès refusé" };
    }

    // Supprimer les fichiers S3 associés — non bloquant
    const s3Keys = existing.keyResults.flatMap((kr) => kr.attachments.map((a) => a.s3Key));
    try {
      await deleteAttachments(s3Keys);
    } catch {
      console.error("[objectives/delete] Nettoyage S3 échoué — non bloquant");
    }

    // Cascade Prisma supprime KeyResults et Attachments (DB)
    await prisma.objective.delete({ where: { id } });

    revalidatePath("/objectives");
    return { success: true };
  } catch (error) {
    console.error("[objectives/delete]", error);
    return { success: false, error: "Erreur lors de la suppression de l'objectif" };
  }
}

// ── addKeyResult ───────────────────────────────────────────────────────────────

export async function addKeyResult(
  rawData: unknown,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await requireRole(["COLLABORATOR", "MANAGER"]);

    const parsed = addKeyResultSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const input: AddKeyResultInput = parsed.data;

    const objective = await prisma.objective.findUnique({
      where: { id: input.objectiveId },
      select: { userId: true },
    });
    if (!objective || objective.userId !== user.id) {
      return { success: false, error: "Objectif introuvable ou accès refusé" };
    }

    const kr = await prisma.keyResult.create({
      data: {
        objectiveId: input.objectiveId,
        description: input.description.trim(),
        targetValue: input.targetValue ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
      select: { id: true },
    });

    revalidatePath("/objectives");
    return { success: true, id: kr.id };
  } catch (error) {
    console.error("[objectives/addKeyResult]", error);
    return { success: false, error: "Erreur lors de l'ajout du résultat clé" };
  }
}

// ── updateKeyResultProgress ────────────────────────────────────────────────────

export async function updateKeyResultProgress(
  rawData: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(["COLLABORATOR", "MANAGER"]);

    const parsed = updateKeyResultProgressSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const input: UpdateKeyResultProgressInput = parsed.data;

    const kr = await prisma.keyResult.findUnique({
      where: { id: input.id },
      select: { objective: { select: { userId: true } } },
    });
    if (!kr || kr.objective.userId !== user.id) {
      return { success: false, error: "Résultat clé introuvable ou accès refusé" };
    }

    await prisma.keyResult.update({
      where: { id: input.id },
      data: {
        status: input.status as KeyResultStatus,
        currentValue: input.currentValue ?? null,
        evidenceNote: input.evidenceNote ?? null,
      },
    });

    revalidatePath("/objectives");
    return { success: true };
  } catch (error) {
    console.error("[objectives/updateKeyResultProgress]", error);
    return { success: false, error: "Erreur lors de la mise à jour du résultat clé" };
  }
}

// ── deleteKeyResult ────────────────────────────────────────────────────────────

export async function deleteKeyResult(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(["COLLABORATOR", "MANAGER"]);

    const kr = await prisma.keyResult.findUnique({
      where: { id },
      select: {
        objective: { select: { userId: true } },
        attachments: { select: { s3Key: true } },
      },
    });
    if (!kr || kr.objective.userId !== user.id) {
      return { success: false, error: "Résultat clé introuvable ou accès refusé" };
    }

    // Nettoyer les fichiers S3 — non bloquant
    try {
      await deleteAttachments(kr.attachments.map((a) => a.s3Key));
    } catch {
      console.error("[objectives/deleteKeyResult] Nettoyage S3 échoué — non bloquant");
    }

    await prisma.keyResult.delete({ where: { id } });

    revalidatePath("/objectives");
    return { success: true };
  } catch (error) {
    console.error("[objectives/deleteKeyResult]", error);
    return { success: false, error: "Erreur lors de la suppression du résultat clé" };
  }
}

// ── uploadCertificate ──────────────────────────────────────────────────────────

export async function uploadCertificate(
  formData: FormData,
): Promise<{ success: boolean; attachment?: { id: string; fileName: string; signedUrl: string }; error?: string }> {
  try {
    const user = await requireRole(["COLLABORATOR", "MANAGER"]);

    const file = formData.get("file") as File | null;
    const keyResultId = formData.get("keyResultId") as string | null;

    if (!file || !keyResultId) {
      return { success: false, error: "Fichier ou identifiant manquant" };
    }

    const kr = await prisma.keyResult.findUnique({
      where: { id: keyResultId },
      select: {
        objective: { select: { userId: true } },
        attachments: { select: { id: true, s3Key: true } },
      },
    });
    if (!kr || kr.objective.userId !== user.id) {
      return { success: false, error: "Résultat clé introuvable ou accès refusé" };
    }

    // Supprimer l'ancien certificat s'il existe — DB d'abord, S3 ensuite (non bloquant)
    if (kr.attachments.length > 0) {
      const oldKeys = kr.attachments.map((a) => a.s3Key);
      await prisma.attachment.deleteMany({ where: { keyResultId } });
      try {
        await deleteAttachments(oldKeys);
      } catch {
        console.error("[objectives/uploadCertificate] Suppression ancien S3 échouée — non bloquant");
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = buildKeyResultKey(keyResultId, file.name);

    await uploadAttachment(s3Key, buffer, file.type);
    let dbCreated = false;

    try {
      const signedUrl = await getAttachmentUrl(s3Key);

      const attachment = await prisma.attachment.create({
        data: {
          s3Key,
          fileName: file.name,
          contentType: file.type,
          relatedType: "KEY_RESULT",
          relatedId: keyResultId,
          uploadedById: user.id,
          keyResultId,
        },
        select: { id: true, fileName: true },
      });
      dbCreated = true;

      revalidatePath("/objectives");
      return { success: true, attachment: { ...attachment, signedUrl } };
    } catch (innerError) {
      if (!dbCreated) {
        // S3 uploadé mais DB échouée — nettoyer le fichier orphelin
        try { await deleteAttachments([s3Key]); } catch { /* non-bloquant */ }
      }
      throw innerError;
    }
  } catch (error) {
    console.error("[objectives/uploadCertificate]", error);
    return { success: false, error: "Erreur lors de l'upload du certificat" };
  }
}
