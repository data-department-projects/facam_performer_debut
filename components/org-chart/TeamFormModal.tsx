"use client";

import { useState, useEffect, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { createTeam, updateTeam } from "@/actions/org-chart";

type SimpleUser = { id: string; fullName: string; role: string };
type OrgTeam = {
  id: string;
  name: string;
  subDepartmentId: string;
  manager: SimpleUser | null;
};

type Props = {
  open: boolean;
  subDepartmentId?: string;
  team?: OrgTeam;
  allUsers: SimpleUser[];
  onClose: () => void;
};

export function TeamFormModal({ open, subDepartmentId, team, allUsers, onClose }: Props) {
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "");
      setManagerId(team?.manager?.id ?? "");
      setError(null);
    }
  }, [open, team]);

  if (!open) return null;

  const subDeptId = team?.subDepartmentId ?? subDepartmentId;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!managerId) {
      setError("Veuillez sélectionner un responsable.");
      return;
    }
    if (!subDeptId) return;

    startTransition(async () => {
      const result = team
        ? await updateTeam(team.id, { name, managerId })
        : await createTeam({ name, subDepartmentId: subDeptId, managerId });
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  }

  const managers = allUsers.filter(
    (u) => u.role === "ADMIN" || u.role === "MANAGER",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-facamWhite p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">
            {team ? "Modifier l'équipe" : "Nouvelle équipe"}
          </h3>
          <button onClick={onClose} className="text-gray400 hover:text-facamDark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="team-name" className="text-sm font-medium text-facamBlack">
              Nom de l&apos;équipe
            </label>
            <input
              id="team-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Équipe Communication"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="team-manager" className="text-sm font-medium text-facamBlack">
              Responsable de l&apos;équipe
            </label>
            <select
              id="team-manager"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            >
              <option value="">Sélectionner un responsable…</option>
              {managers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
            {managers.length === 0 && (
              <p className="text-xs text-gray400">
                Aucun Manager ou Administrateur disponible.
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
              disabled={isPending || !name.trim() || !managerId}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {team ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
