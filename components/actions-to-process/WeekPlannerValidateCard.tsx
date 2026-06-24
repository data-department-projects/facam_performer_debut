import Link from "next/link";
import { ChevronRight, CalendarCheck } from "lucide-react";
import type { PendingWeekPlanner } from "@/components/actions-to-process/types";

type Props = {
  planner: PendingWeekPlanner;
};

export function WeekPlannerValidateCard({ planner }: Props) {
  const start = new Date(planner.weekStartDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const end = new Date(planner.weekEndDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between rounded-[--radius-xl] border border-[--color-gray-200] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[--radius-lg] bg-[--color-successLight]">
          <CalendarCheck className="h-5 w-5 text-[--color-success]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[--color-facamDark]">{planner.collaboratorName}</p>
          <p className="text-xs text-[--color-gray-500]">
            Semaine du {start} au {end}
          </p>
          <p className="text-xs text-[--color-gray-400]">
            {planner.taskCount} tâche{planner.taskCount > 1 ? "s" : ""} planifiée
            {planner.taskCount > 1 ? "s" : ""} &mdash; Soumis le{" "}
            {new Date(planner.submittedAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
      <Link
        href="/week-planner"
        className="flex flex-shrink-0 items-center gap-1 rounded-[--radius-md] border border-[--color-gray-200] px-3 py-1.5 text-xs font-medium text-[--color-facamBlue] transition-colors hover:bg-[--color-facamBlueTint]"
      >
        Valider
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
