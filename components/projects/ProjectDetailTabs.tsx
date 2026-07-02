"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { ProjectFicheView, type MockProjectDetail } from "@/components/projects/ProjectFicheView";
import {
  ProjectGanttView,
  type GanttTaskData,
  type GanttTeamMember,
} from "@/components/projects/ProjectGanttView";
import { ProjectMilestonesList, type MockMilestone } from "@/components/projects/ProjectMilestonesList";
import { ProjectConfirmationPanel } from "@/components/projects/ProjectConfirmationPanel";
import { ProjectExpensesList, type ProjectExpense } from "@/components/projects/ProjectExpensesList";
import { ProjectForm } from "@/components/projects/ProjectForm";
import type { ProjectInput } from "@/lib/schemas/project";

type Tab = "fiche" | "gantt" | "jalons" | "finances";

type UserOption = { id: string; fullName: string };
type DepartmentOption = { id: string; name: string };

type Props = {
  project: MockProjectDetail;
  milestones: MockMilestone[];
  expenses: ProjectExpense[];
  ganttTasks: GanttTaskData[];
  teamMembersForGantt: GanttTeamMember[];
  projectId: string;
  isEditable: boolean;
  isAdmin: boolean;
  currentUserId: string;
  confirmedAt?: string;
  confirmedByName?: string;
  canEditFiche?: boolean;
  editDefaultValues?: ProjectInput;
  users?: UserOption[];
  departments?: DepartmentOption[];
};

export function ProjectDetailTabs({ project, milestones, expenses, ganttTasks, teamMembersForGantt, projectId, isEditable, isAdmin, currentUserId, confirmedAt, confirmedByName, canEditFiche, editDefaultValues, users, departments }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("fiche");
  const [editing, setEditing] = useState(false);

  function handleEditSuccess() {
    setEditing(false);
    router.refresh();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "fiche", label: "Fiche projet" },
    { id: "gantt", label: "Planning Gantt" },
    { id: "jalons", label: "Jalons" },
    { id: "finances", label: "Finances" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Panel de confirmation — Admin uniquement */}
      {isAdmin && (
        <ProjectConfirmationPanel
          projectId={projectId}
          isConfirmed={project.isConfirmed}
          confirmedAt={confirmedAt}
          confirmedByName={confirmedByName}
          confirmationNote={project.confirmationNote}
        />
      )}

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
      {activeTab === "fiche" && (
        editing && canEditFiche && editDefaultValues && users && departments ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-facamDark">Modifier la fiche projet</h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray200 bg-facamWhite px-3 py-1.5 text-sm text-gray600 hover:bg-gray50 transition-colors"
              >
                <X size={14} />
                Annuler
              </button>
            </div>
            <ProjectForm
              users={users}
              departments={departments}
              projectId={projectId}
              defaultValues={editDefaultValues}
              onSuccess={handleEditSuccess}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {canEditFiche && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-facamBlue px-4 py-2 text-sm font-medium text-facamWhite hover:bg-facamBlueMid transition-colors"
                >
                  <Pencil size={14} />
                  Modifier la fiche
                </button>
              </div>
            )}
            <ProjectFicheView project={project} />
          </div>
        )
      )}
      {activeTab === "gantt" && (
        <ProjectGanttView
          projectId={projectId}
          tasks={ganttTasks}
          teamMembers={teamMembersForGantt}
          isEditable={isEditable}
          currentUserId={currentUserId}
        />
      )}
      {activeTab === "jalons" && (
        <ProjectMilestonesList
          milestones={milestones}
          projectId={projectId}
          isEditable={isEditable}
          teamMembers={teamMembersForGantt}
        />
      )}
      {activeTab === "finances" && (
        <ProjectExpensesList
          expenses={expenses}
          projectId={projectId}
          initialBudget={project.initialBudget}
          isEditable={isEditable}
        />
      )}
    </div>
  );
}
