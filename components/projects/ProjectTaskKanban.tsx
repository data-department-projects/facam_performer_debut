"use client";

import { useState, useTransition } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { updateGanttTaskStatus } from "@/actions/ganttTasks";
import type { KanbanTask } from "@/components/projects/CollaboratorProjectsView";

type GanttStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

const COLUMNS: {
  status: GanttStatus;
  label: string;
  headerClass: string;
  borderClass: string;
  emptyLabel: string;
}[] = [
  {
    status: "TODO",
    label: "À faire",
    headerClass: "bg-gray100 text-gray700",
    borderClass: "border-gray200",
    emptyLabel: "Déposer ici",
  },
  {
    status: "IN_PROGRESS",
    label: "En cours",
    headerClass: "bg-infoLight text-facamBlue",
    borderClass: "border-facamBlue",
    emptyLabel: "Déposer ici",
  },
  {
    status: "DONE",
    label: "Terminé",
    headerClass: "bg-successLight text-success",
    borderClass: "border-success",
    emptyLabel: "Déposer ici",
  },
  {
    status: "BLOCKED",
    label: "Bloqué",
    headerClass: "bg-errorLight text-error",
    borderClass: "border-error",
    emptyLabel: "Déposer ici",
  },
];

function progressForStatus(newStatus: GanttStatus, currentProgress: number): number {
  if (newStatus === "DONE") return 100;
  if (newStatus === "TODO") return 0;
  if (newStatus === "IN_PROGRESS") return Math.max(currentProgress, 25);
  return currentProgress; // BLOCKED — on conserve l'avancement actuel
}

type Props = {
  tasks: KanbanTask[];
  projectId: string;
};

export function ProjectTaskKanban({ tasks: initialTasks }: Props) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<GanttStatus | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(taskId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(status: GanttStatus) {
    setDragOverCol(status);
  }

  function handleDrop(e: React.DragEvent, newStatus: GanttStatus) {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = draggingId;
    setDraggingId(null);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const newProgress = progressForStatus(newStatus, task.progressPercent);

    // Mise à jour optimiste
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, progressPercent: newProgress } : t,
      ),
    );

    setPendingId(taskId);
    setError(null);

    startTransition(async () => {
      const result = await updateGanttTaskStatus(taskId, {
        status: newStatus,
        progressPercent: newProgress,
      });

      if (!result.success) {
        // Retour arrière en cas d'erreur
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: task.status, progressPercent: task.progressPercent }
              : t,
          ),
        );
        setError(result.error ?? "Erreur lors de la mise à jour.");
      }
      setPendingId(null);
    });
  }

  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg bg-errorLight px-3 py-2 text-sm text-error">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          const isOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex min-h-52 flex-col rounded-xl border-2 transition-all ${col.borderClass} ${
                isOver ? "scale-[1.01] shadow-md opacity-90" : "bg-gray50"
              }`}
            >
              {/* En-tête de colonne */}
              <div
                className={`flex items-center justify-between rounded-t-[10px] px-3 py-2 ${col.headerClass}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {col.label}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-facamWhite/60 text-[10px] font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tâches */}
              <div className="flex flex-1 flex-col gap-2 p-2">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-grab rounded-lg border border-gray200 bg-facamWhite p-3 shadow-sm transition-all active:cursor-grabbing ${
                      draggingId === task.id ? "opacity-30 shadow-none" : "hover:border-gray300 hover:shadow"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical
                        size={13}
                        className="mt-0.5 flex-shrink-0 text-gray300"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-snug text-facamBlack">
                          {task.title}
                        </p>
                        <p className="mt-1 text-[10px] text-gray400">
                          Échéance&nbsp;{fmt(task.endDate)}
                        </p>

                        {/* Barre de progression */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray100">
                            <div
                              className="h-full rounded-full bg-facamBlue transition-all"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                          <span className="flex-shrink-0 text-[10px] text-gray400">
                            {task.progressPercent}%
                          </span>
                        </div>

                        {pendingId === task.id && (
                          <Loader2
                            size={10}
                            className="mt-1.5 animate-spin text-facamBlue"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="flex flex-1 items-center justify-center py-6">
                    <p className="text-[10px] text-gray300">{col.emptyLabel}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
