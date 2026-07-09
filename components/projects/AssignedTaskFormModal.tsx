"use client";

import { useEffect, useState } from "react";
import { createAssignedTask, updateAssignedTask } from "@/actions/assignedTasks";
import { TaskFormModalShell, type TaskFormResult } from "@/components/projects/TaskFormModalShell";

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
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAssignees(task?.assigneeIds ?? []);
    }
  }, [open, task]);

  function toggleAssignee(id: string) {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  async function handleSubmit({
    title,
    description,
  }: {
    title: string;
    description: string;
  }): Promise<TaskFormResult> {
    const payload = { title, description: description || undefined, assigneeIds: selectedAssignees };
    const result = task
      ? await updateAssignedTask(task.id, payload)
      : await createAssignedTask(payload);
    return result.success ? { success: true } : { success: false, error: result.error };
  }

  return (
    <TaskFormModalShell
      open={open}
      headerTitle={task ? "Modifier la tâche" : "Nouvelle tâche"}
      titlePlaceholder="Ex : Préparer le support de présentation"
      initialTitle={task?.title ?? ""}
      initialDescription={task?.description ?? ""}
      submitLabel={task ? "Enregistrer" : "Créer"}
      onClose={onClose}
      onSubmit={handleSubmit}
      extraContent={
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
      }
    />
  );
}
