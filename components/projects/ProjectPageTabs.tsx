"use client";

import { useState } from "react";
import { ProjectList, type MockProject } from "@/components/projects/ProjectList";
import { MyProjectTasksView, type MyProjectEntry } from "@/components/projects/MyProjectTasksView";
import {
  AssignedTasksManagerView,
  type ManagerAssignedTask,
} from "@/components/projects/AssignedTasksManagerView";
import { MyPersonalTasksSection, type MyPersonalTask } from "@/components/projects/MyPersonalTasksSection";
import { MyAssignedTasksSection, type MyAssignedTask } from "@/components/projects/MyAssignedTasksSection";

type Tab = "all" | "mine" | "assignedTasks" | "myAssigned" | "personal";

type SimpleUser = { id: string; fullName: string };

type Props = {
  projects: MockProject[];
  myProjects: MyProjectEntry[];
  personalTasks: MyPersonalTask[];
  assignedTasksSection?: {
    tasks: ManagerAssignedTask[];
    eligibleAssignees: SimpleUser[];
  };
  myAssignedTasks?: MyAssignedTask[];
  isAdmin?: boolean;
};

export function ProjectPageTabs({ projects, myProjects, personalTasks, assignedTasksSection, myAssignedTasks, isAdmin }: Readonly<Props>) {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const totalMyTasks = myProjects.reduce((acc, p) => acc + p.tasks.length, 0);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "Tous les projets", count: projects.length },
    { id: "mine", label: "Mes projets & tâches", count: totalMyTasks },
    ...(assignedTasksSection
      ? [{ id: "assignedTasks" as const, label: "Tâches indépendantes", count: assignedTasksSection.tasks.length }]
      : []),
    ...(myAssignedTasks
      ? [{ id: "myAssigned" as const, label: "Tâches qui me sont assignées", count: myAssignedTasks.length }]
      : []),
    { id: "personal", label: "Mes tâches personnelles", count: personalTasks.length },
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
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-facamBlue text-facamWhite shadow-sm"
                : "text-gray500 hover:bg-gray50 hover:text-facamDark"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  activeTab === tab.id
                    ? "bg-white/20 text-facamWhite"
                    : "bg-gray100 text-gray500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "all" && <ProjectList projects={projects} />}
      {activeTab === "mine" && <MyProjectTasksView projects={myProjects} />}
      {activeTab === "assignedTasks" && assignedTasksSection && (
        <AssignedTasksManagerView
          tasks={assignedTasksSection.tasks}
          eligibleAssignees={assignedTasksSection.eligibleAssignees}
          isAdmin={isAdmin}
        />
      )}
      {activeTab === "myAssigned" && myAssignedTasks && (
        <MyAssignedTasksSection tasks={myAssignedTasks} />
      )}
      {activeTab === "personal" && <MyPersonalTasksSection tasks={personalTasks} />}
    </div>
  );
}
