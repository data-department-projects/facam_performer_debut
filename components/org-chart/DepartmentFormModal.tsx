"use client";

import { useState, useTransition } from "react";
import { Loader2, X, ChevronDown } from "lucide-react";
import { createDepartment, updateDepartment } from "@/actions/org-chart";

type Dept = { id: string; name: string; parentDepartmentId?: string | null };

type Props = {
  open: boolean;
  dept?: Dept;
  parentDepartmentId?: string;
  allDepts: { id: string; name: string; parentDepartmentId: string | null }[];
  onClose: () => void;
};

export function DepartmentFormModal({ open, dept, parentDepartmentId, allDepts, onClose }: Props) {
  const [name, setName] = useState(dept?.name ?? "");
  const [selectedParentId, setSelectedParentId] = useState<string>(
    dept?.parentDepartmentId ?? parentDepartmentId ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  // Exclure le département en cours d'édition et ses descendants pour éviter les cycles
  const eligibleParents = allDepts.filter((d) => d.id !== dept?.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        name,
        parentDepartmentId: selectedParentId || undefined,
      };
      const result = dept
        ? await updateDepartment(dept.id, payload)
        : await createDepartment(payload);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-facamWhite p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">
            {dept ? "Modifier le département" : "Nouveau département"}
          </h3>
          <button onClick={onClose} className="text-gray400 hover:text-facamDark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dept-name" className="text-sm font-medium text-facamBlack">
              Nom du département
            </label>
            <input
              id="dept-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Marketing"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              autoFocus
            />
          </div>

          {/* Département parent (optionnel) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dept-parent" className="text-sm font-medium text-facamBlack">
              Rattaché à{" "}
              <span className="font-normal text-gray400">(optionnel)</span>
            </label>
            <div className="relative">
              <select
                id="dept-parent"
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full appearance-none rounded-md border border-gray300 bg-facamWhite px-3 py-2 pr-8 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              >
                <option value="">— Aucun (département mère) —</option>
                {eligibleParents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray400"
              />
            </div>
            {selectedParentId && (
              <p className="text-xs text-gray400">
                Ce département apparaîtra à l&apos;intérieur de{" "}
                <span className="font-medium text-facamBlue">
                  {eligibleParents.find((d) => d.id === selectedParentId)?.name}
                </span>{" "}
                dans l&apos;organigramme.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-errorLight px-3 py-2 text-sm text-error">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {dept ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
