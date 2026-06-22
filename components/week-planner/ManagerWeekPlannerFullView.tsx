"use client";

import { useState } from "react";
import { CollaboratorWeekPlannerView } from "./CollaboratorWeekPlannerView";
import { ManagerWeekPlannerView } from "./ManagerWeekPlannerView";
import { EmptyWeekView } from "./EmptyWeekView";
import type { WeekPlannerData, ConfirmedProject, TeamMember } from "./types";

type Props = {
  ownPlanner: WeekPlannerData | null;
  confirmedProjects: ConfirmedProject[];
  weekStartDate: string;
  weekLabel: string;
  teamMembers: TeamMember[];
};

type Tab = "planning" | "team";

const TABS: { key: Tab; label: string }[] = [
  { key: "planning", label: "Mon Planning" },
  { key: "team", label: "Mon Équipe" },
];

export function ManagerWeekPlannerFullView({ ownPlanner, confirmedProjects, weekStartDate, weekLabel, teamMembers }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("planning");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex border-b border-gray200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-facamBlue text-facamBlue"
                : "border-transparent text-gray500 hover:text-facamDark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "planning" ? (
        ownPlanner ? (
          <CollaboratorWeekPlannerView
            planner={ownPlanner}
            confirmedProjects={confirmedProjects}
            weekStartDate={weekStartDate}
            validatorLabel="l'Administrateur"
          />
        ) : (
          <EmptyWeekView weekStartDate={weekStartDate} weekLabel={weekLabel} />
        )
      ) : (
        <ManagerWeekPlannerView members={teamMembers} />
      )}
    </div>
  );
}
