"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Users } from "lucide-react";
import { deleteAssignedTask } from "@/actions/assignedTasks";
import {
  AssignedTaskFormModal,
  type EditableAssignedTask,
} from "@/components/projects/AssignedTaskFormModal";

type SimpleUser = { id: string; fullName: string };

export type ManagerAssignedTask = {
  id: string;
  title: string;
  description: string | null;
  assignees: SimpleUser[];
};

type Props = {
  tasks: ManagerAssignedTask[];
  eligibleAssignees: SimpleUser[];
  isAdmin?: boolean;
};

export function AssignedTasksManagerView({ tasks, eligibleAssignees, isAdmin }: Readonly<Props>) {
  const subtitle = isAdmin
    ? "Tâches créées par vous, hors de tout projet, attribuées aux managers actifs de l'entreprise."
    : "Tâches créées par vous, hors de tout projet, attribuées aux collaborateurs de votre département.";
  const emptyAssigneesMessage = isAdmin
    ? "Aucun manager actif dans l'entreprise."
    : "Aucun collaborateur actif dans votre département.";
  const [modal, setModal] = useState<{ open: boolean; task?: EditableAssignedTask }>({
    open: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteAssignedTask(id);
      if (!result.success) setError(result.error ?? "Impossible de supprimer la tâche.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-facamDark">Tâches indépendantes</h2>
          <p className="mt-0.5 text-xs text-gray500">{subtitle}</p>
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
          <p className="text-sm text-gray400">Aucune tâche indépendante créée pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray200">
                  <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Tâche</th>
                  <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-gray500">Attribuée à</th>
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Users size={12} className="text-gray400" />
                        {task.assignees.length === 0 ? (
                          <span className="text-xs text-gray400">Non attribuée</span>
                        ) : (
                          task.assignees.map((a) => (
                            <span
                              key={a.id}
                              className="rounded-full bg-facamBlueTint px-2 py-0.5 text-[11px] font-medium text-facamBlue"
                            >
                              {a.fullName}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex shrink-0 justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setModal({
                              open: true,
                              task: {
                                id: task.id,
                                title: task.title,
                                description: task.description,
                                assigneeIds: task.assignees.map((a) => a.id),
                              },
                            })
                          }
                          className="rounded p-1 text-gray400 hover:bg-gray50 hover:text-facamBlue"
                          aria-label="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={task.assignees.length > 0 || isPending}
                          onClick={() => handleDelete(task.id)}
                          title={
                            task.assignees.length > 0
                              ? "Impossible de supprimer une tâche déjà attribuée"
                              : "Supprimer"
                          }
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

      <AssignedTaskFormModal
        key={`${modal.task?.id ?? "new"}-${String(modal.open)}`}
        open={modal.open}
        task={modal.task}
        eligibleAssignees={eligibleAssignees}
        emptyAssigneesMessage={emptyAssigneesMessage}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
