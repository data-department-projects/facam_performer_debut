"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { KeyResultWithCert, KeyResultStatus, ObjectiveType } from "./types";
import { updateKeyResultProgress } from "@/actions/objectives";

type Props = {
  open: boolean;
  keyResult: KeyResultWithCert;
  objectiveType: ObjectiveType;
  onClose: () => void;
  onSave: (updated: KeyResultWithCert) => void;
};

const STATUS_LABELS: Record<KeyResultStatus, string> = {
  NOT_STARTED: "Non démarré",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

export function KeyResultUpdateModal({
  open,
  keyResult,
  objectiveType,
  onClose,
  onSave,
}: Props) {
  const [status, setStatus] = useState<KeyResultStatus>(keyResult.status);
  const [currentValue, setCurrentValue] = useState(
    keyResult.currentValue?.toString() ?? "",
  );
  const [evidenceNote, setEvidenceNote] = useState(
    keyResult.evidenceNote ?? "",
  );
  const [certificateUrl, setCertificateUrl] = useState(
    keyResult.certificateUrl ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleClose() {
    setStatus(keyResult.status);
    setCurrentValue(keyResult.currentValue?.toString() ?? "");
    setEvidenceNote(keyResult.evidenceNote ?? "");
    setCertificateUrl(keyResult.certificateUrl ?? "");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const computedCurrentValue =
      objectiveType === "PERFORMANCE"
        ? currentValue === ""
          ? null
          : Number(currentValue)
        : keyResult.currentValue;

    const result = await updateKeyResultProgress({
      id: keyResult.id,
      status,
      currentValue: computedCurrentValue,
      evidenceNote: evidenceNote.trim() !== "" ? evidenceNote.trim() : null,
      certificateUrl: certificateUrl.trim() !== "" ? certificateUrl.trim() : null,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      return;
    }

    const updated: KeyResultWithCert = {
      ...keyResult,
      status,
      currentValue: computedCurrentValue,
      evidenceNote: evidenceNote.trim() !== "" ? evidenceNote.trim() : null,
      certificateUrl: certificateUrl.trim() !== "" ? certificateUrl.trim() : null,
    };

    onSave(updated);
  }

  const showCurrentValue =
    objectiveType === "PERFORMANCE" && keyResult.targetValue !== null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-facamWhite p-6 shadow-xl">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">
            Mettre à jour
          </h3>
          <button
            onClick={handleClose}
            className="text-gray400 hover:text-facamDark"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-5 text-sm text-gray500">{keyResult.description}</p>

        {error && (
          <p className="mb-4 rounded-lg bg-errorLight px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Statut */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kru-status"
              className="text-sm font-medium text-facamBlack"
            >
              Statut
            </label>
            <select
              id="kru-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as KeyResultStatus)}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            >
              {(["NOT_STARTED", "IN_PROGRESS", "DONE"] as KeyResultStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Valeur atteinte — PERFORMANCE uniquement */}
          {showCurrentValue && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="kru-current"
                className="text-sm font-medium text-facamBlack"
              >
                Valeur atteinte{" "}
                <span className="text-xs font-normal text-gray400">
                  sur {keyResult.targetValue}
                </span>
              </label>
              <input
                id="kru-current"
                type="number"
                min={0}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              />
            </div>
          )}

          {/* Note de preuve */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kru-evidence"
              className="text-sm font-medium text-facamBlack"
            >
              Note de preuve{" "}
              <span className="text-xs font-normal text-gray400">(optionnel)</span>
            </label>
            <textarea
              id="kru-evidence"
              rows={3}
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Ex : Contrats signés avec les entreprises X, Y et Z…"
              className="resize-none rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {/* Lien du certificat — SKILLS_DEVELOPMENT uniquement */}
          {objectiveType === "SKILLS_DEVELOPMENT" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="kru-certificate"
                className="text-sm font-medium text-facamBlack"
              >
                Lien du certificat{" "}
                <span className="text-xs font-normal text-gray400">(optionnel)</span>
              </label>
              <input
                id="kru-certificate"
                type="url"
                value={certificateUrl}
                onChange={(e) => setCertificateUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-md border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
