"use client";

import { Gantt, type Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { GanttImportZone } from "@/components/projects/GanttImportZone";

const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    name: "Analyse des besoins",
    start: new Date(2026, 2, 1),
    end: new Date(2026, 2, 20),
    progress: 100,
    type: "task",
  },
  {
    id: "task-2",
    name: "Rédaction des spécifications",
    start: new Date(2026, 2, 15),
    end: new Date(2026, 3, 5),
    progress: 80,
    type: "task",
    dependencies: ["task-1"],
  },
  {
    id: "task-3",
    name: "Développement — Module authentification",
    start: new Date(2026, 3, 1),
    end: new Date(2026, 4, 10),
    progress: 60,
    type: "task",
    dependencies: ["task-2"],
  },
  {
    id: "task-4",
    name: "Développement — Module reporting",
    start: new Date(2026, 4, 5),
    end: new Date(2026, 5, 15),
    progress: 20,
    type: "task",
    dependencies: ["task-3"],
  },
  {
    id: "task-5",
    name: "Recette & Tests utilisateurs",
    start: new Date(2026, 5, 10),
    end: new Date(2026, 6, 5),
    progress: 0,
    type: "task",
    dependencies: ["task-4"],
  },
  {
    id: "task-6",
    name: "Déploiement & Go Live",
    start: new Date(2026, 6, 1),
    end: new Date(2026, 6, 20),
    progress: 0,
    type: "task",
    dependencies: ["task-5"],
  },
];

type Props = {
  projectId: string;
};

export function ProjectGanttView({ projectId }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">Planning Gantt</h3>
          <span className="rounded-full bg-facamBlueTint px-2 py-0.5 text-xs font-medium text-facamBlue">
            {MOCK_TASKS.length} tâches
          </span>
        </div>
        <div className="overflow-x-auto">
          <Gantt
            tasks={MOCK_TASKS}
            viewMode={ViewMode.Month}
            listCellWidth=""
            columnWidth={120}
            barBackgroundColor="#001b61"
            barBackgroundSelectedColor="#002a6e"
            barProgressColor="#ffae03"
            barProgressSelectedColor="#ffae03"
          />
        </div>
      </div>

      <GanttImportZone projectId={projectId} />
    </div>
  );
}
