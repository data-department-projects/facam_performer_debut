"use client";

import { useState } from "react";
import { CollaboratorWeekPlannerView } from "./CollaboratorWeekPlannerView";
import { EmptyWeekView } from "./EmptyWeekView";
import { WeekNav } from "./WeekNav";
import { TeamPlannerReviewList, useValidatablePlanners } from "./TeamPlannerReviewList";
import type {
  TeamMember,
  WeekPlannerData,
  ConfirmedProject,
  AssignedGanttTask,
} from "./types";

type Tab = "planning" | "managers";

const TABS: { key: Tab; label: string }[] = [
  { key: "planning", label: "Mon Planning" },
  { key: "managers", label: "Managers" },
];

type SimpleTaskOption = { id: string; title: string };

type Props = {
  managers: TeamMember[];
  ownPlanner: WeekPlannerData | null;
  confirmedProjects: ConfirmedProject[];
  assignedGanttTasks?: AssignedGanttTask[];
  myAssignedTasks?: SimpleTaskOption[];
  myPersonalTasks?: SimpleTaskOption[];
  weekStartDate: string;
  weekLabel: string;
};

export function AdminWeekPlannerView({
  managers: initialManagers,
  ownPlanner,
  confirmedProjects,
  assignedGanttTasks,
  myAssignedTasks,
  myPersonalTasks,
  weekStartDate,
  weekLabel,
}: Readonly<Props>) {
  const [activeTab, setActiveTab] = useState<Tab>("planning");
  const { members: managers, handleValidate } = useValidatablePlanners(initialManagers);

  const submittedCount = managers.filter((m) => m.weekPlanner.status === "SUBMITTED").length;

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
            myAssignedTasks={myAssignedTasks}
            myPersonalTasks={myPersonalTasks}
            weekStartDate={weekStartDate}
            noValidation
            hideWeekNav
          />
        ) : (
          <EmptyWeekView weekStartDate={weekStartDate} weekLabel={weekLabel} />
        )
      ) : (
        <TeamPlannerReviewList
          members={managers}
          onValidate={handleValidate}
          title="Week Planners des Managers"
          emptyMessage="Aucun manager à superviser."
        />
      )}
    </div>
  );
}
