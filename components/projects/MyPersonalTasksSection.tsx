"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Lock } from "lucide-react";
import { deletePersonalTask } from "@/actions/personalTasks";
import {
  PersonalTaskFormModal,
  type EditablePersonalTask,
} from "@/components/projects/PersonalTaskFormModal";

export type MyPersonalTask = {
  id: string;
  title: string;
  description: string | null;
};

type Props = {
  tasks: MyPersonalTask[];
};

export function MyPersonalTasksSection({ tasks }: Readonly<Props>) {
  const [modal, setModal] = useState<{ open: boolean; task?: EditablePersonalTask }>({
    open: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deletePersonalTask(id);
      if (!result.success) setError(result.error ?? "Impossible de supprimer la tâche.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-facamDark">Mes tâches personnelles</h2>
          <p className="mt-0.5 text-xs text-gray500">
            <Lock size={11} className="mr-1 inline" />
            Visibles et gérables uniquement par vous — sélectionnables lors de la planification de
            votre semaine.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ open: true })}
          className="inline-flex items-center gap-2 rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark"
        >
          <Plus size={14} /> Nouvelle tâche
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-sm text-error">{error}</p>
      )}

      {tasks.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-gray200 bg-facamWhite py-14 shadow-sm">
          <p className="text-sm text-gray400">Aucune tâche personnelle créée pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-gray200">
                  <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Tâche</th>
                  <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-widest text-gray500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray200 last:border-0 hover:bg-gray50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-facamDark">{task.title}</p>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-gray500 line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex shrink-0 justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setModal({
                              open: true,
                              task: { id: task.id, title: task.title, description: task.description },
                            })
                          }
                          className="rounded p-1 text-gray400 hover:bg-gray50 hover:text-facamBlue"
                          aria-label="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(task.id)}
                          className="rounded p-1 text-gray400 hover:bg-gray50 hover:text-error disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PersonalTaskFormModal
        key={`${modal.task?.id ?? "new"}-${String(modal.open)}`}
        open={modal.open}
        task={modal.task}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
