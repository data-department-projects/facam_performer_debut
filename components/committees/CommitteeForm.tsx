"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  MOCK_USERS_FOR_FORM,
  MOCK_DEPARTMENTS_FOR_FORM,
} from "@/app/committees/_mock-data";

type Frequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "AD_HOC";

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "MONTHLY", label: "Mensuel" },
  { value: "QUARTERLY", label: "Trimestriel" },
  { value: "ANNUAL", label: "Annuel" },
  { value: "AD_HOC", label: "Ponctuel" },
];

export function CommitteeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [objectives, setObjectives] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function toggleSet(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    return next;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedDepts.size === 0) {
      setError("Veuillez sélectionner au moins un département.");
      return;
    }

    // Mock — feature 15 câble la vraie Server Action
    startTransition(() => {
      setTimeout(() => {
        router.push("/committees");
      }, 600);
    });
  }

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
      <h2 className="mb-6 text-base font-semibold text-facamDark">Nouveau comité</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Informations générales */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray500">
            Informations générales
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="committee-name" className="text-sm font-medium text-facamBlack">
              Nom du comité
            </label>
            <input
              id="committee-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Comité de Direction"
              autoFocus
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="committee-responsible" className="text-sm font-medium text-facamBlack">
                Responsable du comité
              </label>
              <select
                id="committee-responsible"
                required
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              >
                <option value="">Sélectionner…</option>
                {MOCK_USERS_FOR_FORM.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="committee-frequency" className="text-sm font-medium text-facamBlack">
                Fréquence
              </label>
              <select
                id="committee-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="committee-objectives" className="text-sm font-medium text-facamBlack">
              Objectifs du comité
            </label>
            <textarea
              id="committee-objectives"
              required
              rows={3}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Décrire la mission et les objectifs de ce comité…"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20 resize-none"
            />
          </div>
        </div>

        {/* Départements */}
        <div className="flex flex-col gap-3 border-t border-gray200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray500">
            Départements inclus{" "}
            <span className="font-normal normal-case text-error">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MOCK_DEPARTMENTS_FOR_FORM.map((dept) => (
              <label
                key={dept}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray200 px-3 py-2 hover:bg-gray50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDepts.has(dept)}
                  onChange={() => setSelectedDepts(toggleSet(selectedDepts, dept))}
                  className="accent-facamBlue"
                />
                <span className="text-xs text-facamBlack">{dept}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="flex flex-col gap-3 border-t border-gray200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray500">
            Participants
          </p>
          <p className="text-xs text-gray400">
            Membres actifs qui participent aux décisions.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MOCK_USERS_FOR_FORM.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray200 px-3 py-2 hover:bg-gray50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedParticipants.has(user.id)}
                  onChange={() =>
                    setSelectedParticipants(toggleSet(selectedParticipants, user.id))
                  }
                  className="accent-facamBlue"
                />
                <span className="text-xs text-facamBlack">{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Invités */}
        <div className="flex flex-col gap-3 border-t border-gray200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray500">Invités</p>
          <p className="text-xs text-gray400">
            Présents en observateurs, sans droit de décision.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MOCK_USERS_FOR_FORM.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray200 px-3 py-2 hover:bg-gray50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedGuests.has(user.id)}
                  onChange={() => setSelectedGuests(toggleSet(selectedGuests, user.id))}
                  className="accent-facamBlue"
                />
                <span className="text-xs text-facamBlack">{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <p className="rounded-md bg-errorLight px-3 py-2 text-sm text-error">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray200 pt-5">
          <button
            type="button"
            onClick={() => router.push("/committees")}
            className="rounded-md border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim() || !responsibleId || !objectives.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Créer le comité
          </button>
        </div>
      </form>
    </div>
  );
}
