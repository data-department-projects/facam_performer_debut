"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { createAssignedTask, updateAssignedTask } from "@/actions/assignedTasks";

type SimpleUser = { id: string; fullName: string };

export type EditableAssignedTask = {
  id: string;
  title: string;
  description: string | null;
  assigneeIds: string[];
};

type Props = {
  open: boolean;
  task?: EditableAssignedTask;
  eligibleAssignees: SimpleUser[];
  onClose: () => void;
};

export function AssignedTaskFormModal({ open, task, eligibleAssignees, onClose }: Readonly<Props>) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setSelectedAssignees(task?.assigneeIds ?? []);
      setError(null);
    }
  }, [open, task]);

  if (!open) return null;

  function toggleAssignee(id: string) {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        assigneeIds: selectedAssignees,
      };
      const result = task
        ? await updateAssignedTask(task.id, payload)
        : await createAssignedTask(payload);

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
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </h3>
          <button onClick={onClose} className="text-gray400 hover:text-facamDark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-title" className="text-sm font-medium text-facamBlack">
              Titre de la tâche
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Préparer le support de présentation"
              className="rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-description" className="text-sm font-medium text-facamBlack">
              Description <span className="font-normal text-gray400">(optionnel)</span>
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails de la tâche…"
              className="resize-none rounded-md border border-gray300 bg-facamWhite px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-facamBlack">
              Attribuer à <span className="font-normal text-gray400">(optionnel)</span>
            </p>
            {eligibleAssignees.length === 0 ? (
              <p className="text-xs text-gray400">
                Aucun collaborateur actif dans votre département.
              </p>
            ) : (
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-gray200 p-2">
                {eligibleAssignees.map((u) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-facamDark hover:bg-gray50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(u.id)}
                      onChange={() => toggleAssignee(u.id)}
                      className="h-4 w-4 rounded border-gray300 accent-facamBlue"
                    />
                    {u.fullName}
                  </label>
                ))}
              </div>
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
              disabled={isPending || !title.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:opacity-50"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {task ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
