"use client";

import { useState } from "react";
import { X, Plus, AlertTriangle, Target, Trash2 } from "lucide-react";
import type { ObjectiveWithKeyResults, KeyResultWithCert, Certificate } from "./types";
import { ObjectiveTypeBadge } from "./ObjectiveStatusBadge";
import { KeyResultCard } from "./KeyResultCard";
import { KeyResultUpdateModal } from "./KeyResultUpdateModal";
import { AddKeyResultModal } from "./AddKeyResultModal";
import { deleteObjective } from "@/actions/objectives";

type Props = {
  objective: ObjectiveWithKeyResults;
  onClose: () => void;
  onUpdateKR: (krId: string, updated: KeyResultWithCert) => void;
  onAddKR: (kr: KeyResultWithCert) => void;
  onDelete?: () => void;
  readonly?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ObjectiveDrawer({
  objective,
  onClose,
  onUpdateKR,
  onAddKR,
  onDelete,
  readonly = false,
}: Props) {
  const [selectedKR, setSelectedKR] = useState<KeyResultWithCert | null>(null);
  const [isAddKROpen, setIsAddKROpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const doneCount = objective.keyResults.filter(
    (kr) => kr.status === "DONE",
  ).length;
  const total = objective.keyResults.length;
  const progress =
    total > 0 ? Math.round((doneCount / total) * 100) : 0;

  async function handleDelete() {
    if (!window.confirm("Supprimer cet objectif et tous ses résultats clés ?")) return;
    setIsDeleting(true);
    await deleteObjective(objective.id);
    setIsDeleting(false);
    onDelete?.();
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-hidden bg-facamWhite shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-gray200 px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ObjectiveTypeBadge type={objective.type} />
            </div>
            <h2 className="text-base font-semibold leading-snug text-facamDark">
              {objective.name}
            </h2>
            {readonly && (
              <p className="mt-1 text-sm text-gray500">{objective.userName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex-shrink-0 text-gray400 hover:text-facamDark"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          {/* Période + description */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray400">
              Période
            </p>
            <p className="text-sm text-facamDark">
              {formatDate(objective.periodStart)} —{" "}
              {formatDate(objective.periodEnd)}
            </p>
            {objective.description && (
              <p className="mt-1 text-sm leading-relaxed text-gray600">
                {objective.description}
              </p>
            )}
          </div>

          {/* Progression globale */}
          <div className="rounded-xl border border-gray200 bg-gray50 p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-gray500">Résultats clés</span>
              <span className="font-semibold text-facamDark">
                {progress}% complété
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray200">
              <div
                className="h-full rounded-full bg-facamBlue transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray400">
              {doneCount} sur {total} résultat{total > 1 ? "s" : ""} terminé
              {doneCount > 1 ? "s" : ""}
            </p>
          </div>

          {/* Risques */}
          {objective.risks.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-facamYellow" />
                <h3 className="text-sm font-semibold text-facamDark">
                  Risques identifiés
                </h3>
              </div>
              <ul className="flex flex-col gap-2">
                {objective.risks.map((risk, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray600"
                  >
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-facamYellow" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Résultats clés */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-facamBlue" />
                <h3 className="text-sm font-semibold text-facamDark">
                  Résultats clés
                </h3>
              </div>
              {!readonly && (
                <button
                  onClick={() => setIsAddKROpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-facamBlue hover:text-facamDark"
                >
                  <Plus size={12} />
                  Ajouter
                </button>
              )}
            </div>

            {objective.keyResults.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray200 px-4 py-8 text-center">
                <p className="text-sm text-gray400">
                  Aucun résultat clé défini.
                </p>
                {!readonly && (
                  <button
                    onClick={() => setIsAddKROpen(true)}
                    className="mt-2 text-sm font-medium text-facamBlue hover:text-facamDark"
                  >
                    Ajouter le premier résultat clé
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {objective.keyResults.map((kr) => (
                  <KeyResultCard
                    key={kr.id}
                    keyResult={kr}
                    objectiveType={objective.type}
                    onUpdate={readonly ? undefined : () => setSelectedKR(kr)}
                    onCertificateUploaded={
                      readonly
                        ? undefined
                        : (cert: Certificate) =>
                            onUpdateKR(kr.id, { ...kr, certificate: cert })
                    }
                    readonly={readonly}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer — suppression */}
        {!readonly && onDelete && (
          <div className="flex flex-shrink-0 items-center justify-start border-t border-gray200 px-6 py-4">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 text-sm font-medium text-error hover:text-red-700 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {isDeleting ? "Suppression…" : "Supprimer l'objectif"}
            </button>
          </div>
        )}
      </div>

      {/* KR Update Modal */}
      {selectedKR && (
        <KeyResultUpdateModal
          open
          keyResult={selectedKR}
          objectiveType={objective.type}
          onClose={() => setSelectedKR(null)}
          onSave={(updated) => {
            onUpdateKR(selectedKR.id, updated);
            setSelectedKR(null);
          }}
        />
      )}

      {/* Add KR Modal */}
      {!readonly && (
        <AddKeyResultModal
          open={isAddKROpen}
          objectiveId={objective.id}
          objectiveType={objective.type}
          onClose={() => setIsAddKROpen(false)}
          onAdd={(kr) => {
            onAddKR(kr);
            setIsAddKROpen(false);
          }}
        />
      )}
    </>
  );
}
