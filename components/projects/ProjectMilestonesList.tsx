"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { deleteMilestone } from "@/actions/projects";
import { MilestoneFormModal } from "@/components/projects/MilestoneFormModal";
import { MilestoneStatusBadge } from "@/components/projects/MilestoneStatusBadge";
import type { MilestoneStatus } from "@/lib/schemas/project";

export type MockMilestone = {
  id: string;
  title: string;
  targetDate: string;
  achievedDate?: string;
  responsibleUserName?: string;
  status?: MilestoneStatus;
};

type TeamMemberOption = { id: string; fullName: string };

type Props = {
  milestones: MockMilestone[];
  projectId: string;
  isEditable?: boolean;
  teamMembers?: TeamMemberOption[];
};

export function ProjectMilestonesList({
  milestones,
  projectId,
  isEditable = false,
  teamMembers = [],
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (milestoneId: string) => {
    setDeletingId(milestoneId);
    startTransition(async () => {
      await deleteMilestone(milestoneId, projectId);
      setDeletingId(null);
    });
  };

  return (
    <>
      <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">Jalons du projet</h3>
          {isEditable && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-facamBlue px-3 py-1.5 text-xs font-semibold text-facamWhite hover:bg-facamDark transition-colors"
            >
              <Plus size={13} />
              Ajouter un jalon
            </button>
          )}
        </div>

        {milestones.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray400">Aucun jalon défini pour ce projet.</p>
            {isEditable && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="mt-3 text-xs font-medium text-facamBlue hover:underline"
              >
                Ajouter le premier jalon
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {milestones.map((milestone, index) => {
              const isAchieved = !!milestone.achievedDate;
              const isLast = index === milestones.length - 1;
              const isDeleting = deletingId === milestone.id && isPending;

              return (
                <div key={milestone.id} className="flex gap-4">
                  {/* Indicateur vertical */}
                  <div className="flex flex-col items-center">
                    {isAchieved ? (
                      <CheckCircle2 size={20} className="text-success flex-shrink-0" />
                    ) : (
                      <Circle size={20} className="text-gray300 flex-shrink-0" />
                    )}
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${isAchieved ? "bg-success" : "bg-gray200"}`}
                      />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex flex-1 items-start justify-between pb-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isAchieved ? "text-facamDark" : "text-facamBlack"
                          } ${isDeleting ? "opacity-50" : ""}`}
                        >
                          {milestone.title}
                        </span>
                        {milestone.status && <MilestoneStatusBadge status={milestone.status} />}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray400">
                          Réalisation :{" "}
                          {new Date(milestone.targetDate).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        {milestone.responsibleUserName && (
                          <span className="text-xs text-gray400">
                            Responsable : {milestone.responsibleUserName}
                          </span>
                        )}
                        {isAchieved && milestone.achievedDate && (
                          <span className="text-xs font-medium text-success">
                            Atteint le{" "}
                            {new Date(milestone.achievedDate).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => handleDelete(milestone.id)}
                        disabled={isDeleting}
                        className="ml-4 text-gray400 hover:text-error transition-colors disabled:opacity-40"
                        aria-label="Supprimer le jalon"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <MilestoneFormModal
          projectId={projectId}
          teamMembers={teamMembers}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
