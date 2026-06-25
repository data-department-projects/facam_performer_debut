"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Eye } from "lucide-react";
import type { ObjectiveWithKeyResults, KeyResultWithCert, ObjectiveType } from "./types";
import { ObjectiveDrawer } from "./ObjectiveDrawer";
import { ObjectiveFormModal } from "./ObjectiveFormModal";
import { ObjectiveTypeBadge } from "./ObjectiveStatusBadge";

type TypeFilter = "" | ObjectiveType;

type Props = {
  initialObjectives: ObjectiveWithKeyResults[];
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function CollaboratorObjectivesView({ initialObjectives }: Props) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<ObjectiveWithKeyResults[]>(initialObjectives);
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveWithKeyResults | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");

  const filtered = typeFilter ? objectives.filter((o) => o.type === typeFilter) : objectives;

  function handleObjectiveAdded(newObjective: ObjectiveWithKeyResults) {
    setObjectives((prev) => [newObjective, ...prev]);
    setSelectedObjective(newObjective);
  }

  function handleObjectiveDeleted(objectiveId: string) {
    setObjectives((prev) => prev.filter((o) => o.id !== objectiveId));
    setSelectedObjective(null);
    router.refresh();
  }

  function handleUpdateKR(objectiveId: string, krId: string, updated: KeyResultWithCert) {
    const patchKRs = (krs: KeyResultWithCert[]) =>
      krs.map((kr) => (kr.id === krId ? updated : kr));
    setObjectives((prev) =>
      prev.map((obj) =>
        obj.id === objectiveId ? { ...obj, keyResults: patchKRs(obj.keyResults) } : obj,
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
        obj.id === objectiveId ? { ...obj, keyResults: [...obj.keyResults, kr] } : obj,
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
      {/* En-tête + filtre + bouton */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-facamDark">Mes Objectifs</h1>
          <p className="text-sm text-gray500">
            {filtered.length} objectif{filtered.length !== 1 ? "s" : ""} défini
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-lg border border-gray200 bg-facamWhite px-3 py-1.5 text-sm text-facamDark focus:border-facamBlue focus:outline-none"
          >
            <option value="">Tous les types</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="SKILLS_DEVELOPMENT">Développement</option>
          </select>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
          >
            <Plus size={15} />
            Créer un objectif
          </button>
        </div>
      </div>

      {/* Tableau ou empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray200 bg-facamWhite py-16 text-center">
          <Target size={32} className="mb-3 text-gray300" />
          <p className="text-sm font-medium text-gray500">
            {typeFilter ? "Aucun objectif de ce type." : "Aucun objectif défini pour l'instant."}
          </p>
          {!typeFilter && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-3 text-sm font-semibold text-facamBlue hover:text-facamDark"
            >
              Créer mon premier objectif
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray200 bg-facamWhite">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray100 bg-gray50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Objectif
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Période
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray400">
                  Résultats clés
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray100">
              {filtered.map((obj) => {
                const totalKRs = obj.keyResults.length;
                const doneKRs = obj.keyResults.filter((kr) => kr.status === "DONE").length;
                const pct = totalKRs > 0 ? Math.round((doneKRs / totalKRs) * 100) : 0;

                return (
                  <tr
                    key={obj.id}
                    className="cursor-pointer transition-colors hover:bg-facamBlueTint/30"
                    onClick={() => setSelectedObjective(obj)}
                  >
                    <td className="max-w-[280px] px-4 py-3">
                      <span className="block truncate font-medium text-facamDark" title={obj.name}>
                        {obj.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ObjectiveTypeBadge type={obj.type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray500">
                      {formatDate(obj.periodStart)} → {formatDate(obj.periodEnd)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray200">
                          <div
                            className={`h-full rounded-full ${
                              pct === 100
                                ? "bg-success"
                                : pct >= 30
                                  ? "bg-facamBlue"
                                  : "bg-warning"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray500">{doneKRs}/{totalKRs}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedObjective(obj);
                        }}
                        className="rounded-lg p-1.5 text-gray400 transition-colors hover:bg-facamBlueTint hover:text-facamBlue"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      {selectedObjective && (
        <ObjectiveDrawer
          objective={selectedObjective}
          onClose={() => setSelectedObjective(null)}
          onUpdateKR={(krId, updated) => handleUpdateKR(selectedObjective.id, krId, updated)}
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
