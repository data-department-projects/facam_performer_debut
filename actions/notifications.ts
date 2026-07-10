"use server";

import { auth } from "@/lib/auth";
import { computeOverdueDays } from "@/lib/overdue";
import {
  getMyOverdueGanttTasks,
  getMyOverdueCommitteeActions,
  getMyUpcomingMeetings,
} from "@/lib/overdue-queries";
import { getActionsToProcessData } from "@/lib/actions-to-process-queries";

export type OutstandingItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  overdueDays?: number;
  dateLabel?: string;
};

export type OutstandingItems = {
  overdue: OutstandingItem[];
  upcoming: OutstandingItem[];
  toValidate: OutstandingItem[];
};

const EMPTY: OutstandingItems = { overdue: [], upcoming: [], toValidate: [] };

function formatMeetingDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }) +
    " à " + d.toISOString().slice(11, 16);
}

// Agrégateur temps réel pour le centre de notifications (cloche) — aucune donnée
// persistée, tout est recalculé à chaque appel à partir de l'état réel de la base.
export async function getMyOutstandingItems(): Promise<OutstandingItems> {
  const session = await auth();
  if (!session?.user) return EMPTY;

  const { id: userId, role, departmentId } = session.user;

  const [overdueTasks, overdueActions, upcomingMeetings] = await Promise.all([
    getMyOverdueGanttTasks(userId),
    getMyOverdueCommitteeActions(userId),
    getMyUpcomingMeetings(userId),
  ]);

  const overdue: OutstandingItem[] = [
    ...overdueTasks.map((t) => ({
      id: `gantt-${t.id}`,
      title: t.title,
      subtitle: `Projet · ${t.project.name}`,
      href: "/projects",
      overdueDays: computeOverdueDays(t.endDate),
    })),
    ...overdueActions.map((a) => ({
      id: `action-${a.id}`,
      title: a.title,
      subtitle: `Comité · ${a.meeting.committee.name}`,
      href: "/committees",
      overdueDays: computeOverdueDays(a.dueDate),
    })),
  ].sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0));

  const upcoming: OutstandingItem[] = upcomingMeetings.map((m) => ({
    id: `meeting-${m.id}`,
    title: m.committee.name,
    subtitle: "Réunion à venir",
    href: "/committees",
    dateLabel: formatMeetingDate(m.startDateTime),
  }));

  let toValidate: OutstandingItem[] = [];
  if ((role === "ADMIN" || role === "MANAGER") && !(role === "MANAGER" && !departmentId)) {
    const data = await getActionsToProcessData(role, departmentId);
    toValidate = [
      ...data.pendingProjects.map((p) => ({
        id: `project-${p.id}`,
        title: p.name,
        subtitle: `Projet ${p.code} à confirmer`,
        href: "/actions-to-process",
      })),
      ...data.pendingWeekPlanners.map((wp) => ({
        id: `planner-${wp.id}`,
        title: wp.collaboratorName,
        subtitle: "Planning de semaine à valider",
        href: "/actions-to-process",
      })),
      ...data.overdueActions.map((a) => ({
        id: `committee-action-${a.id}`,
        title: a.title,
        subtitle: `Comité ${a.committeeName} — en retard`,
        href: "/actions-to-process",
      })),
    ];
  }

  return { overdue, upcoming, toValidate };
}
