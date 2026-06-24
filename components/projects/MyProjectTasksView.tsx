"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  Calendar,
  ChevronRight,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { updateGanttTaskStatus } from "@/actions/ganttTasks";

// ── Types ──────────────────────────────────────────────────────────────────────

export type MyGanttTask = {
  id: string;
  title: string;
  status: string;
  progressPercent: number;
  startDate: string;
  endDate: string;
};

export type MyProjectEntry = {
  id: string;
  name: string;
  isManager: boolean;
  tasks: MyGanttTask[];
};

// ── Config statuts ─────────────────────────────────────────────────────────────

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

const STATUS_CFG: Record<TaskStatus, { label: string; badge: string; dot: string }> = {
  TODO:       { label: "À faire",  badge: "bg-gray100 text-gray500",          dot: "bg-gray400"  },
  IN_PROGRESS:{ label: "En cours", badge: "bg-facamBlueTint text-facamBlue",   dot: "bg-facamBlue"},
  DONE:       { label: "Terminé",  badge: "bg-successLight text-success",      dot: "bg-success"  },
  BLOCKED:    { label: "Bloqué",   badge: "bg-errorLight text-error",          dot: "bg-error"    },
};

const ALL_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"];

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

// ── Panel latéral de mise à jour (JIRA-style) ─────────────────────────────────

type PanelProps = {
  task: MyGanttTask;
  onClose: () => void;
  onSuccess: () => void;
};

function TaskStatusPanel({ task, onClose, onSuccess }: PanelProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>(task.status as TaskStatus);
  const [progress, setProgress] = useState(task.progressPercent);

  const currentCfg = STATUS_CFG[task.status as TaskStatus] ?? STATUS_CFG.TODO;
  const selectedCfg = STATUS_CFG[status];
  const hasChanged = status !== task.status || progress !== task.progressPercent;

  const handleSave = () => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateGanttTaskStatus(task.id, {
        status,
        progressPercent: progress,
      });
      if (!result.success) {
        setServerError(result.error ?? "Erreur inattendue.");
      } else {
        onSuccess();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-facamBlack/30" onClick={onClose} />

      <aside className="relative z-10 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-facamWhite shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray100 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
              Tâche
            </p>
            <h2 className="mt-0.5 text-sm font-semibold text-facamDark leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="mt-0.5 shrink-0 rounded-lg p-1.5 text-gray400 hover:bg-gray100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {serverError && (
            <div className="flex items-start gap-2 rounded-lg bg-errorLight px-3 py-2.5 text-xs text-error">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-gray500">
            <Calendar size={13} className="shrink-0 text-gray400" />
            {formatDate(task.startDate)} → {formatDate(task.endDate)}
          </div>

          {/* Sélecteur de statut */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
              Statut
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => {
                const cfg = STATUS_CFG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      status === s
                        ? `${cfg.badge} ring-2 ring-offset-1 ring-current`
                        : `${cfg.badge} opacity-50 hover:opacity-80`
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            {/* Flèche de transition */}
            <div className="flex items-center gap-1 text-[10px] text-gray400">
              <span className={`inline-flex h-2 w-2 rounded-full ${currentCfg.dot}`} />
              <span>{currentCfg.label}</span>
              {hasChanged && status !== (task.status as TaskStatus) && (
                <>
                  <ChevronRight size={10} />
                  <span className={`inline-flex h-2 w-2 rounded-full ${selectedCfg.dot}`} />
                  <span className="font-semibold text-facamDark">{selectedCfg.label}</span>
                </>
              )}
            </div>
          </div>

          {/* Avancement */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
                Avancement
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  progress === 100
                    ? "bg-successLight text-success"
                    : progress > 0
                      ? "bg-facamBlueTint text-facamBlue"
                      : "bg-gray100 text-gray500"
                }`}
              >
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-facamBlue"
            />
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progress === 100 ? "bg-success" : "bg-facamYellow"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-gray100 p-5 flex flex-col gap-2">
          {hasChanged && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="w-full rounded-lg bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors disabled:opacity-60"
            >
              {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-4 py-1.5 text-xs text-gray400 hover:text-facamDark transition-colors"
          >
            Fermer
          </button>
        </div>
      </aside>
    </div>
  );
}

// ── Ligne de tâche ─────────────────────────────────────────────────────────────

type TaskRowProps = {
  task: MyGanttTask;
  onSelect: () => void;
};

function TaskRow({ task, onSelect }: TaskRowProps) {
  const cfg = STATUS_CFG[task.status as TaskStatus] ?? STATUS_CFG.TODO;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-left hover:bg-gray50 transition-colors"
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />

      <span className="flex-1 truncate text-sm text-facamDark group-hover:text-facamBlue transition-colors">
        {task.title}
      </span>

      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
        {cfg.label}
      </span>

      <div className="hidden sm:flex items-center gap-2 w-28 shrink-0">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray100">
          <div
            className={`h-full rounded-full ${
              task.progressPercent === 100 ? "bg-success" : "bg-facamYellow"
            }`}
            style={{ width: `${task.progressPercent}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right text-[11px] text-gray400">
          {task.progressPercent}%
        </span>
      </div>

      <span className="hidden md:flex shrink-0 items-center gap-1 text-[11px] text-gray400">
        <Calendar size={11} />
        {formatDate(task.endDate)}
      </span>
    </button>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

type Props = {
  projects: MyProjectEntry[];
};

export function MyProjectTasksView({ projects }: Props) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<MyGanttTask | null>(null);

  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneTasks = projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status === "DONE").length,
    0,
  );

  const handleSuccess = () => {
    setSelectedTask(null);
    router.refresh();
  };

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray200 bg-facamWhite py-16 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-facamBlueTint">
          <ClipboardList size={26} className="text-facamBlue" />
        </div>
        <p className="text-sm font-semibold text-facamDark">
          Aucune tâche ne vous est assignée pour le moment
        </p>
        <p className="mt-1.5 max-w-sm text-sm text-gray400">
          Lorsque des tâches vous seront assignées dans un projet confirmé, elles apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Compteurs récapitulatifs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-gray200 bg-facamWhite px-5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
              Tâches assignées
            </p>
            <p className="mt-0.5 text-2xl font-bold text-facamDark">{totalTasks}</p>
          </div>
          <div className="rounded-xl border border-success/30 bg-successLight px-5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
              Terminées
            </p>
            <p className="mt-0.5 text-2xl font-bold text-success">{doneTasks}</p>
          </div>
          <div className="rounded-xl border border-facamBlue/20 bg-facamBlueTint px-5 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
              En cours / À faire
            </p>
            <p className="mt-0.5 text-2xl font-bold text-facamBlue">
              {totalTasks - doneTasks}
            </p>
          </div>
        </div>

        {/* Projets */}
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-gray200 bg-facamWhite shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-gray100 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-facamBlueTint">
                  <ClipboardList size={14} className="text-facamBlue" />
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-semibold text-facamDark hover:text-facamBlue transition-colors"
                >
                  {project.name}
                </Link>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                  project.isManager
                    ? "bg-facamBlueTint text-facamBlue"
                    : "bg-gray100 text-gray500"
                }`}
              >
                {project.isManager ? "Chef de projet" : "Membre"}
              </span>
            </div>

            <div className="divide-y divide-gray50 px-2 py-1">
              {project.tasks.length === 0 ? (
                <p className="px-3 py-4 text-xs text-gray400">
                  Aucune tâche assignée dans ce projet.
                </p>
              ) : (
                project.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onSelect={() => setSelectedTask(task)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskStatusPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
