"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gantt, type Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Plus, CalendarDays, LayoutGrid, BarChart2 } from "lucide-react";
import { GanttImportZone } from "@/components/projects/GanttImportZone";
import { GanttTaskFormModal } from "@/components/projects/GanttTaskFormModal";
import { GanttTaskBoard } from "@/components/projects/GanttTaskBoard";

// ── Types exportés (consommés par page.tsx et ProjectDetailTabs) ───────────────

export type GanttTaskData = {
  id: string;
  title: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  progressPercent: number;
  status: string;    // GanttTaskStatus enum value
  dependsOnIds: string[];
  responsibleUserId: string;
};

export type GanttTeamMember = {
  id: string;
  fullName: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function toGanttTask(t: GanttTaskData): Task {
  return {
    id: t.id,
    name: t.title,
    start: new Date(`${t.startDate}T00:00:00`),
    end: new Date(`${t.endDate}T00:00:00`),
    progress: t.progressPercent,
    type: "task",
    dependencies: t.dependsOnIds,
  };
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const GANTT_VIEWS: { label: string; value: ViewMode }[] = [
  { label: "Semaine", value: ViewMode.Week },
  { label: "Mois", value: ViewMode.Month },
];

type DisplayMode = "gantt" | "board";
type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; task: GanttTaskData };

// ── Props ──────────────────────────────────────────────────────────────────────

type Props = {
  projectId: string;
  tasks: GanttTaskData[];
  teamMembers: GanttTeamMember[];
  isEditable: boolean;
  currentUserId: string;
};

// ── Composant ──────────────────────────────────────────────────────────────────

export function ProjectGanttView({ projectId, tasks, teamMembers, isEditable, currentUserId }: Props) {
  const router = useRouter();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("board");
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [modalState, setModalState] = useState<ModalState>({ mode: "closed" });

  const handleSuccess = () => {
    setModalState({ mode: "closed" });
    router.refresh();
  };

  const ganttTasks = tasks.map(toGanttTask);
  const taskOptions = tasks.map((t) => ({ id: t.id, title: t.title }));

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-gray200 bg-facamWhite shadow-sm">

          {/* ── Barre d'outils ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray100 px-6 py-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-facamDark">Planning Gantt</h3>
              <span className="rounded-full bg-facamBlueTint px-2.5 py-0.5 text-xs font-medium text-facamBlue">
                {tasks.length} tâche{tasks.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Tableau / Diagramme */}
              <div className="flex overflow-hidden rounded-lg border border-gray200 bg-gray50">
                <button
                  type="button"
                  onClick={() => setDisplayMode("board")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    displayMode === "board"
                      ? "bg-facamBlue text-facamWhite"
                      : "text-gray500 hover:text-facamDark"
                  }`}
                >
                  <LayoutGrid size={13} />
                  Tableau
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode("gantt")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    displayMode === "gantt"
                      ? "bg-facamBlue text-facamWhite"
                      : "text-gray500 hover:text-facamDark"
                  }`}
                >
                  <BarChart2 size={13} />
                  Diagramme
                </button>
              </div>

              {/* Toggle Semaine / Mois (diagramme uniquement) */}
              {displayMode === "gantt" && tasks.length > 0 && (
                <div className="flex overflow-hidden rounded-lg border border-gray200 bg-gray50">
                  {GANTT_VIEWS.map((vm) => (
                    <button
                      key={vm.value}
                      type="button"
                      onClick={() => setViewMode(vm.value)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        viewMode === vm.value
                          ? "bg-facamBlue text-facamWhite"
                          : "text-gray500 hover:text-facamDark"
                      }`}
                    >
                      {vm.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Bouton ajout */}
              {isEditable && (
                <button
                  type="button"
                  onClick={() => setModalState({ mode: "create" })}
                  className="flex items-center gap-1.5 rounded-lg bg-facamBlue px-3 py-1.5 text-xs font-semibold text-facamWhite hover:bg-facamDark transition-colors"
                >
                  <Plus size={14} />
                  Ajouter une tâche
                </button>
              )}
            </div>
          </div>

          {/* ── Corps ── */}
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-facamBlueTint">
                <CalendarDays size={26} className="text-facamBlue" />
              </div>
              <p className="text-sm font-semibold text-facamDark">
                Aucune tâche dans le planning
              </p>
              <p className="mt-1.5 max-w-sm text-sm text-gray400">
                {isEditable
                  ? "Créez la première tâche manuellement ou importez un planning depuis un fichier Excel."
                  : "Le planning n'a pas encore été renseigné par le Manager."}
              </p>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => setModalState({ mode: "create" })}
                  className="mt-5 flex items-center gap-2 rounded-lg bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors"
                >
                  <Plus size={15} />
                  Créer la première tâche
                </button>
              )}
            </div>
          ) : displayMode === "board" ? (
            <div className="p-4">
              <GanttTaskBoard
                tasks={tasks}
                teamMembers={teamMembers}
                currentUserId={currentUserId}
                isEditable={isEditable}
                onEditFull={(task) => setModalState({ mode: "edit", task })}
              />
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                listCellWidth="260px"
                columnWidth={viewMode === ViewMode.Week ? 60 : 120}
                barBackgroundColor="#001b61"
                barBackgroundSelectedColor="#002a6e"
                barProgressColor="#ffae03"
                barProgressSelectedColor="#ffae03"
                onClick={(task) => {
                  if (!isEditable) return;
                  const original = tasks.find((t) => t.id === task.id);
                  if (original) setModalState({ mode: "edit", task: original });
                }}
              />
            </div>
          )}
        </div>

        {isEditable && <GanttImportZone projectId={projectId} />}
      </div>

      {modalState.mode === "create" && (
        <GanttTaskFormModal
          mode="create"
          projectId={projectId}
          existingTasks={taskOptions}
          teamMembers={teamMembers}
          onClose={() => setModalState({ mode: "closed" })}
          onSuccess={handleSuccess}
        />
      )}
      {modalState.mode === "edit" && (
        <GanttTaskFormModal
          mode="edit"
          projectId={projectId}
          task={modalState.task}
          existingTasks={taskOptions}
          teamMembers={teamMembers}
          onClose={() => setModalState({ mode: "closed" })}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
