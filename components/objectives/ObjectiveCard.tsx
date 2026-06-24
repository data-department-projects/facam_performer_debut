"use client";

import { ChevronRight, AlertTriangle } from "lucide-react";
import type { ObjectiveWithKeyResults } from "./types";
import { ObjectiveTypeBadge } from "./ObjectiveStatusBadge";

type Props = {
  objective: ObjectiveWithKeyResults;
  onSelect: () => void;
  readonly?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ObjectiveCard({ objective, onSelect, readonly = false }: Props) {
  const doneCount = objective.keyResults.filter((kr) => kr.status === "DONE").length;
  const total = objective.keyResults.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const progressColor =
    progress === 100
      ? "bg-success"
      : progress >= 30
        ? "bg-facamBlue"
        : "bg-warning";

  return (
    <div className="flex flex-col rounded-2xl border border-gray200 bg-facamWhite p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <ObjectiveTypeBadge type={objective.type} />
          </div>
          <h3 className="text-sm font-semibold leading-snug text-facamDark">
            {objective.name}
          </h3>
          {readonly && (
            <p className="mt-0.5 text-xs text-gray500">{objective.userName}</p>
          )}
        </div>
        <button
          onClick={onSelect}
          className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-gray200 px-3 py-1.5 text-xs font-medium text-facamDark hover:bg-gray50"
        >
          Détails
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Période */}
      <p className="mb-3 text-xs text-gray400">
        {formatDate(objective.periodStart)} — {formatDate(objective.periodEnd)}
      </p>

      {/* Progression */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray500">Résultats clés</span>
          <span className="text-xs font-medium text-facamDark">
            {doneCount}/{total} terminés
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Risques */}
      {objective.risks.length > 0 && (
        <div className="mt-auto flex items-center gap-1.5">
          <AlertTriangle size={11} className="flex-shrink-0 text-facamYellow" />
          <span className="text-xs text-gray400">
            {objective.risks.length} risque
            {objective.risks.length > 1 ? "s" : ""} identifié
            {objective.risks.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
