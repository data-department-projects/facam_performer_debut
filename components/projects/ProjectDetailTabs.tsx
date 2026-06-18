"use client";

import { useState } from "react";
import { ProjectFicheView, type MockProjectDetail } from "@/components/projects/ProjectFicheView";
import { ProjectGanttView } from "@/components/projects/ProjectGanttView";
import { ProjectMilestonesList, type MockMilestone } from "@/components/projects/ProjectMilestonesList";

type Tab = "fiche" | "gantt" | "jalons";

type Props = {
  project: MockProjectDetail;
  milestones: MockMilestone[];
  projectId: string;
  isEditable: boolean;
};

export function ProjectDetailTabs({ project, milestones, projectId, isEditable }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("fiche");

  const tabs: { id: Tab; label: string }[] = [
    { id: "fiche", label: "Fiche projet" },
    { id: "gantt", label: "Planning Gantt" },
    { id: "jalons", label: "Jalons" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Onglets */}
      <div className="flex gap-1 rounded-xl border border-gray200 bg-facamWhite p-1 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-facamBlue text-facamWhite shadow-sm"
                : "text-gray500 hover:bg-gray50 hover:text-facamDark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "fiche" && <ProjectFicheView project={project} />}
      {activeTab === "gantt" && <ProjectGanttView projectId={projectId} />}
      {activeTab === "jalons" && (
        <ProjectMilestonesList
          milestones={milestones}
          projectId={projectId}
          isEditable={isEditable}
        />
      )}
    </div>
  );
}
