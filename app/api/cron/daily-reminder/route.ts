import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";
import { computeOverdueDays } from "@/lib/overdue";
import { findAllOverdueGanttTasks, findAllOverdueCommitteeActions } from "@/lib/overdue-queries";

// Ne relance qu'une fois par ~20h tant qu'un élément reste en retard — évite le spam
// si le cron est redéclenché plusieurs fois le même jour.
const REMINDER_COOLDOWN_MS = 20 * 60 * 60 * 1000;

function dueForReminder(lastOverdueReminderAt: Date | null): boolean {
  if (!lastOverdueReminderAt) return true;
  return Date.now() - lastOverdueReminderAt.getTime() > REMINDER_COOLDOWN_MS;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Non autorisé" },
      { status: 401 },
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  let tasksNotified = 0;
  let actionsNotified = 0;

  const [overdueTasks, overdueActions] = await Promise.all([
    findAllOverdueGanttTasks(),
    findAllOverdueCommitteeActions(),
  ]);

  for (const task of overdueTasks) {
    if (!dueForReminder(task.lastOverdueReminderAt)) continue;
    try {
      const overdueDays = computeOverdueDays(task.endDate);

      // Marquer en premier pour éviter les doublons si l'envoi échoue
      await prisma.ganttTask.update({
        where: { id: task.id },
        data: { lastOverdueReminderAt: new Date() },
      });

      await notifyUser(task.responsibleUserId, {
        title: "Tâche en retard",
        body: `"${task.title}" a dépassé son échéance de ${overdueDays} jour${overdueDays > 1 ? "s" : ""}.`,
        url: "/projects",
        emailTemplate: "overdue-task-reminder",
        emailData: {
          itemTitle: task.title,
          itemType: "tâche",
          context: `Projet · ${task.project.name}`,
          overdueDays: String(overdueDays),
          link: `${baseUrl}/projects`,
        },
      });
      tasksNotified++;
    } catch (error) {
      console.error(`[cron/daily-reminder] tâche Gantt ${task.id}`, error);
    }
  }

  for (const action of overdueActions) {
    if (!dueForReminder(action.lastOverdueReminderAt)) continue;
    try {
      const overdueDays = computeOverdueDays(action.dueDate);

      await prisma.committeeAction.update({
        where: { id: action.id },
        data: { lastOverdueReminderAt: new Date() },
      });

      await notifyUser(action.responsibleUserId, {
        title: "Action de comité en retard",
        body: `"${action.title}" a dépassé son échéance de ${overdueDays} jour${overdueDays > 1 ? "s" : ""}.`,
        url: "/committees",
        emailTemplate: "overdue-task-reminder",
        emailData: {
          itemTitle: action.title,
          itemType: "action de comité",
          context: `Comité · ${action.meeting.committee.name}`,
          overdueDays: String(overdueDays),
          link: `${baseUrl}/committees`,
        },
      });
      actionsNotified++;
    } catch (error) {
      console.error(`[cron/daily-reminder] action de comité ${action.id}`, error);
    }
  }

  return NextResponse.json({ success: true, data: { tasksNotified, actionsNotified } });
}
