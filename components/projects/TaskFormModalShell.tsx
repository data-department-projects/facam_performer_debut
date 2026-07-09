"use client";

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";

export type TaskFormResult = { success: boolean; error?: string };

type Props = {
  open: boolean;
  headerTitle: string;
  titlePlaceholder: string;
  initialTitle: string;
  initialDescription: string;
  submitLabel: string;
  extraContent?: ReactNode;
  onClose: () => void;
  onSubmit: (values: { title: string; description: string }) => Promise<TaskFormResult>;
};

// Coquille partagée par AssignedTaskFormModal et PersonalTaskFormModal — porte le titre,
// la description, l'état de sauvegarde et le chrome de la modale ; chaque appelant fournit
// son propre contenu additionnel (ex. sélecteur d'assignés) et sa logique de soumission.
export function TaskFormModalShell({
  open,
  headerTitle,
  titlePlaceholder,
  initialTitle,
  initialDescription,
  submitLabel,
  extraContent,
  onClose,
  onSubmit,
}: Readonly<Props>) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(initialTitle);
      setDescription(initialDescription);
      setError(null);
    }
  }, [open, initialTitle, initialDescription]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await onSubmit({ title: title.trim(), description: description.trim() });
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
          <h3 className="text-base font-semibold text-facamDark">{headerTitle}</h3>
          <button onClick={onClose} className="text-gray400 hover:text-facamDark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-form-title" className="text-sm font-medium text-facamBlack">
              Titre de la tâche
            </label>
            <input
              id="task-form-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder}
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-form-description" className="text-sm font-medium text-facamBlack">
              Description <span className="font-normal text-gray400">(optionnel)</span>
            </label>
            <textarea
              id="task-form-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails de la tâche…"
              className="resize-none rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          {extraContent}

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
              disabled={isPending || !title.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
