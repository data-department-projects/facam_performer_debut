import { TaskStatusBadge } from "./TaskStatusBadge";
import type { PlannedDay, WeekTask } from "./types";

const DAY_LABELS: Record<PlannedDay, string> = {
  MON: "Lundi",
  TUE: "Mardi",
  WED: "Mercredi",
  THU: "Jeudi",
  FRI: "Vendredi",
};

const DAYS: PlannedDay[] = ["MON", "TUE", "WED", "THU", "FRI"];

type Props = {
  tasksByDay: Record<PlannedDay, WeekTask[]>;
};

export function WeekOverviewGrid({ tasksByDay }: Readonly<Props>) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {DAYS.map((day) => (
        <div
          key={day}
          className="flex flex-col gap-2 rounded-xl border border-gray200 bg-facamWhite p-3 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray500">
            {DAY_LABELS[day]}
            <span className="ml-1.5 font-normal normal-case text-gray400">
              ({tasksByDay[day].length})
            </span>
          </p>
          {tasksByDay[day].length === 0 ? (
            <p className="text-xs text-gray300">Aucune tâche</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {tasksByDay[day].map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-2 rounded-md bg-gray50 px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-facamDark">{t.title}</p>
                    {t.project && (
                      <span className="text-[10px] font-medium text-facamBlue">{t.project.code}</span>
                    )}
                  </div>
                  <TaskStatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
