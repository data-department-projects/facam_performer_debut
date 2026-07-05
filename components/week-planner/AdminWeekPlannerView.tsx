"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { validateWeekPlanner } from "@/actions/weekPlanner";
import { CollaboratorWeekPlannerView } from "./CollaboratorWeekPlannerView";
import { EmptyWeekView } from "./EmptyWeekView";
import { WeekNav } from "./WeekNav";
import type {
  TeamMember,
  PlannerStatus,
  WeekPlannerData,
  ConfirmedProject,
  AssignedGanttTask,
} from "./types";

const DAY_LABELS: Record<string, string> = {
  MON: "Lundi", TUE: "Mardi", WED: "Mercredi", THU: "Jeudi", FRI: "Vendredi",
};
const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI"];

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
}: Readonly<Props>) {
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
      {/* Navigation semaine — partagée entre les deux onglets */}
      <WeekNav weekStartDate={weekStartDate} weekLabel={weekLabel} />

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
            hideWeekNav
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
}: Readonly<{
  managers: TeamMember[];
  onValidate: (id: string) => void;
}>) {
  const submittedCount = managers.filter((m) => m.weekPlanner.status === "SUBMITTED").length;
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          {managers.map((manager) => {
            const hasPlanner = manager.weekPlanner.id !== "";
            const expanded = expandedId === manager.id;
            return (
              <div
                key={manager.id}
                className="rounded-xl border border-gray200 bg-facamWhite shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => hasPlanner && setExpandedId(expanded ? null : manager.id)}
                    disabled={!hasPlanner}
                    className="flex flex-1 items-center gap-3 text-left disabled:cursor-default"
                  >
                    <ExpandChevron hasPlanner={hasPlanner} expanded={expanded} />
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-facamBlue text-xs font-semibold text-facamWhite">
                      {manager.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-facamDark">{manager.fullName}</p>
                      <ManagerStatusLabel status={manager.weekPlanner.status} />
                    </div>
                  </button>

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

                {expanded && <WeekTaskPreview tasks={manager.weekPlanner.tasks ?? []} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExpandChevron({ hasPlanner, expanded }: Readonly<{ hasPlanner: boolean; expanded: boolean }>) {
  if (!hasPlanner) return <span className="w-3.5" />;
  return expanded
    ? <ChevronDown size={14} className="shrink-0 text-gray400" />
    : <ChevronRight size={14} className="shrink-0 text-gray400" />;
}

// ── Aperçu en lecture seule des tâches planifiées ────────────────────────────

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

function ManagerStatusLabel({ status }: Readonly<{ status: PlannerStatus }>) {
  if (status === "SUBMITTED") return <p className="text-xs text-warning">En attente de validation</p>;
  if (status === "VALIDATED") return <p className="text-xs text-success">Semaine validée</p>;
  return <p className="text-xs text-gray400">Pas encore soumis</p>;
}
