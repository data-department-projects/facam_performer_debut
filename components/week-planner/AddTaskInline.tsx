"use client";

import { useState } from "react";
import type { MockProject, AssignedGanttTask } from "./types";

type TaskType = "" | "hors-projet" | "projet";

type Props = {
  confirmedProjects: MockProject[];
  assignedGanttTasks?: AssignedGanttTask[];
  onAdd: (title: string, projectId: string | null) => void;
  onCancel: () => void;
};

export function AddTaskInline({ confirmedProjects, assignedGanttTasks = [], onAdd, onCancel }: Props) {
  const [taskType, setTaskType] = useState<TaskType>("");
  const [projectId, setProjectId] = useState("");
  const [ganttTaskId, setGanttTaskId] = useState("");
  const [title, setTitle] = useState("");


  const projectTasks = assignedGanttTasks.filter((t) => t.projectId === projectId);

  function handleTaskTypeChange(type: TaskType) {
    setTaskType(type);
    setProjectId("");
    setGanttTaskId("");
    setTitle("");
  }

  function handleProjectChange(newId: string) {
    setProjectId(newId);
    setGanttTaskId("");
    setTitle("");
  }

  function handleGanttTaskChange(taskId: string) {
    setGanttTaskId(taskId);
    if (taskId) {
      const task = assignedGanttTasks.find((t) => t.id === taskId);
      if (task) setTitle(task.title);
    } else {
      setTitle("");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (taskType === "projet" && !projectId) return;
    onAdd(title.trim(), taskType === "projet" ? projectId : null);
    setTaskType("");
    setProjectId("");
    setGanttTaskId("");
    setTitle("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-facamBlue/30 bg-facamBlueTint/50 p-2.5"
    >
      {/* Étape 1 : Hors-projet ou Projet */}
      <select
        value={taskType}
        onChange={(e) => handleTaskTypeChange(e.target.value as TaskType)}
        className="rounded border border-gray300 bg-facamWhite px-2 py-1.5 text-xs text-facamBlack focus:border-facamBlue focus:outline-none"
      >
        <option value="">— Type de tâche —</option>
        <option value="hors-projet">Hors-projet</option>
        <option value="projet">Projet</option>
      </select>

      {/* Étape 2 : projets auxquels l'utilisateur est rattaché */}
      {taskType === "projet" && (
        <select
          value={projectId}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="rounded border border-gray300 bg-facamWhite px-2 py-1.5 text-xs text-facamBlack focus:border-facamBlue focus:outline-none"
        >
          <option value="">— Sélectionner un projet —</option>
          {confirmedProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Étape 3 : tâches non terminées assignées dans ce projet */}
      {taskType === "projet" && projectId && (
        <select
          value={ganttTaskId}
          onChange={(e) => handleGanttTaskChange(e.target.value)}
          className="rounded border border-facamBlue/40 bg-facamBlueTint px-2 py-1.5 text-xs text-facamBlack focus:border-facamBlue focus:outline-none"
        >
          <option value="">— Sélectionner une tâche —</option>
          {projectTasks.length > 0 ? (
            projectTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))
          ) : (
            <option disabled value="">
              Aucune tâche assignée dans ce projet
            </option>
          )}
        </select>
      )}

      {/* Titre — visible dès qu'un type est choisi, pré-rempli si tâche sélectionnée */}
      {taskType !== "" && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la tâche…"
          className="rounded border border-gray300 bg-facamWhite px-2 py-1.5 text-xs text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-1 focus:ring-facamBlue/20"
          required
          autoFocus={taskType === "hors-projet" || !ganttTaskId}
        />
      )}

      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-1 rounded bg-facamBlue px-2 py-1 text-[10px] font-semibold text-facamWhite hover:bg-facamDark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded border border-gray200 px-2 py-1 text-[10px] text-gray500 hover:bg-gray50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
