"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import {
  createCommitteeSchema,
  planMeetingSchema,
  createCommitteeActionSchema,
  type CreateCommitteeInput,
  type PlanMeetingInput,
  type CreateCommitteeActionInput,
} from "@/lib/schemas/committee";
import type { CommitteeActionStatus } from "@/app/generated/prisma/client";

export async function createCommittee(
  rawData: unknown,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const parsed = createCommitteeSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const input: CreateCommitteeInput = parsed.data;

    const overlap = input.participantIds.filter((id) => input.guestIds.includes(id));
    if (overlap.length > 0) {
      return {
        success: false,
        error: "Un utilisateur ne peut pas être à la fois Participant et Invité.",
      };
    }

    const committee = await prisma.committee.create({
      data: {
        name: input.name,
        responsibleUserId: input.responsibleUserId,
        objectives: input.objectives,
        frequency: input.frequency,
        departments: {
          create: input.departmentIds.map((departmentId) => ({ departmentId })),
        },
        members: {
          create: [
            ...input.participantIds.map((userId) => ({
              userId,
              memberType: "PARTICIPANT" as const,
            })),
            ...input.guestIds.map((userId) => ({
              userId,
              memberType: "GUEST" as const,
            })),
          ],
        },
      },
      select: { id: true },
    });

    revalidatePath("/committees");
    return { success: true, data: { id: committee.id } };
  } catch (error) {
    console.error("[actions/committees] createCommittee", error);
    return { success: false, error: "Impossible de créer le comité." };
  }
}

export async function planMeeting(
  rawData: unknown,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const parsed = planMeetingSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const input: PlanMeetingInput = parsed.data;

    const [year, month, day] = input.meetingDate.split("-").map(Number);
    const [startHour, startMin] = input.startTime.split(":").map(Number);
    const [endHour, endMin] = input.endTime.split(":").map(Number);

    const meetingDate = new Date(Date.UTC(year, month - 1, day));
    const startDateTime = new Date(Date.UTC(year, month - 1, day, startHour, startMin));
    const endDateTime = new Date(Date.UTC(year, month - 1, day, endHour, endMin));

    if (endDateTime <= startDateTime) {
      return { success: false, error: "L'heure de fin doit être après l'heure de début." };
    }

    const meeting = await prisma.committeeMeeting.create({
      data: {
        committeeId: input.committeeId,
        meetingDate,
        startDateTime,
        endDateTime,
        meetingLink: input.meetingLink || null,
      },
      select: { id: true },
    });

    revalidatePath("/committees");
    revalidatePath(`/committees/${input.committeeId}`);
    return { success: true, data: { id: meeting.id } };
  } catch (error) {
    console.error("[actions/committees] planMeeting", error);
    return { success: false, error: "Impossible de planifier la réunion." };
  }
}

export async function createCommitteeAction(
  rawData: unknown,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const parsed = createCommitteeActionSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const input: CreateCommitteeActionInput = parsed.data;

    const meeting = await prisma.committeeMeeting.findUnique({
      where: { id: input.meetingId },
      select: { committeeId: true },
    });

    if (!meeting) {
      return { success: false, error: "Réunion introuvable." };
    }

    const [y, m, d] = input.dueDate.split("-").map(Number);
    const dueDate = new Date(Date.UTC(y, m - 1, d));

    const action = await prisma.committeeAction.create({
      data: {
        meetingId: input.meetingId,
        title: input.title,
        responsibleUserId: input.responsibleUserId,
        dueDate,
        status: input.status,
      },
      select: { id: true },
    });

    revalidatePath("/committees");
    revalidatePath(`/committees/${meeting.committeeId}`);
    return { success: true, data: { id: action.id } };
  } catch (error) {
    console.error("[actions/committees] createCommitteeAction", error);
    return { success: false, error: "Impossible d'enregistrer la décision." };
  }
}

export async function updateCommitteeActionStatus(
  actionId: string,
  status: CommitteeActionStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const updated = await prisma.committeeAction.update({
      where: { id: actionId },
      data: { status },
      select: { meeting: { select: { committeeId: true } } },
    });

    revalidatePath("/committees");
    revalidatePath(`/committees/${updated.meeting.committeeId}`);
    return { success: true };
  } catch (error) {
    console.error("[actions/committees] updateCommitteeActionStatus", error);
    return { success: false, error: "Impossible de mettre à jour le statut." };
  }
}
