"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { KeyResultWithCert, ObjectiveType } from "./types";
import { addKeyResult } from "@/actions/objectives";

type Props = {
  open: boolean;
  objectiveId: string;
  objectiveType: ObjectiveType;
  onClose: () => void;
  onAdd: (kr: KeyResultWithCert) => void;
};

export function AddKeyResultModal({
  open,
  objectiveId,
  objectiveType,
  onClose,
  onAdd,
}: Props) {
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleClose() {
    setDescription("");
    setTargetValue("");
    setDueDate("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await addKeyResult({
      objectiveId,
      description: description.trim(),
      targetValue:
        objectiveType === "PERFORMANCE" && targetValue !== ""
          ? Number(targetValue)
          : null,
      dueDate: dueDate !== "" ? dueDate : null,
    });

    setIsSubmitting(false);

    if (!result.success || !result.id) {
      setError(result.error ?? "Erreur inconnue");
      return;
    }

    const newKR: KeyResultWithCert = {
      id: result.id,
      description: description.trim(),
      targetValue:
        objectiveType === "PERFORMANCE" && targetValue !== ""
          ? Number(targetValue)
          : null,
      currentValue: null,
      evidenceNote: null,
      dueDate: dueDate !== "" ? dueDate : null,
      status: "NOT_STARTED",
      certificateUrl: null,
    };

    onAdd(newKR);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-facamWhite p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">
            Ajouter un résultat clé
          </h3>
          <button
            onClick={handleClose}
            className="text-gray400 hover:text-facamDark"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-errorLight px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kr-desc"
              className="text-sm font-medium text-facamBlack"
            >
              Description <span className="text-error">*</span>
            </label>
            <input
              id="kr-desc"
              type="text"
              required
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Signer 3 nouveaux contrats PME"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {/* Valeur cible — PERFORMANCE uniquement */}
          {objectiveType === "PERFORMANCE" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="kr-target"
                className="text-sm font-medium text-facamBlack"
              >
                Valeur cible{" "}
                <span className="text-xs font-normal text-gray400">
                  (optionnel)
                </span>
              </label>
              <input
                id="kr-target"
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Ex : 3"
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              />
            </div>
          )}

          {/* Date limite */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kr-due"
              className="text-sm font-medium text-facamBlack"
            >
              Date limite{" "}
              <span className="text-xs font-normal text-gray400">(optionnel)</span>
            </label>
            <input
              id="kr-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

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
              disabled={description.trim() === "" || isSubmitting}
              className="rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isSubmitting ? "Ajout…" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
