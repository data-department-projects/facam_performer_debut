"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { ObjectiveWithKeyResults, ObjectiveType } from "./types";
import { createObjective } from "@/actions/objectives";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (objective: ObjectiveWithKeyResults) => void;
};

export function ObjectiveFormModal({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ObjectiveType>("PERFORMANCE");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [risks, setRisks] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRisk(i: number, value: string) {
    setRisks((prev) => prev.map((r, idx) => (idx === i ? value : r)));
  }

  function removeRisk(i: number) {
    setRisks((prev) => prev.filter((_, idx) => idx !== i));
  }

  if (!open) return null;

  function handleClose() {
    setName("");
    setDescription("");
    setType("PERFORMANCE");
    setPeriodStart("");
    setPeriodEnd("");
    setRisks([""]);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createObjective({
      name: name.trim(),
      description: description.trim(),
      type,
      periodStart,
      periodEnd,
      risks: risks.filter((r) => r.trim() !== ""),
    });

    setIsSubmitting(false);

    if (!result.success || !result.id) {
      setError(result.error ?? "Erreur inconnue");
      return;
    }

    const newObjective: ObjectiveWithKeyResults = {
      id: result.id,
      userId: "",
      userName: "",
      name: name.trim(),
      description: description.trim(),
      type,
      periodStart,
      periodEnd,
      risks: risks.filter((r) => r.trim() !== ""),
      keyResults: [],
    };

    onAdd(newObjective);
    handleClose();
  }

  const isValid =
    name.trim() !== "" &&
    periodStart !== "" &&
    periodEnd !== "" &&
    periodEnd >= periodStart;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-facamWhite p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">
            Créer un objectif
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
          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="obj-name"
              className="text-sm font-medium text-facamBlack"
            >
              Nom de l&apos;objectif <span className="text-error">*</span>
            </label>
            <input
              id="obj-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Développer le portefeuille clients"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="obj-desc"
              className="text-sm font-medium text-facamBlack"
            >
              Description
            </label>
            <textarea
              id="obj-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexte et enjeux de cet objectif…"
              className="resize-none rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-facamBlack">
              Type d&apos;objectif <span className="text-error">*</span>
            </span>
            <div className="flex gap-3">
              {(["PERFORMANCE", "SKILLS_DEVELOPMENT"] as ObjectiveType[]).map(
                (t) => (
                  <label
                    key={t}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                      type === t
                        ? "border-facamBlue bg-facamBlueTint text-facamBlue"
                        : "border-gray200 text-facamDark hover:bg-gray50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="obj-type"
                      value={t}
                      checked={type === t}
                      onChange={() => setType(t)}
                      className="sr-only"
                    />
                    {t === "PERFORMANCE" ? "Performance" : "Développement"}
                  </label>
                ),
              )}
            </div>
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="obj-start"
                className="text-sm font-medium text-facamBlack"
              >
                Début <span className="text-error">*</span>
              </label>
              <input
                id="obj-start"
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="obj-end"
                className="text-sm font-medium text-facamBlack"
              >
                Fin <span className="text-error">*</span>
              </label>
              <input
                id="obj-end"
                type="date"
                required
                value={periodEnd}
                min={periodStart}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              />
            </div>
          </div>

          {/* Risques */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-facamBlack">
                Risques associés
              </span>
              <button
                type="button"
                onClick={() => setRisks((prev) => [...prev, ""])}
                className="flex items-center gap-1 text-xs font-medium text-facamBlue hover:text-facamDark"
              >
                <Plus size={12} />
                Ajouter un risque
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {risks.map((risk, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={risk}
                    onChange={(e) => updateRisk(i, e.target.value)}
                    placeholder={`Risque ${i + 1}…`}
                    className="flex-1 rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
                  />
                  {risks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRisk(i)}
                      className="flex-shrink-0 text-gray400 hover:text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
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
              disabled={!isValid || isSubmitting}
              className="rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isSubmitting ? "Création…" : "Créer l'objectif"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
