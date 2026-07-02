"use client";

import { CalendarDays, ExternalLink } from "lucide-react";
import type { KeyResultWithCert, ObjectiveType } from "./types";
import { KRStatusBadge } from "./ObjectiveStatusBadge";

type Props = {
  keyResult: KeyResultWithCert;
  objectiveType: ObjectiveType;
  onUpdate?: () => void;
  readonly?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function KeyResultCard({
  keyResult,
  objectiveType,
  onUpdate,
  readonly = false,
}: Props) {
  const showProgress =
    objectiveType === "PERFORMANCE" && keyResult.targetValue !== null;
  const progressPct = showProgress
    ? Math.min(
        100,
        Math.round(
          ((keyResult.currentValue ?? 0) / (keyResult.targetValue ?? 1)) * 100,
        ),
      )
    : 0;
  const showCertHint =
    !readonly &&
    objectiveType === "SKILLS_DEVELOPMENT" &&
    !keyResult.certificateUrl;

  return (
    <div className="rounded-xl border border-gray200 bg-gray50 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-sm font-medium leading-snug text-facamDark">
          {keyResult.description}
        </p>
        <div className="flex flex-shrink-0 items-center gap-2">
          <KRStatusBadge status={keyResult.status} />
          {!readonly && onUpdate && (
            <button
              onClick={onUpdate}
              className="rounded-md border border-gray200 bg-facamWhite px-2.5 py-1 text-xs font-medium text-facamDark hover:bg-gray100"
            >
              Mettre à jour
            </button>
          )}
        </div>
      </div>

      {/* Progression PERFORMANCE */}
      {showProgress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray500">Progression</span>
            <span className="font-medium text-facamDark">
              {keyResult.currentValue ?? 0} / {keyResult.targetValue}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
            <div
              className="h-full rounded-full bg-facamBlue transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Note de preuve */}
      {keyResult.evidenceNote && (
        <p className="mt-2 text-xs italic text-gray500">
          &quot;{keyResult.evidenceNote}&quot;
        </p>
      )}

      {/* Date limite */}
      {keyResult.dueDate && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray400">
          <CalendarDays size={11} />
          <span>Échéance : {formatDate(keyResult.dueDate)}</span>
        </div>
      )}

      {/* Certificat existant */}
      {keyResult.certificateUrl && (
        <a
          href={keyResult.certificateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-facamBlue hover:text-facamDark"
        >
          <ExternalLink size={11} />
          Voir le certificat
        </a>
      )}

      {/* Rappel — SKILLS_DEVELOPMENT sans certificat renseigné */}
      {showCertHint && (
        <p className="mt-3 text-xs text-gray400">
          Aucun lien de certificat renseigné — ajoutez-en un via « Mettre à jour ».
        </p>
      )}
    </div>
  );
}
