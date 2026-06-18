"use client";

import { useState, useEffect, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { createSubDepartment, updateSubDepartment } from "@/actions/org-chart";

type SubDept = { id: string; name: string; departmentId: string };

type Props = {
  open: boolean;
  departmentId?: string;
  subDept?: SubDept;
  onClose: () => void;
};

export function SubDepartmentFormModal({ open, departmentId, subDept, onClose }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(subDept?.name ?? "");
      setError(null);
    }
  }, [open, subDept]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const deptId = subDept?.departmentId ?? departmentId;
    if (!deptId) return;

    startTransition(async () => {
      const result = subDept
        ? await updateSubDepartment(subDept.id, { name })
        : await createSubDepartment({ name, departmentId: deptId });
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
            {subDept ? "Modifier le sous-département" : "Nouveau sous-département"}
          </h3>
          <button onClick={onClose} className="text-gray400 hover:text-facamDark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="subdept-name" className="text-sm font-medium text-facamBlack">
              Nom du sous-département
            </label>
            <input
              id="subdept-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Marketing Digital"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              autoFocus
            />
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
              {subDept ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
