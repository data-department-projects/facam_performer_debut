"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { createMilestone } from "@/actions/projects";
import { milestoneSchema, MILESTONE_STATUSES, type MilestoneInput } from "@/lib/schemas/project";

const STATUS_LABELS: Record<(typeof MILESTONE_STATUSES)[number], string> = {
  PENDING: "Prévu",
  IN_PROGRESS: "En cours",
  DONE: "Atteint",
  DELAYED: "En retard",
};

type TeamMemberOption = { id: string; fullName: string };

type Props = {
  projectId: string;
  teamMembers: TeamMemberOption[];
  onClose: () => void;
};

export function MilestoneFormModal({ projectId, teamMembers, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MilestoneInput>({
    resolver: zodResolver(milestoneSchema) as unknown as Resolver<MilestoneInput>,
    defaultValues: { status: "PENDING" },
  });

  const onSubmit = (data: MilestoneInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createMilestone(projectId, data);
      if (!result.success) {
        setServerError(result.error ?? "Erreur inattendue.");
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-facamBlack/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-facamWhite shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray200 px-6 py-4">
          <h2 className="text-base font-semibold text-facamDark">Ajouter un jalon</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray400 hover:text-facamDark transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6">
          {serverError && (
            <p className="rounded-md bg-errorLight/30 px-3 py-2 text-sm text-error">
              {serverError}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray500">
              Nom du jalon <span className="text-error">*</span>
            </label>
            <input
              className={`rounded-md border px-3 py-2 text-sm text-facamBlack placeholder:text-gray400 focus:outline-none focus:ring-2 focus:ring-facamBlue/20 focus:border-facamBlue ${
                errors.title ? "border-error" : "border-gray300"
              }`}
              placeholder="Ex. Kick-off & validation des spécifications"
              {...register("title")}
            />
            {errors.title && (
              <span className="text-xs text-error">{errors.title.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray500">Responsable</label>
            <select
              className="rounded-md border border-gray300 px-3 py-2 text-sm text-facamBlack focus:outline-none focus:ring-2 focus:ring-facamBlue/20 focus:border-facamBlue"
              {...register("responsibleUserId")}
            >
              <option value="">— Sélectionner un responsable —</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray500">
              Date de réalisation <span className="text-error">*</span>
            </label>
            <input
              type="date"
              className={`rounded-md border px-3 py-2 text-sm text-facamBlack focus:outline-none focus:ring-2 focus:ring-facamBlue/20 focus:border-facamBlue ${
                errors.targetDate ? "border-error" : "border-gray300"
              }`}
              {...register("targetDate")}
            />
            {errors.targetDate && (
              <span className="text-xs text-error">{errors.targetDate.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray500">Statut</label>
            <select
              className="rounded-md border border-gray300 px-3 py-2 text-sm text-facamBlack focus:outline-none focus:ring-2 focus:ring-facamBlue/20 focus:border-facamBlue"
              {...register("status")}
            >
              {MILESTONE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray300 bg-facamWhite px-4 py-2 text-sm font-medium text-facamDark hover:bg-gray50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-facamBlue px-4 py-2 text-sm font-semibold text-facamWhite hover:bg-facamDark transition-colors disabled:opacity-60"
            >
              {isPending ? "Ajout..." : "Ajouter le jalon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
