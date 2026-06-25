"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { createCommittee } from "@/actions/committees";

type Frequency = "WEEKLY" | "BIMONTHLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "AD_HOC";

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "BIMONTHLY", label: "Bimensuel" },
  { value: "MONTHLY", label: "Mensuel" },
  { value: "QUARTERLY", label: "Trimestriel" },
  { value: "ANNUAL", label: "Annuel" },
  { value: "AD_HOC", label: "Ponctuel" },
];

type SelectOption = { id: string; label: string };

function MultiSelect({
  id,
  placeholder,
  options,
  selected,
  onAdd,
  onRemove,
}: {
  id: string;
  placeholder: string;
  options: SelectOption[];
  selected: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const available = options.filter((o) => !selected.includes(o.id));
  const selectedItems = options.filter((o) => selected.includes(o.id));

  return (
    <div className="flex flex-col gap-2">
      <select
        id={id}
        value=""
        onChange={(e) => { if (e.target.value) onAdd(e.target.value); }}
        className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
      >
        <option value="">{placeholder}</option>
        {available.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-facamBlueTint px-2.5 py-1 text-xs font-medium text-facamBlue"
            >
              {item.label}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="ml-0.5 rounded-full hover:text-facamDark"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  departments: { id: string; name: string }[];
  users: { id: string; fullName: string }[];
  projects: { id: string; code: string; name: string }[];
};

export function CommitteeForm({ departments, users, projects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [objectives, setObjectives] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [projectId, setProjectId] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const deptOptions: SelectOption[] = departments.map((d) => ({ id: d.id, label: d.name }));
  const userOptions: SelectOption[] = users.map((u) => ({ id: u.id, label: u.fullName }));

  function addToList(list: string[], setList: (v: string[]) => void, id: string) {
    if (!list.includes(id)) setList([...list, id]);
  }
  function removeFromList(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.filter((v) => v !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedDepts.length === 0) {
      setError("Veuillez sélectionner au moins un département.");
      return;
    }

    startTransition(async () => {
      const result = await createCommittee({
        name: name.trim(),
        description: description.trim() || undefined,
        responsibleUserId: responsibleId,
        objectives: objectives.trim(),
        frequency,
        projectId: projectId || null,
        departmentIds: selectedDepts,
        participantIds: selectedParticipants,
        guestIds: selectedGuests,
      });

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      router.push("/committees");
    });
  }

  return (
    <div className="rounded-xl border border-gray200 bg-facamWhite p-6 shadow-sm">
      <h2 className="mb-6 text-base font-semibold text-facamDark">Nouveau comité</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* ── Informations générales ─────────────────────────── */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray500">
            Informations générales
          </p>

          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="committee-name" className="text-sm font-medium text-facamBlack">
              Nom du comité <span className="text-error">*</span>
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

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="committee-description" className="text-sm font-medium text-facamBlack">
              Description
              <span className="ml-1.5 text-xs font-normal text-gray400">(optionnel)</span>
            </label>
            <input
              id="committee-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Courte description du comité…"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Responsable */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="committee-responsible" className="text-sm font-medium text-facamBlack">
                Responsable <span className="text-error">*</span>
              </label>
              <select
                id="committee-responsible"
                required
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              >
                <option value="">Sélectionner…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Fréquence */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="committee-frequency" className="text-sm font-medium text-facamBlack">
                Fréquence <span className="text-error">*</span>
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

          {/* Projet associé */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="committee-project" className="text-sm font-medium text-facamBlack">
              Projet associé
              <span className="ml-1.5 text-xs font-normal text-gray400">(optionnel)</span>
            </label>
            <select
              id="committee-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            >
              <option value="">Aucun projet associé</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Objectifs */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="committee-objectives" className="text-sm font-medium text-facamBlack">
              Objectifs du comité <span className="text-error">*</span>
            </label>
            <textarea
              id="committee-objectives"
              required
              rows={3}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Décrire la mission et les objectifs de ce comité…"
              className="resize-none rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>
        </div>

        {/* ── Départements ───────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-t border-gray200 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray500">
              Départements inclus <span className="font-normal normal-case text-error">*</span>
            </p>
            <p className="mt-1 text-xs text-gray400">Sélectionnez un ou plusieurs départements.</p>
          </div>
          <MultiSelect
            id="dept-select"
            placeholder="— Ajouter un département —"
            options={deptOptions}
            selected={selectedDepts}
            onAdd={(id) => addToList(selectedDepts, setSelectedDepts, id)}
            onRemove={(id) => removeFromList(selectedDepts, setSelectedDepts, id)}
          />
        </div>

        {/* ── Participants ────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-t border-gray200 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray500">
              Participants
            </p>
            <p className="mt-1 text-xs text-gray400">
              Membres actifs qui participent aux décisions.
            </p>
          </div>
          <MultiSelect
            id="participant-select"
            placeholder="— Ajouter un participant —"
            options={userOptions.filter((u) => !selectedGuests.includes(u.id))}
            selected={selectedParticipants}
            onAdd={(id) => addToList(selectedParticipants, setSelectedParticipants, id)}
            onRemove={(id) => removeFromList(selectedParticipants, setSelectedParticipants, id)}
          />
        </div>

        {/* ── Invités ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-t border-gray200 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray500">Invités</p>
            <p className="mt-1 text-xs text-gray400">
              Présents en observateurs, sans droit de décision.
            </p>
          </div>
          <MultiSelect
            id="guest-select"
            placeholder="— Ajouter un invité —"
            options={userOptions.filter((u) => !selectedParticipants.includes(u.id))}
            selected={selectedGuests}
            onAdd={(id) => addToList(selectedGuests, setSelectedGuests, id)}
            onRemove={(id) => removeFromList(selectedGuests, setSelectedGuests, id)}
          />
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
