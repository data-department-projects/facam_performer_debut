"use client";

import { useState, useTransition } from "react";
import { validateWeekPlanner } from "@/actions/weekPlanner";
import type { TeamMember, PlannerStatus } from "./types";

type Props = {
  members: TeamMember[];
};

export function ManagerWeekPlannerView({ members: initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [, startTransition] = useTransition();

  function handleValidate(weekPlannerId: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.weekPlanner.id === weekPlannerId
          ? { ...m, weekPlanner: { ...m.weekPlanner, status: "VALIDATED" as const } }
          : m,
      ),
    );

    startTransition(async () => {
      const result = await validateWeekPlanner(weekPlannerId);
      if (!result.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.weekPlanner.id === weekPlannerId
              ? { ...m, weekPlanner: { ...m.weekPlanner, status: "SUBMITTED" as const } }
              : m,
          ),
        );
      }
    });
  }

  const submittedCount = members.filter((m) => m.weekPlanner.status === "SUBMITTED").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-facamDark">Week Planners de mon équipe</h2>
        {submittedCount > 0 && (
          <p className="mt-0.5 text-xs text-warning">
            {submittedCount} planning{submittedCount > 1 ? "s" : ""} en attente de validation
          </p>
        )}
      </div>

      {members.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-gray200 bg-facamWhite py-12 shadow-sm">
          <p className="text-sm text-gray400">Aucun membre dans votre équipe.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray200 bg-facamWhite px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-facamBlue text-xs font-semibold text-facamWhite">
                  {member.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-facamDark">{member.fullName}</p>
                  <MemberStatusLabel status={member.weekPlanner.status} />
                </div>
              </div>

              {member.weekPlanner.status === "SUBMITTED" && (
                <button
                  onClick={() => handleValidate(member.weekPlanner.id)}
                  className="flex-shrink-0 rounded-md bg-facamYellow px-4 py-2 text-sm font-semibold text-facamDark hover:brightness-105"
                >
                  Valider la semaine
                </button>
              )}

              {member.weekPlanner.status === "VALIDATED" && (
                <span className="text-xs font-medium text-success">Validé ✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberStatusLabel({ status }: { status: PlannerStatus }) {
  if (status === "SUBMITTED") {
    return <p className="text-xs text-warning">En attente de validation</p>;
  }
  if (status === "VALIDATED") {
    return <p className="text-xs text-success">Semaine validée</p>;
  }
  return <p className="text-xs text-gray400">Pas encore soumis</p>;
}
