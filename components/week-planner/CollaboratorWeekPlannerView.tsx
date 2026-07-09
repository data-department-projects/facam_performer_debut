"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutList } from "lucide-react";
import { WeekDayBar } from "./WeekDayBar";
import { DayTaskPanel } from "./DayTaskPanel";
import { WeekOverviewGrid } from "./WeekOverviewGrid";
import { WeekStatusBanner } from "./WeekStatusBanner";
import type { TaskSource } from "./AddTaskInline";
import { addWeekPlannerTask, deleteWeekPlannerTask, submitWeekPlanner } from "@/actions/weekPlanner";
import { addUnplannedCompletedTask } from "@/actions/dailyExecution";
import type { PlannedDay, WeekTask, WeekPlannerData, ConfirmedProject, AssignedGanttTask } from "./types";

export type { WeekTask, WeekPlannerData, ConfirmedProject };

type SimpleTaskOption = { id: string; title: string };

type Props = {
  planner: WeekPlannerData;
  confirmedProjects: ConfirmedProject[];
  assignedGanttTasks?: AssignedGanttTask[];
  myAssignedTasks?: SimpleTaskOption[];
  myPersonalTasks?: SimpleTaskOption[];
  weekStartDate: string;
  validatorLabel?: string;
  noValidation?: boolean;
  hideWeekNav?: boolean;
};

const DAYS: PlannedDay[] = ["MON", "TUE", "WED", "THU", "FRI"];

function replaceTaskById(tasks: WeekTask[], id: string, replacement: WeekTask): WeekTask[] {
  return tasks.map((t) => (t.id === id ? replacement : t));
}

function removeTaskById(tasks: WeekTask[], id: string): WeekTask[] {
  return tasks.filter((t) => t.id !== id);
}

function lockAllTasks(tasks: WeekTask[]): WeekTask[] {
  return tasks.map((t) => ({ ...t, isLocked: true }));
}

// "Aujourd'hui" côté client, calculé en UTC pour rester en accord avec le serveur
// (actions/dailyExecution.ts calcule le jour/la semaine courante en UTC également) —
// sert uniquement à savoir si l'onglet actuellement affiché correspond bien au jour
// réel, pour ne proposer l'ajout d'une tâche non planifiée que quand on regarde
// vraiment "aujourd'hui" côté serveur.
function getTodayInfo(): { plannedDay: PlannedDay | null; weekStartDate: string } {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const dayMap: Record<number, PlannedDay | null> = {
    0: null,
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
    6: null,
  };
  const mondayOffset = utcDay === 0 ? -6 : 1 - utcDay;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset));
  const weekStartDate = [
    monday.getUTCFullYear(),
    String(monday.getUTCMonth() + 1).padStart(2, "0"),
    String(monday.getUTCDate()).padStart(2, "0"),
  ].join("-");
  return { plannedDay: dayMap[utcDay], weekStartDate };
}

export function CollaboratorWeekPlannerView({
  planner: initialPlanner,
  confirmedProjects,
  assignedGanttTasks,
  myAssignedTasks,
  myPersonalTasks,
  weekStartDate,
  validatorLabel,
  noValidation = false,
  hideWeekNav = false,
}: Readonly<Props>) {
  const router = useRouter();
  const [planner, setPlanner] = useState(initialPlanner);
  const [activeDay, setActiveDay] = useState<PlannedDay>(() => {
    const utcDay = new Date().getUTCDay();
    const map: Record<number, PlannedDay> = { 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI" };
    return map[utcDay] ?? "MON";
  });
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [, startTransition] = useTransition();

  const isViewingToday = useMemo(() => {
    const today = getTodayInfo();
    return today.plannedDay !== null && today.weekStartDate === weekStartDate && activeDay === today.plannedDay;
  }, [weekStartDate, activeDay]);

  const displayedMonday = new Date(weekStartDate + "T00:00:00");
  const displayedFriday = new Date(displayedMonday);
  displayedFriday.setDate(displayedMonday.getDate() + 4);

  const weekLabel = `${displayedMonday.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
  })} — ${displayedFriday.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;

  function offsetDate(iso: string, days: number): string {
    const [y, m, d] = iso.split("-").map(Number);
    const result = new Date(Date.UTC(y, m - 1, d + days));
    return result.toISOString().split("T")[0];
  }

  function handleChangeWeek(delta: number) {
    const newWeek = offsetDate(weekStartDate, delta * 7);
    router.push(`/week-planner?week=${newWeek}`);
  }

  const tasksByDay = useMemo(() => {
    const map = {} as Record<PlannedDay, WeekTask[]>;
    DAYS.forEach((d) => (map[d] = []));
    planner.tasks.forEach((t) => map[t.plannedDay]?.push(t));
    return map;
  }, [planner.tasks]);

  function handleAddTask(title: string, source: TaskSource) {
    const project = source.projectId
      ? (confirmedProjects.find((p) => p.id === source.projectId) ?? null)
      : null;
    const optimisticTask: WeekTask = {
      id: `optimistic-${Date.now()}`,
      title,
      plannedDay: activeDay,
      status: "STARTED",
      comment: null,
      deliverableUrl: null,
      isLocked: false,
      project,
    };
    setPlanner((prev) => ({ ...prev, tasks: [...prev.tasks, optimisticTask] }));

    startTransition(async () => {
      const result = await addWeekPlannerTask({
        plannerId: planner.id,
        title,
        plannedDay: activeDay,
        projectId: source.projectId,
        assignedTaskId: source.assignedTaskId,
        personalTaskId: source.personalTaskId,
      });
      if (result.success) {
        const confirmed = { ...result.data, deliverableUrl: null, project: result.data.project ?? null };
        setPlanner((prev) => ({
          ...prev,
          tasks: replaceTaskById(prev.tasks, optimisticTask.id, confirmed),
        }));
      } else {
        setPlanner((prev) => ({
          ...prev,
          tasks: removeTaskById(prev.tasks, optimisticTask.id),
        }));
      }
    });
  }

  function handleAddUnplannedTask(
    title: string,
    deliverableUrl: string,
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await addUnplannedCompletedTask({ title, deliverableUrl: deliverableUrl || undefined });
        if (result.success) {
          const newTask: WeekTask = {
            id: result.data.weekPlannerTaskId,
            title,
            plannedDay: activeDay,
            status: "DONE",
            comment: null,
            deliverableUrl: deliverableUrl || null,
            isLocked: true,
            project: null,
          };
          setPlanner((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
          resolve({ success: true });
        } else {
          resolve({ success: false, error: result.error });
        }
      });
    });
  }

  function handleDeleteTask(taskId: string) {
    const removed = planner.tasks.find((t) => t.id === taskId);
    setPlanner((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }));

    startTransition(async () => {
      const result = await deleteWeekPlannerTask(taskId);
      if (!result.success && removed) {
        setPlanner((prev) => ({ ...prev, tasks: [...prev.tasks, removed] }));
      }
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitWeekPlanner(planner.id);
      if (result.success) {
        // Admin auto-valide directement — les autres passent en SUBMITTED
        setPlanner((prev) => ({
          ...prev,
          status: noValidation ? "VALIDATED" : "SUBMITTED",
          tasks: noValidation ? lockAllTasks(prev.tasks) : prev.tasks,
        }));
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {!hideWeekNav && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => handleChangeWeek(-1)}
            className="flex items-center gap-1 rounded-md bg-facamYellow px-3 py-2 text-sm font-medium text-facamDark transition-colors hover:brightness-105"
          >
            <ChevronLeft size={14} />
            Semaine précédente
          </button>

          <span className="text-sm font-medium text-facamDark">Semaine du {weekLabel}</span>

          <button
            onClick={() => handleChangeWeek(1)}
            className="flex items-center gap-1 rounded-md bg-facamYellow px-3 py-2 text-sm font-medium text-facamDark transition-colors hover:brightness-105"
          >
            Semaine suivante
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <WeekStatusBanner
        status={planner.status}
        taskCount={planner.tasks.length}
        onSubmit={handleSubmit}
        validatorLabel={validatorLabel}
        noValidation={noValidation}
      />

      <div className="flex items-center justify-end">
        <div className="flex gap-1 rounded-lg border border-gray200 bg-facamWhite p-1">
          <button
            onClick={() => setViewMode("day")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "day" ? "bg-facamBlue text-facamWhite" : "text-gray500 hover:bg-gray50"
            }`}
          >
            <LayoutList size={13} /> Vue jour
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "week" ? "bg-facamBlue text-facamWhite" : "text-gray500 hover:bg-gray50"
            }`}
          >
            <CalendarDays size={13} /> Vue semaine
          </button>
        </div>
      </div>

      {viewMode === "week" ? (
        <WeekOverviewGrid tasksByDay={tasksByDay} />
      ) : (
        <>
          <WeekDayBar
            activeDay={activeDay}
            weekMonday={displayedMonday}
            tasksByDay={tasksByDay}
            onSelectDay={setActiveDay}
          />

          <DayTaskPanel
            key={activeDay}
            day={activeDay}
            tasks={tasksByDay[activeDay] ?? []}
            plannerStatus={planner.status}
            confirmedProjects={confirmedProjects}
            assignedGanttTasks={assignedGanttTasks}
            myAssignedTasks={myAssignedTasks}
            myPersonalTasks={myPersonalTasks}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onAddUnplannedTask={isViewingToday ? handleAddUnplannedTask : undefined}
          />
        </>
      )}
    </div>
  );
}
