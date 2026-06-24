"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { ganttTaskSchema, type GanttTaskInput } from "@/lib/schemas/ganttTask";
import {
  createGanttTask,
  updateGanttTask,
  deleteGanttTask,
} from "@/actions/ganttTasks";

type TaskOption = { id: string; title: string };
type TeamMemberOption = { id: string; fullName: string };

type EditableTask = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  progressPercent: number;
  dependsOnIds: string[];
  responsibleUserId: string;
};

type Props = {
  mode: "create" | "edit";
  projectId: string;
  task?: EditableTask;
  existingTasks: TaskOption[];
  teamMembers: TeamMemberOption[];
  onClose: () => void;
  onSuccess: () => void;
};

export function GanttTaskFormModal({
  mode,
  projectId,
  task,
  existingTasks,
  teamMembers,
  onClose,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [progress, setProgress] = useState(task?.progressPercent ?? 0);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<GanttTaskInput>({
    resolver: zodResolver(ganttTaskSchema) as unknown as Resolver<GanttTaskInput>,
    defaultValues: {
      title: task?.title ?? "",
      startDate: task?.startDate ?? "",
      endDate: task?.endDate ?? "",
      responsibleUserId: task?.responsibleUserId ?? "",
      dependsOnIds: task?.dependsOnIds ?? [],
      progressPercent: task?.progressPercent ?? 0,
    },
  });

  const selectedDeps = useWatch({ control, name: "dependsOnIds" }) ?? [];

  const toggleDep = (id: string) => {
    const next = selectedDeps.includes(id)
      ? selectedDeps.filter((d) => d !== id)
      : [...selectedDeps, id];
    setValue("dependsOnIds", next, { shouldValidate: false });
  };

  const onSubmit = (data: GanttTaskInput) => {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createGanttTask(projectId, data)
          : await updateGanttTask(task!.id, data);

      if (!result.success) {
        setServerError(result.error ?? "Erreur inattendue.");
      } else {
        onSuccess();
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteGanttTask(task!.id);
      if (!result.success) {
        setServerError(result.error ?? "Erreur inattendue.");
        setShowDeleteConfirm(false);
      } else {
        onSuccess();
      }
    });
  };

  // Exclure la tâche courante des options de prérequis (pas d'auto-dépendance)
  const depOptions = existingTasks.filter((t) => t.id !== task?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-facamBlack/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-facamWhite shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray200 px-6 py-4">
          <h2 className="text-base font-semibold text-facamDark">
            {mode === "create" ? "Créer une tâche" : "Modifier la tâche"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-gray400 hover:bg-gray100 hover:text-facamDark transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-6"
        >
          {serverError && (
            <div className="flex items-start gap-2 rounded-lg border border-errorLight bg-errorLight/20 px-3 py-2.5 text-sm text-error">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Titre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray500">
              Titre <span className="text-error">*</span>
            </label>
            <input
              autoFocus
              placeholder="Ex. Analyse des besoins"
              className={`rounded-lg border px-3 py-2 text-sm text-facamBlack placeholder:text-gray300 focus:outline-none focus:ring-2 focus:ring-facamBlue/20 focus:border-facamBlue transition-colors ${
                errors.title ? "border-error" : "border-gray300"
              }`}
              {...register("title")}
            />
            {errors.title && (
              <span className="text-xs text-error">{errors.title.message}</span>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray500">
                Date début <span className="text-error">*</span>
              </label>
              <input
                type="date"
                className={`rounded-lg border px-3 py-2 text-sm text-facamBlack focus:outline-none focus:ring-2 focus:ring-facamBlue/20 focus:border-facamBlue transition-colors ${
                  errors.startDate ? "border-error" : "border-gray300"
                }`}
                {...register("startDate")}
              />
              {errors.startDate && (
                <span className="text-xs text-error">{errors.startDate.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray500">
                Date fin <span className="text-error">*</span>
              </label>
              <input
                type="date"
                className={`rounded-lg border px-3 py-2 text-sm text-facamBlack focus:outline-none focus:ring-2 focus:ring-facamBlue/20 focus:border-facamBlue transition-colors ${
                  errors.endDate ? "border-error" : "border-gray300"
                }`}
                {...register("endDate")}
              />
              {errors.endDate && (
                <span className="text-xs text-error">{errors.endDate.message}</span>
              )}
            </div>
          </div>

          {/* Responsable */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray500">
              Responsable <span className="text-error">*</span>
            </label>
            <select
              className={`rounded-lg border px-3 py-2 text-sm text-facamBlack focus:outline-none focus:ring-2 focus:ring-facamBlue/20 focus:border-facamBlue transition-colors ${
                errors.responsibleUserId ? "border-error" : "border-gray300"
              }`}
              {...register("responsibleUserId")}
            >
              <option value="">— Sélectionner un responsable —</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
            {errors.responsibleUserId && (
              <span className="text-xs text-error">{errors.responsibleUserId.message}</span>
            )}
          </div>

          {/* Avancement */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray500">Avancement</label>
              <span className="rounded-full bg-facamBlueTint px-2 py-0.5 text-xs font-bold text-facamBlue">
                {progress}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                className="flex-1 accent-facamBlue"
                {...register("progressPercent", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setProgress(Number(e.target.value)),
                })}
              />
            </div>
            {/* Progress bar visuelle */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
              <div
                className="h-full rounded-full bg-facamYellow transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Prérequis */}
          {depOptions.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray500">
                Tâches prérequises{" "}
                <span className="font-normal text-gray400">(optionnel)</span>
              </label>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-gray200 divide-y divide-gray100">
                {depOptions.map((t) => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-facamBlue"
                      checked={selectedDeps.includes(t.id)}
                      onChange={() => toggleDep(t.id)}
                    />
                    <span className="text-sm text-facamDark">{t.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 border-t border-gray100 pt-4">
            {/* Suppression (mode édition uniquement) */}
            <div>
              {mode === "edit" && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-error/40 px-3 py-2 text-xs font-semibold text-error hover:bg-error/5 transition-colors"
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              )}
              {mode === "edit" && showDeleteConfirm && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-error">Supprimer ?</span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleDelete}
                    className="rounded-lg bg-error px-3 py-1.5 text-xs font-bold text-facamWhite hover:opacity-90 disabled:opacity-60"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-lg border border-gray200 px-3 py-1.5 text-xs text-gray500 hover:bg-gray50"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {/* Submit / Cancel */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors disabled:opacity-60"
              >
                {isPending
                  ? mode === "create"
                    ? "Création..."
                    : "Enregistrement..."
                  : mode === "create"
                    ? "Créer la tâche"
                    : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
