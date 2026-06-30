import Link from "next/link";
import { Flag, AlertTriangle, Clock } from "lucide-react";
import type { MilestoneRow } from "./types";

function DaysChip({ daysUntil, isOverdue }: { daysUntil: number; isOverdue: boolean }) {
  if (isOverdue) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-errorLight px-2 py-0.5 text-[10px] font-semibold text-error">
        <AlertTriangle className="h-3 w-3" />
        {Math.abs(daysUntil)}j de retard
      </span>
    );
  }
  if (daysUntil <= 3) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-warningLight px-2 py-0.5 text-[10px] font-semibold text-warning">
        <Clock className="h-3 w-3" />
        Dans {daysUntil}j
      </span>
    );
  }
  return (
    <span className="rounded-full bg-facamBlueTint px-2 py-0.5 text-[10px] font-medium text-facamBlue">
      Dans {daysUntil}j
    </span>
  );
}

export function UpcomingMilestones({ milestones }: { milestones: MilestoneRow[] }) {
  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray100 px-5 py-4">
        <Flag className="h-4 w-4 text-facamBlue" />
        <p className="text-base font-semibold text-facamDark">Jalons à venir</p>
        <span className="ml-auto rounded-full bg-facamBlueTint px-2 py-0.5 text-[10px] font-semibold text-facamBlue">
          14 jours
        </span>
      </div>

      <div className="p-4">
        {milestones.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray400">
            Aucun jalon dans les 14 prochains jours.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray100">
            {milestones.map((ms) => (
              <li key={ms.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ms.isOverdue ? "bg-errorLight" : "bg-facamBlueTint"}`}
                >
                  <Flag
                    className={`h-4 w-4 ${ms.isOverdue ? "text-error" : "text-facamBlue"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-facamBlack">{ms.title}</p>
                  <p className="text-xs text-gray500">
                    <span className="font-medium text-facamBlue">{ms.projectCode}</span>
                    {" · "}{ms.projectName}
                    {" · "}{ms.targetDate}
                  </p>
                </div>
                <DaysChip daysUntil={ms.daysUntil} isOverdue={ms.isOverdue} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {milestones.length > 0 && (
        <div className="border-t border-gray100 px-5 py-3">
          <Link
            href="/projects"
            className="text-xs font-medium text-facamBlue hover:underline"
          >
            Voir tous les projets →
          </Link>
        </div>
      )}
    </div>
  );
}
