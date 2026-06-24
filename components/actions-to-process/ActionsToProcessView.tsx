"use client";

import { CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectConfirmCard } from "@/components/actions-to-process/ProjectConfirmCard";
import { WeekPlannerValidateCard } from "@/components/actions-to-process/WeekPlannerValidateCard";
import { CommitteeActionOverdueCard } from "@/components/actions-to-process/CommitteeActionOverdueCard";
import type { ActionsToProcessData } from "@/components/actions-to-process/types";

type Props = {
  role: "ADMIN" | "MANAGER";
  data: ActionsToProcessData;
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CheckCircle2 className="mb-3 h-10 w-10 text-[--color-success]" />
      <p className="text-sm font-medium text-[--color-gray-600]">Aucune action en attente</p>
      <p className="mt-1 text-xs text-[--color-gray-400]">Tout est à jour dans cette catégorie.</p>
    </div>
  );
}

export function ActionsToProcessView({ role, data }: Props) {
  const { pendingProjects, pendingWeekPlanners, overdueActions } = data;

  const defaultTab = role === "ADMIN" ? "projects" : "planners";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList className="flex gap-1 rounded-[--radius-lg] bg-[--color-gray-100] p-1">
        {role === "ADMIN" && (
          <TabsTrigger
            value="projects"
            className="rounded-[--radius-md] px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[--color-facamBlue] data-[state=active]:shadow-sm"
          >
            Projets à confirmer
            {pendingProjects.length > 0 && (
              <span className="ml-2 rounded-full bg-[--color-facamBlue] px-1.5 py-0.5 text-xs font-medium text-white">
                {pendingProjects.length}
              </span>
            )}
          </TabsTrigger>
        )}
        <TabsTrigger
          value="planners"
          className="rounded-[--radius-md] px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[--color-facamBlue] data-[state=active]:shadow-sm"
        >
          Semaines à valider
          {pendingWeekPlanners.length > 0 && (
            <span className="ml-2 rounded-full bg-[--color-facamBlue] px-1.5 py-0.5 text-xs font-medium text-white">
              {pendingWeekPlanners.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="committee-actions"
          className="rounded-[--radius-md] px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-[--color-facamBlue] data-[state=active]:shadow-sm"
        >
          Actions comité
          {overdueActions.length > 0 && (
            <span className="ml-2 rounded-full bg-[--color-error] px-1.5 py-0.5 text-xs font-medium text-white">
              {overdueActions.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {role === "ADMIN" && (
        <TabsContent value="projects" className="space-y-3">
          {pendingProjects.length === 0 ? (
            <EmptyState />
          ) : (
            pendingProjects.map((project) => (
              <ProjectConfirmCard key={project.id} project={project} />
            ))
          )}
        </TabsContent>
      )}

      <TabsContent value="planners" className="space-y-3">
        {pendingWeekPlanners.length === 0 ? (
          <EmptyState />
        ) : (
          pendingWeekPlanners.map((planner) => (
            <WeekPlannerValidateCard key={planner.id} planner={planner} />
          ))
        )}
      </TabsContent>

      <TabsContent value="committee-actions" className="space-y-3">
        {overdueActions.length === 0 ? (
          <EmptyState />
        ) : (
          overdueActions.map((action) => (
            <CommitteeActionOverdueCard key={action.id} action={action} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
