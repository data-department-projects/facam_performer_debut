"use client";

import { useState } from "react";
import { Building2, Target } from "lucide-react";
import type { DepartmentGroup, ObjectiveWithKeyResults } from "./types";
import { ObjectiveCard } from "./ObjectiveCard";
import { ObjectiveDrawer } from "./ObjectiveDrawer";

type Props = {
  groups: DepartmentGroup[];
};

export function DepartmentObjectivesByDept({ groups }: Props) {
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveWithKeyResults | null>(null);

  const totalObjectives = groups.reduce((sum, g) => sum + g.objectives.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-facamDark">Objectifs Départements</h1>
        <p className="text-sm text-gray500">
          {totalObjectives} objectif{totalObjectives > 1 ? "s" : ""} répartis sur{" "}
          {groups.length} département{groups.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Sections par département */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray200 bg-facamWhite py-16 text-center">
          <Building2 size={32} className="mb-3 text-gray300" />
          <p className="text-sm font-medium text-gray500">Aucun département trouvé.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-4 rounded-2xl border border-gray200 bg-facamWhite p-5">
            {/* En-tête département */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-facamBlueTint">
                  <Building2 size={15} className="text-facamBlue" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-facamDark">{group.name}</h2>
                  <p className="text-xs text-gray500">
                    {group.objectives.length} objectif{group.objectives.length > 1 ? "s" : ""}
                    {group.totalKRs > 0 && (
                      <> &middot; {group.doneKRs}/{group.totalKRs} résultats clés terminés</>
                    )}
                  </p>
                </div>
              </div>
              <span className="flex-shrink-0 text-sm font-semibold text-facamDark">
                {group.progressPercent}%
              </span>
            </div>

            {/* Barre de progression département */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
              <div
                className={`h-full rounded-full transition-all ${
                  group.progressPercent === 100
                    ? "bg-success"
                    : group.progressPercent >= 30
                      ? "bg-facamBlue"
                      : "bg-warning"
                }`}
                style={{ width: `${group.progressPercent}%` }}
              />
            </div>

            {/* Grille d'objectifs ou empty state */}
            {group.objectives.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-gray200 py-8 text-center">
                <Target size={22} className="text-gray300" />
                <p className="text-xs text-gray400">Aucun objectif défini dans ce département.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.objectives.map((obj) => (
                  <ObjectiveCard
                    key={obj.id}
                    objective={obj}
                    onSelect={() => setSelectedObjective(obj)}
                    readonly
                  />
                ))}
              </div>
            )}
          </section>
        ))
      )}

      {/* Drawer lecture seule */}
      {selectedObjective && (
        <ObjectiveDrawer
          objective={selectedObjective}
          onClose={() => setSelectedObjective(null)}
          onUpdateKR={() => undefined}
          onAddKR={() => undefined}
          readonly
        />
      )}
    </div>
  );
}
