"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target } from "lucide-react";
import type { ObjectiveWithKeyResults, KeyResultWithCert } from "./types";
import { ObjectiveCard } from "./ObjectiveCard";
import { ObjectiveDrawer } from "./ObjectiveDrawer";
import { ObjectiveFormModal } from "./ObjectiveFormModal";

type Props = {
  initialObjectives: ObjectiveWithKeyResults[];
};

export function CollaboratorObjectivesView({ initialObjectives }: Props) {
  const router = useRouter();
  const [objectives, setObjectives] =
    useState<ObjectiveWithKeyResults[]>(initialObjectives);
  const [selectedObjective, setSelectedObjective] =
    useState<ObjectiveWithKeyResults | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  function handleObjectiveAdded(newObjective: ObjectiveWithKeyResults) {
    setObjectives((prev) => [newObjective, ...prev]);
    setSelectedObjective(newObjective);
  }

  function handleObjectiveDeleted(objectiveId: string) {
    setObjectives((prev) => prev.filter((o) => o.id !== objectiveId));
    setSelectedObjective(null);
    router.refresh();
  }

  function handleUpdateKR(
    objectiveId: string,
    krId: string,
    updated: KeyResultWithCert,
  ) {
    const patchKRs = (krs: KeyResultWithCert[]) =>
      krs.map((kr) => (kr.id === krId ? updated : kr));

    setObjectives((prev) =>
      prev.map((obj) =>
        obj.id === objectiveId
          ? { ...obj, keyResults: patchKRs(obj.keyResults) }
          : obj,
      ),
    );
    setSelectedObjective((prev) =>
      prev && prev.id === objectiveId
        ? { ...prev, keyResults: patchKRs(prev.keyResults) }
        : prev,
    );
  }

  function handleAddKR(objectiveId: string, kr: KeyResultWithCert) {
    setObjectives((prev) =>
      prev.map((obj) =>
        obj.id === objectiveId
          ? { ...obj, keyResults: [...obj.keyResults, kr] }
          : obj,
      ),
    );
    setSelectedObjective((prev) =>
      prev && prev.id === objectiveId
        ? { ...prev, keyResults: [...prev.keyResults, kr] }
        : prev,
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-facamDark">
            Mes Objectifs
          </h1>
          <p className="text-sm text-gray500">
            {objectives.length} objectif{objectives.length > 1 ? "s" : ""}{" "}
            défini{objectives.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
        >
          <Plus size={15} />
          Créer un objectif
        </button>
      </div>

      {/* Liste ou empty state */}
      {objectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray200 bg-facamWhite py-16 text-center">
          <Target size={32} className="mb-3 text-gray300" />
          <p className="text-sm font-medium text-gray500">
            Aucun objectif défini pour l&apos;instant.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-3 text-sm font-semibold text-facamBlue hover:text-facamDark"
          >
            Créer mon premier objectif
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {objectives.map((obj) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              onSelect={() => setSelectedObjective(obj)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      {selectedObjective && (
        <ObjectiveDrawer
          objective={selectedObjective}
          onClose={() => setSelectedObjective(null)}
          onUpdateKR={(krId, updated) =>
            handleUpdateKR(selectedObjective.id, krId, updated)
          }
          onAddKR={(kr) => handleAddKR(selectedObjective.id, kr)}
          onDelete={() => handleObjectiveDeleted(selectedObjective.id)}
        />
      )}

      {/* Modale de création */}
      <ObjectiveFormModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onAdd={handleObjectiveAdded}
      />
    </div>
  );
}
