import { prisma } from "@/lib/prisma";
import { getTodayUtc } from "@/lib/overdue";

// Requêtes Prisma liées au retard — réservées au serveur (Server Actions, Route Handlers).
// La définition du retard elle-même (statut + date) vit dans lib/overdue.ts.

// ── Requêtes globales (tous responsables confondus) — utilisées par le cron de rappel ──

export async function findAllOverdueGanttTasks() {
  return prisma.ganttTask.findMany({
    where: { status: { not: "DONE" }, endDate: { lt: getTodayUtc() } },
    select: {
      id: true,
      title: true,
      endDate: true,
      responsibleUserId: true,
      lastOverdueReminderAt: true,
      project: { select: { name: true } },
    },
  });
}

export async function findAllOverdueCommitteeActions() {
  return prisma.committeeAction.findMany({
    where: { status: "PENDING", dueDate: { lt: getTodayUtc() } },
    select: {
      id: true,
      title: true,
      dueDate: true,
      responsibleUserId: true,
      lastOverdueReminderAt: true,
      meeting: { select: { committee: { select: { name: true } } } },
    },
  });
}

// ── Requêtes par utilisateur — utilisées par le centre de notifications ──

export async function getMyOverdueGanttTasks(userId: string) {
  return prisma.ganttTask.findMany({
    where: { responsibleUserId: userId, status: { not: "DONE" }, endDate: { lt: getTodayUtc() } },
    select: {
      id: true,
      title: true,
      endDate: true,
      projectId: true,
      project: { select: { name: true } },
    },
    orderBy: { endDate: "asc" },
  });
}

export async function getMyOverdueCommitteeActions(userId: string) {
  return prisma.committeeAction.findMany({
    where: { responsibleUserId: userId, status: "PENDING", dueDate: { lt: getTodayUtc() } },
    select: {
      id: true,
      title: true,
      dueDate: true,
      meeting: { select: { committee: { select: { id: true, name: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function getMyUpcomingMeetings(userId: string, withinHours = 48) {
  const now = new Date();
  const until = new Date(now.getTime() + withinHours * 60 * 60 * 1000);
  return prisma.committeeMeeting.findMany({
    where: {
      startDateTime: { gte: now, lte: until },
      committee: { members: { some: { userId } } },
    },
    select: {
      id: true,
      startDateTime: true,
      committee: { select: { id: true, name: true } },
    },
    orderBy: { startDateTime: "asc" },
  });
}
