"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeekDayBar } from "./WeekDayBar";
import { DayTaskPanel } from "./DayTaskPanel";
import { WeekStatusBanner } from "./WeekStatusBanner";
import { addWeekPlannerTask, deleteWeekPlannerTask, submitWeekPlanner } from "@/actions/weekPlanner";
import type { PlannedDay, WeekTask, WeekPlannerData, ConfirmedProject, AssignedGanttTask } from "./types";

export type { WeekTask, WeekPlannerData, ConfirmedProject };

type Props = {
  planner: WeekPlannerData;
  confirmedProjects: ConfirmedProject[];
  assignedGanttTasks?: AssignedGanttTask[];
  weekStartDate: string;
  validatorLabel?: string;
  noValidation?: boolean;
};

const DAYS: PlannedDay[] = ["MON", "TUE", "WED", "THU", "FRI"];

export function CollaboratorWeekPlannerView({
  planner: initialPlanner,
  confirmedProjects,
  assignedGanttTasks,
  weekStartDate,
  validatorLabel,
  noValidation = false,
}: Props) {
  const router = useRouter();
  const [planner, setPlanner] = useState(initialPlanner);
  const [activeDay, setActiveDay] = useState<PlannedDay>(() => {
    const jsDay = new Date().getDay();
    const map: Record<number, PlannedDay> = { 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI" };
    return map[jsDay] ?? "MON";
  });
  const [, startTransition] = useTransition();

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

  function handleAddTask(title: string, projectId: string | null) {
    const project = projectId ? (confirmedProjects.find((p) => p.id === projectId) ?? null) : null;
    const optimisticTask: WeekTask = {
      id: `optimistic-${Date.now()}`,
      title,
      plannedDay: activeDay,
      status: "STARTED",
      comment: null,
      isLocked: false,
      project,
    };
    setPlanner((prev) => ({ ...prev, tasks: [...prev.tasks, optimisticTask] }));

    startTransition(async () => {
      const result = await addWeekPlannerTask({
        plannerId: planner.id,
        title,
        plannedDay: activeDay,
        projectId,
      });
      if (result.success) {
        setPlanner((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === optimisticTask.id ? { ...result.data, project: result.data.project ?? null } : t,
          ),
        }));
      } else {
        setPlanner((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== optimisticTask.id),
        }));
      }
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
          tasks: noValidation ? prev.tasks.map((t) => ({ ...t, isLocked: true })) : prev.tasks,
        }));
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => handleChangeWeek(-1)}
          className="flex items-center gap-1 rounded-md border border-gray200 bg-facamWhite px-3 py-2 text-sm text-gray500 hover:bg-gray50"
        >
          <ChevronLeft size={14} />
          Semaine précédente
        </button>

        <span className="text-sm font-medium text-facamDark">Semaine du {weekLabel}</span>

        <button
          onClick={() => handleChangeWeek(1)}
          className="flex items-center gap-1 rounded-md border border-gray200 bg-facamWhite px-3 py-2 text-sm text-gray500 hover:bg-gray50"
        >
          Semaine suivante
          <ChevronRight size={14} />
        </button>
      </div>

      <WeekStatusBanner
        status={planner.status}
        taskCount={planner.tasks.length}
        onSubmit={handleSubmit}
        validatorLabel={validatorLabel}
        noValidation={noValidation}
      />

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
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
