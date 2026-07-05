"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { validateWeekPlanner } from "@/actions/weekPlanner";
import type { TeamMember, PlannerStatus } from "./types";

const DAY_LABELS: Record<string, string> = {
  MON: "Lundi", TUE: "Mardi", WED: "Mercredi", THU: "Jeudi", FRI: "Vendredi",
};
const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI"];

function patchPlannerStatus(
  items: TeamMember[],
  plannerId: string,
  status: PlannerStatus,
): TeamMember[] {
  return items.map((m) =>
    m.weekPlanner.id === plannerId
      ? { ...m, weekPlanner: { ...m.weekPlanner, status } }
      : m,
  );
}

/** Encapsule l'état + la validation optimiste d'une liste de plannings (managers ou équipe). */
export function useValidatablePlanners(initialMembers: TeamMember[]) {
  const [members, setMembers] = useState(initialMembers);
  const [, startTransition] = useTransition();

  function handleValidate(weekPlannerId: string) {
    setMembers((prev) => patchPlannerStatus(prev, weekPlannerId, "VALIDATED"));
    startTransition(async () => {
      const result = await validateWeekPlanner(weekPlannerId);
      if (!result.success) {
        setMembers((prev) => patchPlannerStatus(prev, weekPlannerId, "SUBMITTED"));
      }
    });
  }

  return { members, handleValidate };
}

function ExpandChevron({ hasPlanner, expanded }: Readonly<{ hasPlanner: boolean; expanded: boolean }>) {
  if (!hasPlanner) return <span className="w-3.5" />;
  return expanded
    ? <ChevronDown size={14} className="shrink-0 text-gray400" />
    : <ChevronRight size={14} className="shrink-0 text-gray400" />;
}

function WeekTaskPreview({ tasks }: Readonly<{ tasks: NonNullable<TeamMember["weekPlanner"]["tasks"]> }>) {
  if (tasks.length === 0) {
    return (
      <p className="border-t border-gray100 px-5 py-3 text-xs text-gray400">
        Aucune tâche planifiée cette semaine.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-gray100 px-5 py-3">
      {DAY_ORDER.map((day) => {
        const dayTasks = tasks.filter((t) => t.plannedDay === day);
        if (dayTasks.length === 0) return null;
        return (
          <div key={day} className="flex gap-3 text-xs">
            <span className="w-16 shrink-0 font-semibold text-gray500">{DAY_LABELS[day]}</span>
            <span className="text-facamDark">{dayTasks.map((t) => t.title).join(" · ")}</span>
          </div>
        );
      })}
    </div>
  );
}

function PlannerStatusLabel({ status }: Readonly<{ status: PlannerStatus }>) {
  if (status === "SUBMITTED") return <p className="text-xs text-warning">En attente de validation</p>;
  if (status === "VALIDATED") return <p className="text-xs text-success">Semaine validée</p>;
  return <p className="text-xs text-gray400">Pas encore soumis</p>;
}

type Props = {
  members: TeamMember[];
  onValidate: (id: string) => void;
  title: string;
  emptyMessage: string;
};

export function TeamPlannerReviewList({ members, onValidate, title, emptyMessage }: Readonly<Props>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const submittedCount = members.filter((m) => m.weekPlanner.status === "SUBMITTED").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-facamDark">{title}</h2>
        {submittedCount > 0 && (
          <p className="mt-0.5 text-xs text-warning">
            {submittedCount} planning{submittedCount > 1 ? "s" : ""} en attente de validation
          </p>
        )}
      </div>

      {members.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-gray200 bg-facamWhite py-12 shadow-sm">
          <p className="text-sm text-gray400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {members.map((member) => {
            const hasPlanner = member.weekPlanner.id !== "";
            const expanded = expandedId === member.id;
            return (
              <div
                key={member.id}
                className="rounded-xl border border-gray200 bg-facamWhite shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => hasPlanner && setExpandedId(expanded ? null : member.id)}
                    disabled={!hasPlanner}
                    className="flex flex-1 items-center gap-3 text-left disabled:cursor-default"
                  >
                    <ExpandChevron hasPlanner={hasPlanner} expanded={expanded} />
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-facamBlue text-xs font-semibold text-facamWhite">
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-facamDark">{member.fullName}</p>
                      <PlannerStatusLabel status={member.weekPlanner.status} />
                    </div>
                  </button>

                  {member.weekPlanner.status === "SUBMITTED" && (
                    <button
                      onClick={() => onValidate(member.weekPlanner.id)}
                      className="flex-shrink-0 rounded-md bg-facamYellow px-4 py-2 text-sm font-semibold text-facamDark hover:brightness-105"
                    >
                      Valider la semaine
                    </button>
                  )}

                  {member.weekPlanner.status === "VALIDATED" && (
                    <span className="text-xs font-medium text-success">Validé ✓</span>
                  )}
                </div>

                {expanded && <WeekTaskPreview tasks={member.weekPlanner.tasks ?? []} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
