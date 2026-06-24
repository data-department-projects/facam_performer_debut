"use client";

import { useState } from "react";
import type { ObjectiveWithKeyResults } from "./types";
import { CollaboratorObjectivesView } from "./CollaboratorObjectivesView";
import { ManagerObjectivesView } from "./ManagerObjectivesView";

type Tab = "own" | "team";

const TABS: { key: Tab; label: string }[] = [
  { key: "own", label: "Mes Objectifs" },
  { key: "team", label: "Mon Équipe" },
];

type Props = {
  ownObjectives: ObjectiveWithKeyResults[];
  teamObjectives: ObjectiveWithKeyResults[];
};

export function ManagerObjectivesFullView({ ownObjectives, teamObjectives }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("own");

  return (
    <div className="flex flex-col gap-5">
      {/* Onglets */}
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

      {activeTab === "own" ? (
        <CollaboratorObjectivesView initialObjectives={ownObjectives} />
      ) : (
        <ManagerObjectivesView teamObjectives={teamObjectives} />
      )}
    </div>
  );
}
