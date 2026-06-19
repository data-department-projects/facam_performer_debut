"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { MockCommitteeMember } from "@/app/committees/_mock-data";

type Props = {
  open: boolean;
  members: MockCommitteeMember[];
  onClose: () => void;
};

export function CommitteeActionFormModal({ open, members, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"PENDING" | "DONE">("PENDING");
  const [isPending, setIsPending] = useState(false);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    // Mock — feature 15 câble la vraie Server Action
    setTimeout(() => {
      setIsPending(false);
      setTitle("");
      setResponsibleId("");
      setDueDate("");
      setStatus("PENDING");
      onClose();
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-facamWhite p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-facamDark">Ajouter une décision</h3>
          <button onClick={onClose} className="text-gray400 hover:text-facamDark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Titre */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="action-title" className="text-sm font-medium text-facamBlack">
              Décision / Action
            </label>
            <input
              id="action-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Mettre à jour le plan de formation"
              autoFocus
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {/* Responsable */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="action-responsible" className="text-sm font-medium text-facamBlack">
              Responsable
            </label>
            <select
              id="action-responsible"
              required
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            >
              <option value="">Sélectionner un responsable…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Échéance */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="action-due-date" className="text-sm font-medium text-facamBlack">
              Échéance
            </label>
            <input
              id="action-due-date"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {/* Statut */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="action-status" className="text-sm font-medium text-facamBlack">
              Statut
            </label>
            <select
              id="action-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "PENDING" | "DONE")}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            >
              <option value="PENDING">En attente</option>
              <option value="DONE">Réalisée</option>
            </select>
          </div>

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
              disabled={isPending || !title.trim() || !responsibleId || !dueDate}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
