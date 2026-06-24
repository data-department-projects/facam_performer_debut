"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, ChevronRight, AlertCircle } from "lucide-react";
import { updateGanttTaskStatus } from "@/actions/ganttTasks";
import type { GanttTaskData, GanttTeamMember } from "@/components/projects/ProjectGanttView";

// ── Statuts ────────────────────────────────────────────────────────────────────

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

const STATUSES: {
  id: TaskStatus;
  label: string;
  colBg: string;
  colBorder: string;
  headerBg: string;
  badge: string;
  dot: string;
}[] = [
  {
    id: "TODO",
    label: "À faire",
    colBg: "bg-gray50",
    colBorder: "border-gray200",
    headerBg: "bg-gray400",
    badge: "bg-gray100 text-gray500",
    dot: "bg-gray400",
  },
  {
    id: "IN_PROGRESS",
    label: "En cours",
    colBg: "bg-facamBlueTint",
    colBorder: "border-facamBlue/20",
    headerBg: "bg-facamBlue",
    badge: "bg-facamBlueTint text-facamBlue",
    dot: "bg-facamBlue",
  },
  {
    id: "DONE",
    label: "Terminé",
    colBg: "bg-successLight",
    colBorder: "border-success/30",
    headerBg: "bg-success",
    badge: "bg-successLight text-success",
    dot: "bg-success",
  },
  {
    id: "BLOCKED",
    label: "Bloqué",
    colBg: "bg-errorLight",
    colBorder: "border-error/30",
    headerBg: "bg-error",
    badge: "bg-errorLight text-error",
    dot: "bg-error",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

// ── Panel de mise à jour (JIRA-style task detail) ─────────────────────────────

type UpdatePanelProps = {
  task: GanttTaskData;
  teamMembers: GanttTeamMember[];
  canUpdate: boolean;
  isEditable: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onEditFull?: (task: GanttTaskData) => void;
};

function TaskUpdatePanel({
  task,
  teamMembers,
  canUpdate,
  isEditable,
  onClose,
  onSuccess,
  onEditFull,
}: UpdatePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(task.status as TaskStatus);
  const [progress, setProgress] = useState(task.progressPercent);

  const responsible = teamMembers.find((m) => m.id === task.responsibleUserId);
  const statusConfig = STATUSES.find((s) => s.id === selectedStatus)!;
  const currentConfig = STATUSES.find((s) => s.id === (task.status as TaskStatus))!;
  const hasChanged = selectedStatus !== task.status || progress !== task.progressPercent;

  const handleSave = () => {
    if (!canUpdate) return;
    setServerError(null);
    startTransition(async () => {
      const result = await updateGanttTaskStatus(task.id, {
        status: selectedStatus,
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
    <div
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div className="absolute inset-0 bg-facamBlack/30" onClick={onClose} />

      <aside className="relative z-10 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-facamWhite shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray100 px-5 py-4">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
              Tâche
            </p>
            <h2 className="text-sm font-semibold text-facamDark leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="mt-0.5 shrink-0 rounded-lg p-1.5 text-gray400 hover:bg-gray100 hover:text-facamDark"
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

          {/* Responsable */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-facamBlue text-[10px] font-bold text-facamWhite">
              {responsible ? getInitials(responsible.fullName) : "?"}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
                Responsable
              </p>
              <p className="text-xs font-medium text-facamDark">
                {responsible?.fullName ?? "—"}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-xs text-gray500">
            <Calendar size={13} className="shrink-0 text-gray400" />
            <span>
              {formatDate(task.startDate)} → {formatDate(task.endDate)}
            </span>
          </div>

          {/* Sélecteur de statut — style JIRA */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray400">
              Statut
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!canUpdate}
                  onClick={() => setSelectedStatus(s.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    selectedStatus === s.id
                      ? `${s.badge} ring-2 ring-offset-1 ring-current opacity-100`
                      : `${s.badge} opacity-50 hover:opacity-80 disabled:cursor-not-allowed`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {/* Flèche de transition — style JIRA workflow */}
            <div className="flex items-center gap-1 text-[10px] text-gray400">
              <span className={`inline-flex h-2 w-2 rounded-full ${currentConfig.dot}`} />
              <span>{currentConfig.label}</span>
              {hasChanged && selectedStatus !== (task.status as TaskStatus) && (
                <>
                  <ChevronRight size={10} />
                  <span className={`inline-flex h-2 w-2 rounded-full ${statusConfig.dot}`} />
                  <span className="font-semibold text-facamDark">{statusConfig.label}</span>
                </>
              )}
            </div>
          </div>

          {/* Curseur d'avancement */}
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
              disabled={!canUpdate}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-facamBlue disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* Message si non autorisé */}
          {!canUpdate && (
            <p className="rounded-lg border border-gray200 bg-gray50 px-3 py-2 text-xs text-gray400">
              Seul le responsable ou un Manager peut modifier cette tâche.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-gray100 p-5 flex flex-col gap-2">
          {canUpdate && hasChanged && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="w-full rounded-lg bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors disabled:opacity-60"
            >
              {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          )}
          {isEditable && onEditFull && (
            <button
              type="button"
              onClick={() => { onClose(); onEditFull(task); }}
              className="w-full rounded-lg border border-gray200 bg-facamWhite px-4 py-2 text-sm font-medium text-gray500 hover:bg-gray50 transition-colors"
            >
              Modifier les détails (dates, responsable…)
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

// ── Carte tâche ────────────────────────────────────────────────────────────────

type TaskCardProps = {
  task: GanttTaskData;
  teamMembers: GanttTeamMember[];
  onClick: () => void;
};

function TaskCard({ task, teamMembers, onClick }: TaskCardProps) {
  const responsible = teamMembers.find((m) => m.id === task.responsibleUserId);
  const statusCfg = STATUSES.find((s) => s.id === (task.status as TaskStatus))!;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-lg border border-gray200 bg-facamWhite p-3 text-left shadow-sm hover:border-facamBlue hover:shadow-md transition-all"
    >
      {/* Titre */}
      <p className="text-xs font-semibold text-facamDark line-clamp-2 leading-snug group-hover:text-facamBlue transition-colors">
        {task.title}
      </p>

      {/* Date */}
      <p className="mt-2 flex items-center gap-1 text-[10px] text-gray400">
        <Calendar size={10} />
        {formatDate(task.startDate)} — {formatDate(task.endDate)}
      </p>

      {/* Barre de progression */}
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-gray100">
        <div
          className={`h-full rounded-full transition-all ${
            task.progressPercent === 100 ? "bg-success" : "bg-facamYellow"
          }`}
          style={{ width: `${task.progressPercent}%` }}
        />
      </div>

      {/* Footer carte : avatar + pourcentage */}
      <div className="mt-2.5 flex items-center justify-between">
        {responsible && (
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full bg-facamBlue text-[8px] font-bold text-facamWhite"
            >
              {getInitials(responsible.fullName)}
            </div>
            <span className="text-[10px] text-gray400 truncate max-w-[90px]">
              {responsible.fullName.split(" ")[0]}
            </span>
          </div>
        )}
        <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${statusCfg.badge}`}>
          {task.progressPercent}%
        </span>
      </div>
    </button>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

type Props = {
  tasks: GanttTaskData[];
  teamMembers: GanttTeamMember[];
  currentUserId: string;
  isEditable: boolean;
  onEditFull?: (task: GanttTaskData) => void;
};

export function GanttTaskBoard({ tasks, teamMembers, currentUserId, isEditable, onEditFull }: Props) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<GanttTaskData | null>(null);

  const handleSuccess = () => {
    setSelectedTask(null);
    router.refresh();
  };

  const canUpdateTask = (task: GanttTaskData) =>
    isEditable || task.responsibleUserId === currentUserId;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUSES.map((col) => {
          const colTasks = tasks.filter((t) => (t.status as TaskStatus) === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl border ${col.colBorder} ${col.colBg} overflow-hidden`}
            >
              {/* Bande colorée */}
              <div className={`h-1 w-full ${col.headerBg}`} />
              {/* En-tête */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs font-semibold text-facamDark">{col.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cartes */}
              <div className="flex flex-col gap-2 p-2 pb-3 min-h-[80px]">
                {colTasks.length === 0 && (
                  <p className="px-1 py-2 text-center text-[10px] text-gray300">
                    Aucune tâche
                  </p>
                )}
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    teamMembers={teamMembers}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskUpdatePanel
          task={selectedTask}
          teamMembers={teamMembers}
          canUpdate={canUpdateTask(selectedTask)}
          isEditable={isEditable}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleSuccess}
          onEditFull={onEditFull}
        />
      )}
    </>
  );
}
