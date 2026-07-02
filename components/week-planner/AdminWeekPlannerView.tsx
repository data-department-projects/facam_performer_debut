"use client";

import { useState, useTransition } from "react";
import { validateWeekPlanner } from "@/actions/weekPlanner";
import { CollaboratorWeekPlannerView } from "./CollaboratorWeekPlannerView";
import { EmptyWeekView } from "./EmptyWeekView";
import type {
  TeamMember,
  PlannerStatus,
  WeekPlannerData,
  ConfirmedProject,
  AssignedGanttTask,
} from "./types";

type Tab = "planning" | "managers";

const TABS: { key: Tab; label: string }[] = [
  { key: "planning", label: "Mon Planning" },
  { key: "managers", label: "Managers" },
];

type Props = {
  managers: TeamMember[];
  ownPlanner: WeekPlannerData | null;
  confirmedProjects: ConfirmedProject[];
  assignedGanttTasks?: AssignedGanttTask[];
  weekStartDate: string;
  weekLabel: string;
};

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

export function AdminWeekPlannerView({
  managers: initialManagers,
  ownPlanner,
  confirmedProjects,
  assignedGanttTasks,
  weekStartDate,
  weekLabel,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("planning");
  const [managers, setManagers] = useState(initialManagers);
  const [, startTransition] = useTransition();

  const submittedCount = managers.filter((m) => m.weekPlanner.status === "SUBMITTED").length;

  function handleValidate(weekPlannerId: string) {
    setManagers((prev) => patchPlannerStatus(prev, weekPlannerId, "VALIDATED"));
    startTransition(async () => {
      const result = await validateWeekPlanner(weekPlannerId);
      if (!result.success) {
        setManagers((prev) => patchPlannerStatus(prev, weekPlannerId, "SUBMITTED"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Onglets */}
      <div className="flex border-b border-gray200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-facamBlue text-facamBlue"
                : "border-transparent text-gray500 hover:text-facamDark"
            }`}
          >
            {tab.label}
            {tab.key === "managers" && submittedCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-facamYellow px-1.5 text-[10px] font-bold text-facamDark">
                {submittedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "planning" ? (
        ownPlanner ? (
          <CollaboratorWeekPlannerView
            planner={ownPlanner}
            confirmedProjects={confirmedProjects}
            assignedGanttTasks={assignedGanttTasks}
            weekStartDate={weekStartDate}
            noValidation
          />
        ) : (
          <EmptyWeekView weekStartDate={weekStartDate} weekLabel={weekLabel} />
        )
      ) : (
        <ManagersList managers={managers} onValidate={handleValidate} />
      )}
    </div>
  );
}

// ── Vue liste des managers ──────────────────────────────────────────────────

function ManagersList({
  managers,
  onValidate,
}: {
  managers: TeamMember[];
  onValidate: (id: string) => void;
}) {
  const submittedCount = managers.filter((m) => m.weekPlanner.status === "SUBMITTED").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-facamDark">Week Planners des Managers</h2>
        {submittedCount > 0 && (
          <p className="mt-0.5 text-xs text-warning">
            {submittedCount} planning{submittedCount > 1 ? "s" : ""} en attente de validation
          </p>
        )}
      </div>

      {managers.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-gray200 bg-facamWhite py-12 shadow-sm">
          <p className="text-sm text-gray400">Aucun manager à superviser.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {managers.map((manager) => (
            <div
              key={manager.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray200 bg-facamWhite px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-facamBlue text-xs font-semibold text-facamWhite">
                  {manager.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-facamDark">{manager.fullName}</p>
                  <ManagerStatusLabel status={manager.weekPlanner.status} />
                </div>
              </div>

              {manager.weekPlanner.status === "SUBMITTED" && (
                <button
                  onClick={() => onValidate(manager.weekPlanner.id)}
                  className="flex-shrink-0 rounded-md bg-facamYellow px-4 py-2 text-sm font-semibold text-facamDark hover:brightness-105"
                >
                  Valider la semaine
                </button>
              )}

              {manager.weekPlanner.status === "VALIDATED" && (
                <span className="text-xs font-medium text-success">Validé ✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManagerStatusLabel({ status }: { status: PlannerStatus }) {
  if (status === "SUBMITTED") return <p className="text-xs text-warning">En attente de validation</p>;
  if (status === "VALIDATED") return <p className="text-xs text-success">Semaine validée</p>;
  return <p className="text-xs text-gray400">Pas encore soumis</p>;
}
