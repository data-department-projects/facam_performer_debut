"use client";

import { createPersonalTask, updatePersonalTask } from "@/actions/personalTasks";
import { TaskFormModalShell, type TaskFormResult } from "@/components/projects/TaskFormModalShell";

export type EditablePersonalTask = {
  id: string;
  title: string;
  description: string | null;
};

type Props = {
  open: boolean;
  task?: EditablePersonalTask;
  onClose: () => void;
};

export function PersonalTaskFormModal({ open, task, onClose }: Readonly<Props>) {
  async function handleSubmit({
    title,
    description,
  }: {
    title: string;
    description: string;
  }): Promise<TaskFormResult> {
    const payload = { title, description: description || undefined };
    const result = task
      ? await updatePersonalTask(task.id, payload)
      : await createPersonalTask(payload);
    return result.success ? { success: true } : { success: false, error: result.error };
  }

  return (
    <TaskFormModalShell
      open={open}
      headerTitle={task ? "Modifier la tâche" : "Nouvelle tâche personnelle"}
      titlePlaceholder="Ex : Préparer mon entretien annuel"
      initialTitle={task?.title ?? ""}
      initialDescription={task?.description ?? ""}
      submitLabel={task ? "Enregistrer" : "Créer"}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
}
