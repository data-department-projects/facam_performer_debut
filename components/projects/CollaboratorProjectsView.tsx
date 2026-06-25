"use client";

import { useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, User } from "lucide-react";
import { ProjectTaskKanban } from "@/components/projects/ProjectTaskKanban";

export type KanbanTask = {
  id: string;
  title: string;
  endDate: string;
  progressPercent: number;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
};

export type CollaboratorProject = {
  id: string;
  name: string;
  description: string;
  estimatedStartDate: string;
  targetEndDate: string;
  isConfirmed: boolean;
  currentStatus: string;
  projectManager: { fullName: string };
  tasks: KanbanTask[];
};

type Props = {
  projects: CollaboratorProject[];
};

const fmt = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function CollaboratorProjectsView({ projects }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = projects.find((p) => p.id === selectedId);

  if (selected) {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="flex w-fit items-center gap-1.5 text-xs text-gray400 transition-colors hover:text-facamBlue"
        >
          <ArrowLeft size={13} />
          Retour à mes projets
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray200 bg-facamWhite p-5 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-facamDark">{selected.name}</h2>
            {selected.description && (
              <p className="mt-0.5 max-w-xl text-xs text-gray500 line-clamp-2">
                {selected.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray500">
              <span className="flex items-center gap-1.5">
                <User size={12} />
                {selected.projectManager.fullName}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={12} />
                {fmt(selected.estimatedStartDate)} → {fmt(selected.targetEndDate)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selected.isConfirmed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-successLight px-2.5 py-0.5 text-xs font-medium text-success">
                <CheckCircle2 size={11} />
                Confirmé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-warningLight px-2.5 py-0.5 text-xs font-medium text-warning">
                <Clock size={11} />
                En attente
              </span>
            )}
          </div>
        </div>

        <ProjectTaskKanban tasks={selected.tasks} projectId={selected.id} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-facamDark">Mes Projets</h2>
        <p className="mt-0.5 text-xs text-gray500">
          {projects.length === 0
            ? "Aucun projet pour le moment"
            : `${projects.length} projet${projects.length > 1 ? "s" : ""} — cliquez pour voir vos tâches`}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-gray200 bg-facamWhite py-14 shadow-sm">
          <p className="text-sm text-gray400">
            Vous n&apos;êtes membre d&apos;aucun projet pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
            const totalTasks = project.tasks.length;
            const progressPercent =
              totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedId(project.id)}
                className="flex flex-col gap-3 rounded-xl border border-gray200 bg-facamWhite p-5 text-left shadow-sm transition hover:border-facamBlue hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-facamBlue"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-snug text-facamDark">
                    {project.name}
                  </h3>
                  {project.isConfirmed ? (
                    <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-success" />
                  ) : (
                    <Clock size={14} className="mt-0.5 flex-shrink-0 text-warning" />
                  )}
                </div>

                <p className="text-xs text-gray500 line-clamp-2">{project.description}</p>

                <div className="flex flex-col gap-1.5 border-t border-gray100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-gray500">
                    <User size={12} className="flex-shrink-0 text-gray400" />
                    <span>{project.projectManager.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray500">
                    <CalendarDays size={12} className="flex-shrink-0 text-gray400" />
                    <span>
                      {fmt(project.estimatedStartDate)} → {fmt(project.targetEndDate)}
                    </span>
                  </div>
                </div>

                {totalTasks > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-gray400">
                      <span>{totalTasks} tâche{totalTasks > 1 ? "s" : ""} assignée{totalTasks > 1 ? "s" : ""}</span>
                      <span>{progressPercent}% terminé</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray100">
                      <div
                        className="h-full rounded-full bg-facamBlue transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {totalTasks === 0 && (
                  <p className="text-[10px] text-gray300">Aucune tâche assignée</p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
