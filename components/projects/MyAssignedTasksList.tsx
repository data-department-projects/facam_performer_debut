"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateMyTaskProgress } from "@/actions/projects";

export type AssignedTask = {
  id: string;
  title: string;
  endDate: string;
  progressPercent: number;
  projectName: string;
};

const PROGRESS_STEPS = [0, 25, 50, 75, 100] as const;

type Props = {
  tasks: AssignedTask[];
};

export function MyAssignedTasksList({ tasks }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleProgress(taskId: string, value: number) {
    setPendingId(taskId);
    setToggleError(null);

    startTransition(async () => {
      const result = await updateMyTaskProgress(taskId, value);
      if (!result.success) {
        setToggleError(result.error ?? "Erreur lors de la mise à jour.");
      }
      setPendingId(null);
    });
  }

  if (tasks.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray400">
        Aucune tâche assignée pour le moment.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {toggleError && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-xs text-error">{toggleError}</p>
      )}
      <div className="flex flex-col divide-y divide-gray200 overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm">
        {tasks.map((task) => (
          <div key={task.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
            {/* Infos tâche */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-facamBlack">{task.title}</p>
              <p className="mt-0.5 text-xs text-gray400">
                {task.projectName} · Échéance{" "}
                {new Date(task.endDate + "T00:00:00").toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Boutons d'avancement */}
            <div className="flex flex-shrink-0 items-center gap-1">
              {pendingId === task.id && (
                <Loader2 size={14} className="mr-1 animate-spin text-facamBlue" />
              )}
              {PROGRESS_STEPS.map((step) => (
                <button
                  key={step}
                  onClick={() => handleProgress(task.id, step)}
                  disabled={pendingId === task.id}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                    task.progressPercent === step
                      ? "bg-facamBlue text-facamWhite"
                      : "bg-gray100 text-gray500 hover:bg-gray200"
                  }`}
                >
                  {step}%
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
