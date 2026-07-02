"use client";

import { useState, useTransition } from "react";
import { Trash2, Check } from "lucide-react";
import { AddTaskInline } from "./AddTaskInline";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { updateTaskExecution } from "@/actions/dailyExecution";
import type { WeekTask, ConfirmedProject, AssignedGanttTask, PlannedDay, PlannerStatus, TaskStatus } from "./types";

const DAY_LABELS: Record<PlannedDay, string> = {
  MON: "Lundi",
  TUE: "Mardi",
  WED: "Mercredi",
  THU: "Jeudi",
  FRI: "Vendredi",
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "STARTED", label: "Débuté" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DONE", label: "Terminé" },
  { value: "NOT_DONE", label: "Non terminé" },
];

type TaskExecState = { status: TaskStatus; hours: string; comment: string };
type SaveState = "idle" | "saving" | "saved" | "error";

type Props = {
  day: PlannedDay;
  tasks: WeekTask[];
  plannerStatus: PlannerStatus;
  confirmedProjects: ConfirmedProject[];
  assignedGanttTasks?: AssignedGanttTask[];
  onAddTask: (title: string, projectId: string | null) => void;
  onDeleteTask: (taskId: string) => void;
};

export function DayTaskPanel({ day, tasks, plannerStatus, confirmedProjects, assignedGanttTasks, onAddTask, onDeleteTask }: Props) {
  const [execState, setExecState] = useState<Record<string, TaskExecState>>(() => {
    const init: Record<string, TaskExecState> = {};
    tasks.forEach((t) => {
      init[t.id] = { status: t.status, hours: "", comment: t.comment ?? "" };
    });
    return init;
  });
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [, startTransition] = useTransition();

  const isEditable = plannerStatus === "DRAFT";
  const isExecutable = plannerStatus === "VALIDATED";

  function updateExec(taskId: string, patch: Partial<TaskExecState>) {
    setExecState((prev) => ({
      ...prev,
      [taskId]: { ...(prev[taskId] ?? { status: "STARTED", hours: "", comment: "" }), ...patch },
    }));
  }

  function resetSaveStateAfter(taskId: string, delay: number) {
    setTimeout(() => setSaveState((prev) => ({ ...prev, [taskId]: "idle" })), delay);
  }

  function handleSave(task: WeekTask) {
    const state = execState[task.id] ?? { status: task.status, hours: "", comment: task.comment ?? "" };
    setSaveState((prev) => ({ ...prev, [task.id]: "saving" }));

    startTransition(async () => {
      const result = await updateTaskExecution({
        taskId: task.id,
        status: state.status,
        hoursSpent: state.hours.trim() === "" ? null : (parseFloat(state.hours) || 0),
        comment: state.comment,
      });

      if (result.success) {
        setSaveState((prev) => ({ ...prev, [task.id]: "saved" }));
        resetSaveStateAfter(task.id, 2000);
      } else {
        setSaveState((prev) => ({ ...prev, [task.id]: "error" }));
        resetSaveStateAfter(task.id, 3000);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-facamDark">{DAY_LABELS[day]}</p>

      {tasks.length === 0 && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-gray200 py-12">
          <p className="text-sm text-gray400">Aucune tâche planifiée pour ce jour</p>
        </div>
      )}

      {tasks.map((task) => {
        if (isExecutable) {
          const state = execState[task.id] ?? { status: task.status, hours: "", comment: task.comment ?? "" };
          const needsComment = state.status === "NOT_DONE";
          const canSave = !needsComment || state.comment.trim().length > 0;
          const taskSaveState = saveState[task.id] ?? "idle";

          return (
            <div key={task.id} className="flex flex-col gap-3 rounded-xl border border-gray200 bg-facamWhite p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-facamDark">{task.title}</p>
                  {task.project && (
                    <span className="text-[10px] font-medium text-facamBlue">{task.project.code}</span>
                  )}
                </div>
                <TaskStatusBadge status={state.status} />
              </div>

              <div className="flex gap-2">
                <select
                  value={state.status}
                  onChange={(e) => updateExec(task.id, { status: e.target.value as TaskStatus })}
                  className="flex-1 rounded-md border border-gray200 bg-gray50 px-3 py-1.5 text-xs text-facamDark focus:border-facamBlue focus:outline-none"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="Heures"
                  value={state.hours}
                  onChange={(e) => updateExec(task.id, { hours: e.target.value })}
                  className="w-24 rounded-md border border-gray200 bg-gray50 px-3 py-1.5 text-xs text-facamDark focus:border-facamBlue focus:outline-none"
                />
              </div>

              {needsComment && (
                <textarea
                  rows={2}
                  placeholder="Motif obligatoire…"
                  value={state.comment}
                  onChange={(e) => updateExec(task.id, { comment: e.target.value })}
                  className="w-full resize-none rounded-md border border-error/40 bg-errorLight/30 px-3 py-1.5 text-xs text-facamDark placeholder:text-error/50 focus:border-error/60 focus:outline-none"
                />
              )}

              <button
                onClick={() => handleSave(task)}
                disabled={!canSave || taskSaveState === "saving"}
                className={`self-end rounded-md px-4 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  taskSaveState === "saved"
                    ? "bg-success text-facamWhite"
                    : taskSaveState === "error"
                      ? "bg-error text-facamWhite"
                      : "bg-facamBlue text-facamWhite hover:bg-facamDark"
                }`}
              >
                {taskSaveState === "saved" ? (
                  <span className="flex items-center gap-1"><Check size={10} />Sauvegardé</span>
                ) : taskSaveState === "error" ? (
                  "Erreur"
                ) : taskSaveState === "saving" ? (
                  "Sauvegarde…"
                ) : (
                  "Sauvegarder"
                )}
              </button>
            </div>
          );
        }

        return (
          <div
            key={task.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray200 bg-facamWhite px-4 py-3 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-facamDark">{task.title}</p>
              {task.project && (
                <span className="text-[10px] font-medium text-facamBlue">{task.project.code}</span>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <TaskStatusBadge status={task.status} />
              {isEditable && (
                <button onClick={() => onDeleteTask(task.id)} className="text-gray300 hover:text-error">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {isEditable && (
        <div className="mt-1">
          {showAdd ? (
            <AddTaskInline
              confirmedProjects={confirmedProjects}
              assignedGanttTasks={assignedGanttTasks}
              onAdd={(title, projectId) => {
                onAddTask(title, projectId);
                setShowAdd(false);
              }}
              onCancel={() => setShowAdd(false)}
            />
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full rounded-xl border border-dashed border-gray200 py-3 text-xs text-gray400 transition-colors hover:border-facamBlue hover:text-facamBlue"
            >
              + Ajouter une tâche
            </button>
          )}
        </div>
      )}
    </div>
  );
}
