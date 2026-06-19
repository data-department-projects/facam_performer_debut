"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { confirmProject, addConfirmationNote } from "@/actions/projectValidation";

type Props = {
  projectId: string;
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedByName?: string;
  confirmationNote?: string;
};

export function ProjectConfirmationPanel({
  projectId,
  isConfirmed,
  confirmedAt,
  confirmedByName,
  confirmationNote,
}: Props) {
  const [note, setNote] = useState(confirmationNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isConfirmed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success bg-successLight px-5 py-4">
        <CheckCircle2 size={18} className="shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-success">Projet confirmé</p>
          {confirmedAt && confirmedByName && (
            <p className="mt-0.5 text-xs text-success/80">
              Confirmé le{" "}
              {new Date(confirmedAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}{" "}
              par {confirmedByName}
            </p>
          )}
        </div>
      </div>
    );
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmProject(projectId);
      if (!result.success) setError(result.error ?? "Erreur inattendue.");
    });
  }

  function handleSaveNote() {
    setError(null);
    startTransition(async () => {
      const result = await addConfirmationNote(projectId, note);
      if (!result.success) setError(result.error ?? "Erreur inattendue.");
    });
  }

  return (
    <div className="rounded-xl border border-facamYellow bg-warningLight p-5">
      <div className="mb-3 flex items-center gap-2">
        <Clock size={16} className="shrink-0 text-warning" />
        <p className="text-sm font-semibold text-warning">
          En attente de confirmation
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray500">
            Note pour le Manager (optionnel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Indiquer ce qui doit être complété avant confirmation…"
            className="w-full resize-none rounded-lg border border-gray200 bg-facamWhite px-3 py-2 text-sm text-facamDark placeholder:text-gray400 focus:border-facamBlue focus:outline-none disabled:opacity-60"
            disabled={isPending}
          />
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite transition-colors hover:bg-facamDark disabled:opacity-50"
          >
            {isPending ? "En cours…" : "Confirmer le projet"}
          </button>
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={isPending || !note.trim()}
            className="rounded-md border border-gray200 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark transition-colors hover:bg-gray50 disabled:opacity-50"
          >
            Enregistrer la note
          </button>
        </div>
      </div>
    </div>
  );
}
