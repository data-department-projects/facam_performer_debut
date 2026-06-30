import Link from "next/link";
import { CheckCircle2, Clock, XCircle, Circle, CalendarCheck, Timer, ArrowRight } from "lucide-react";
import type { CollaboratorTodayData, TodayTask } from "./types";

const STATUS_CONFIG: Record<
  TodayTask["status"],
  { icon: React.ElementType; color: string; label: string; bg: string }
> = {
  DONE: { icon: CheckCircle2, color: "text-success", label: "Terminé", bg: "bg-successLight" },
  IN_PROGRESS: { icon: Clock, color: "text-warning", label: "En cours", bg: "bg-warningLight" },
  NOT_DONE: { icon: XCircle, color: "text-error", label: "Non terminé", bg: "bg-errorLight" },
  STARTED: { icon: Circle, color: "text-gray500", label: "Débuté", bg: "bg-gray100" },
};

const PLANNER_STATUS_CHIP: Record<string, { label: string; color: string }> = {
  VALIDATED: { label: "Semaine validée", color: "bg-successLight text-success" },
  SUBMITTED: { label: "En attente de validation", color: "bg-facamBlueTint text-facamBlue" },
  DRAFT: { label: "Brouillon — soumettre", color: "bg-warningLight text-warning" },
  NONE: { label: "Non planifiée", color: "bg-gray100 text-gray500" },
};

function TaskRow({ task }: { task: TodayTask }) {
  const cfg = STATUS_CONFIG[task.status];
  const Icon = cfg.icon;

  return (
    <li className="flex items-start gap-3 py-3">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-facamBlack leading-snug">{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray500">
          {task.projectName && (
            <span className="rounded-sm bg-facamBlueTint px-1.5 py-0.5 text-[10px] font-medium text-facamBlue">
              {task.projectName}
            </span>
          )}
          <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
        {task.status === "NOT_DONE" && task.comment && (
          <p className="mt-1 rounded-md bg-errorLight px-2 py-1 text-xs text-error leading-relaxed">
            💬 {task.comment}
          </p>
        )}
      </div>
    </li>
  );
}

function WeekProgress({ tasks }: { tasks: TodayTask[] }) {
  const done = tasks.filter((t) => t.status === "DONE").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray200">
        <div
          className="h-full rounded-full bg-success transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-semibold text-success">{done}/{total}</span>
    </div>
  );
}

export function CollaboratorTodayPanel({ data }: { data: CollaboratorTodayData }) {
  const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const dayLabel = DAYS_FR[new Date().getDay()];

  const nextWeekChip = PLANNER_STATUS_CHIP[data.nextWeekPlannerStatus];
  const currentChip = PLANNER_STATUS_CHIP[data.weekPlannerStatus];

  const hasTasks = data.tasks.length > 0;
  const plannerValidated = data.weekPlannerStatus === "VALIDATED";

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray100 px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-facamBlue" />
          <p className="text-base font-semibold text-facamDark">
            Ma journée — <span className="text-facamBlue">{dayLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.hoursToday > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray500">
              <Timer className="h-3.5 w-3.5" />
              {data.hoursToday}h déclarée{data.hoursToday > 1 ? "s" : ""}
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${currentChip.color}`}>
            {currentChip.label}
          </span>
        </div>
      </div>

      {/* Tâches du jour */}
      <div className="px-5">
        {!plannerValidated ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warningLight">
              <CalendarCheck className="h-6 w-6 text-warning" />
            </div>
            <p className="text-sm font-medium text-facamDark">Planning non encore validé</p>
            <p className="text-xs text-gray400">
              Vos tâches du jour ne sont visibles qu&apos;après la validation de votre semaine par votre manager.
            </p>
            {data.weekPlannerStatus === "DRAFT" || data.weekPlannerStatus === "NONE" ? (
              <Link
                href="/week-planner"
                className="flex items-center gap-1 rounded-lg bg-facamBlue px-4 py-2 text-sm font-medium text-facamWhite hover:bg-facamBlueMid"
              >
                Planifier ma semaine
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <p className="text-xs text-facamBlue font-medium">
                Planning soumis — en attente de validation manager
              </p>
            )}
          </div>
        ) : !hasTasks ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-medium text-gray500">Aucune tâche planifiée aujourd&apos;hui</p>
            <p className="text-xs text-gray400">Profitez-en pour avancer sur vos objectifs.</p>
          </div>
        ) : (
          <>
            <div className="py-3 border-b border-gray100">
              <WeekProgress tasks={data.tasks} />
            </div>
            <ul className="divide-y divide-gray100">
              {data.tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Footer — planning semaine prochaine */}
      <div
        className={`flex items-center justify-between border-t border-gray100 px-5 py-3 ${data.nextWeekPlannerStatus === "NONE" || data.nextWeekPlannerStatus === "DRAFT" ? "bg-warningLight/30" : ""}`}
      >
        <div className="flex items-center gap-2 text-xs text-gray500">
          <span>Semaine prochaine :</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${nextWeekChip.color}`}>
            {nextWeekChip.label}
          </span>
        </div>
        <Link
          href="/week-planner"
          className="flex items-center gap-1 text-xs font-medium text-facamBlue hover:underline"
        >
          Gérer mon planning
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
