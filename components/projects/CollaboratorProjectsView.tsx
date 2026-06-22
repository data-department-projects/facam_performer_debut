"use client";

import { MyProjectCard, type CollaboratorProject } from "@/components/projects/MyProjectCard";
import { MyAssignedTasksList, type AssignedTask } from "@/components/projects/MyAssignedTasksList";

type Props = {
  projects: CollaboratorProject[];
  tasks: AssignedTask[];
};

export function CollaboratorProjectsView({ projects, tasks }: Props) {
  return (
    <div className="flex flex-col gap-10">
      {/* Section Mes Projets */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-facamDark">Mes Projets</h2>
          <p className="mt-0.5 text-xs text-gray500">
            {projects.length} projet{projects.length > 1 ? "s" : ""} confirmé{projects.length > 1 ? "s" : ""}
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-gray200 bg-facamWhite py-12 shadow-sm">
            <p className="text-sm text-gray400">
              Vous n&apos;êtes membre d&apos;aucun projet confirmé pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <MyProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* Section Mes Tâches Assignées */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-facamDark">Mes Tâches Assignées</h2>
          <p className="mt-0.5 text-xs text-gray500">
            {tasks.length} tâche{tasks.length > 1 ? "s" : ""} — cliquez un bouton pour mettre à jour l&apos;avancement
          </p>
        </div>

        <MyAssignedTasksList tasks={tasks} />
      </section>
    </div>
  );
}
