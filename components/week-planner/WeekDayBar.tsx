"use client";

import type { MockWeekTask, PlannedDay } from "./types";

const DAY_CONFIG: { key: PlannedDay; short: string }[] = [
  { key: "MON", short: "Lun" },
  { key: "TUE", short: "Mar" },
  { key: "WED", short: "Mer" },
  { key: "THU", short: "Jeu" },
  { key: "FRI", short: "Ven" },
];

type Props = {
  activeDay: PlannedDay;
  weekMonday: Date;
  tasksByDay: Record<PlannedDay, MockWeekTask[]>;
  onSelectDay: (day: PlannedDay) => void;
};

function getDotColor(tasks: MockWeekTask[], isActive: boolean): string | null {
  if (tasks.length === 0) return null;
  if (isActive) return "bg-facamWhite/60";
  if (tasks.some((t) => t.status === "NOT_DONE")) return "bg-error";
  if (tasks.some((t) => t.status === "IN_PROGRESS")) return "bg-warning";
  if (tasks.every((t) => t.status === "DONE")) return "bg-success";
  return "bg-gray300";
}

export function WeekDayBar({ activeDay, weekMonday, tasksByDay, onSelectDay }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-5 gap-2">
      {DAY_CONFIG.map(({ key, short }, i) => {
        const date = new Date(weekMonday);
        date.setDate(weekMonday.getDate() + i);
        const isActive = activeDay === key;
        const isToday = date.getTime() === today.getTime();
        const tasks = tasksByDay[key] ?? [];
        const dotColor = getDotColor(tasks, isActive);

        return (
          <button
            key={key}
            onClick={() => onSelectDay(key)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all ${
              isActive
                ? "border-facamBlue bg-facamBlue text-facamWhite shadow-md"
                : isToday
                  ? "border-facamBlue bg-facamBlueTint/40 text-facamDark"
                  : "border-gray200 bg-facamWhite text-gray500 hover:border-facamBlue/30 hover:bg-gray50 hover:text-facamDark"
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest">{short}</span>
            <span className="text-xl font-bold leading-none">{date.getDate()}</span>
            <div className="flex h-4 items-center gap-1">
              {dotColor && <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor}`} />}
              <span className={`text-[10px] leading-none ${isActive ? "text-facamWhite/70" : "text-gray400"}`}>
                {tasks.length > 0 ? tasks.length : "—"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
