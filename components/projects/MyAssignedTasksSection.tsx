"use client";

import { useState, useTransition } from "react";
import { CheckSquare, Loader2 } from "lucide-react";
import { setTaskOfTheDay } from "@/actions/dailyExecution";

export type MyAssignedTask = {
  id: string;
  title: string;
  description: string | null;
  createdByName: string;
  alreadyAddedThisWeek: boolean;
};

type Props = {
  tasks: MyAssignedTask[];
};

export function MyAssignedTasksSection({ tasks }: Readonly<Props>) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (tasks.length === 0) return null;

  function handleSetAsToday(taskId: string) {
    setError(null);
    setPendingId(taskId);
    startTransition(async () => {
      const result = await setTaskOfTheDay(taskId);
      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
      } else {
        setDoneIds((prev) => new Set(prev).add(taskId));
      }
      setPendingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray200 bg-facamWhite p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-facamDark">Tâches qui me sont assignées</h2>
        <p className="mt-0.5 text-xs text-gray500">
          Tâches confiées par votre Manager, indépendantes de tout projet.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-errorLight px-3 py-2 text-xs text-error">{error}</p>
      )}

      <div className="flex flex-col gap-2">
        {tasks.map((task) => {
          const justSet = doneIds.has(task.id) || task.alreadyAddedThisWeek;
          return (
            <div
              key={task.id}
              className="flex flex-col gap-2 rounded-lg border border-gray100 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-facamDark">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 text-xs text-gray500 line-clamp-2">{task.description}</p>
                )}
                <p className="mt-1 text-[11px] text-gray400">Attribuée par {task.createdByName}</p>
              </div>
              <button
                type="button"
                disabled={isPending && pendingId === task.id ? true : justSet}
                onClick={() => handleSetAsToday(task.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-facamBlue px-3 py-1.5 text-xs font-medium text-facamBlue transition-colors hover:bg-facamBlueTint disabled:cursor-not-allowed disabled:border-gray200 disabled:text-gray400"
              >
                {isPending && pendingId === task.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckSquare size={12} />
                )}
                {justSet ? "Ajoutée à ma semaine" : "Définir comme tâche du jour"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
