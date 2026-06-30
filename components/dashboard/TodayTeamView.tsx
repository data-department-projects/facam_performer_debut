import { CheckCircle2, Circle, XCircle, Clock, Users } from "lucide-react";
import type { TodayTeamMemberRow } from "./types";

const PLANNER_STATUS_LABEL: Record<TodayTeamMemberRow["plannerStatus"], string> = {
  VALIDATED: "Validée",
  SUBMITTED: "Soumise",
  DRAFT: "En cours",
  NONE: "Non démarrée",
};

const PLANNER_STATUS_COLOR: Record<TodayTeamMemberRow["plannerStatus"], string> = {
  VALIDATED: "bg-successLight text-success",
  SUBMITTED: "bg-facamBlueTint text-facamBlue",
  DRAFT: "bg-warningLight text-warning",
  NONE: "bg-gray100 text-gray500",
};

function MiniDonut({ done, inProgress, notDone, notStarted, total }: {
  done: number;
  inProgress: number;
  notDone: number;
  notStarted: number;
  total: number;
}) {
  if (total === 0) return <span className="text-xs text-gray400">Aucune tâche</span>;

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray200 flex">
        <div className="h-full bg-success transition-all" style={{ width: `${(done / total) * 100}%` }} />
        <div className="h-full bg-facamYellow transition-all" style={{ width: `${(inProgress / total) * 100}%` }} />
        <div className="h-full bg-error transition-all" style={{ width: `${(notDone / total) * 100}%` }} />
      </div>
      <div className="flex items-center gap-2 text-[10px] text-gray500">
        {done > 0 && (
          <span className="flex items-center gap-0.5 text-success font-medium">
            <CheckCircle2 className="h-3 w-3" />{done}
          </span>
        )}
        {inProgress > 0 && (
          <span className="flex items-center gap-0.5 text-warning font-medium">
            <Clock className="h-3 w-3" />{inProgress}
          </span>
        )}
        {notDone > 0 && (
          <span className="flex items-center gap-0.5 text-error font-medium">
            <XCircle className="h-3 w-3" />{notDone}
          </span>
        )}
        {notStarted > 0 && (
          <span className="flex items-center gap-0.5 text-gray400 font-medium">
            <Circle className="h-3 w-3" />{notStarted}
          </span>
        )}
      </div>
    </div>
  );
}

function MemberStatusDot({ member }: { member: TodayTeamMemberRow }) {
  if (member.plannerStatus !== "VALIDATED") return "bg-gray300";
  if (member.notDoneToday > 0) return "bg-error";
  if (member.doneToday === member.totalTasksToday && member.totalTasksToday > 0) return "bg-success";
  return "bg-facamYellow";
}

export function TodayTeamView({ members }: { members: TodayTeamMemberRow[] }) {
  const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const today = new Date();
  const dayLabel = DAYS_FR[today.getDay()];

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <p className="mb-4 text-base font-semibold text-facamDark">Équipe — aujourd&apos;hui</p>
        <p className="text-sm text-gray400">Aucun collaborateur dans votre équipe.</p>
      </div>
    );
  }

  const doneCount = members.filter(
    (m) => m.plannerStatus === "VALIDATED" && m.doneToday === m.totalTasksToday && m.totalTasksToday > 0,
  ).length;

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite shadow-sm">
      <div className="flex items-center justify-between border-b border-gray100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-facamBlue" />
          <p className="text-base font-semibold text-facamDark">
            Équipe — <span className="text-facamBlue">{dayLabel}</span>
          </p>
        </div>
        <span className="text-xs text-gray500">
          {doneCount} / {members.length} collaborateur{members.length > 1 ? "s" : ""} à jour
        </span>
      </div>

      <ul className="divide-y divide-gray100">
        {members.map((member) => {
          const dotColor = MemberStatusDot({ member });
          return (
            <li key={member.userId} className="flex items-center gap-4 px-5 py-3.5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-facamBlueTint text-xs font-bold text-facamBlue">
                  {member.initials}
                </div>
                <span
                  className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-facamWhite ${dotColor}`}
                />
              </div>

              {/* Nom + statut semaine */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-facamBlack">
                    {member.collaboratorName}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${PLANNER_STATUS_COLOR[member.plannerStatus]}`}
                  >
                    {PLANNER_STATUS_LABEL[member.plannerStatus]}
                  </span>
                </div>
                <div className="mt-1">
                  <MiniDonut
                    done={member.doneToday}
                    inProgress={member.inProgressToday}
                    notDone={member.notDoneToday}
                    notStarted={member.notStartedToday}
                    total={member.totalTasksToday}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
