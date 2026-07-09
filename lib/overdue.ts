import type { GanttTaskStatus, CommitteeActionStatus } from "@/app/generated/prisma/client";

// Fonctions pures, sans dépendance Prisma — importables aussi bien côté client (styling
// des cartes) que côté serveur (requêtes, cron). La logique de retard ne doit vivre qu'ici.

// Minuit UTC — cohérent avec la façon dont endDate/dueDate sont stockées (dates sans heure).
// Une tâche/action dont l'échéance est aujourd'hui n'est pas encore en retard, seulement
// à partir du lendemain.
export function getTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function isGanttTaskOverdue(task: { endDate: Date | string; status: GanttTaskStatus }): boolean {
  return task.status !== "DONE" && new Date(task.endDate) < getTodayUtc();
}

export function isCommitteeActionOverdue(action: {
  dueDate: Date | string;
  status: CommitteeActionStatus;
}): boolean {
  return action.status !== "DONE" && new Date(action.dueDate) < getTodayUtc();
}

export function computeOverdueDays(dueDate: Date | string): number {
  return Math.max(
    0,
    Math.floor((getTodayUtc().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)),
  );
}
