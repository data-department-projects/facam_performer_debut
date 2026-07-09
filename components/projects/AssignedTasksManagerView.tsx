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
};

export function AssignedTasksManagerView({ tasks, eligibleAssignees }: Readonly<Props>) {
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
          <p className="mt-0.5 text-xs text-gray500">
            Tâches créées par vous, hors de tout projet, attribuées aux collaborateurs de votre
            département.
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
          <p className="text-sm text-gray400">Aucune tâche indépendante créée pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-2.5 rounded-xl border border-gray200 bg-facamWhite p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-facamDark">{task.title}</p>
                <div className="flex shrink-0 gap-1">
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
              </div>

              {task.description && (
                <p className="text-xs text-gray500 line-clamp-2">{task.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 border-t border-gray100 pt-2.5">
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
            </div>
          ))}
        </div>
      )}

      <AssignedTaskFormModal
        key={`${modal.task?.id ?? "new"}-${String(modal.open)}`}
        open={modal.open}
        task={modal.task}
        eligibleAssignees={eligibleAssignees}
        onClose={() => setModal({ open: false })}
      />
    </div>
  );
}
