"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { bugReportSchema, type BugReportInput } from "@/lib/schemas/bugReport";
import { submitBugReport } from "@/actions/bugReports";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function BugReportForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BugReportInput>({ resolver: zodResolver(bugReportSchema) });

  async function onSubmit(data: BugReportInput) {
    setServerError(null);
    const result = await submitBugReport(data);
    if (!result.success) {
      setServerError(result.error ?? "Une erreur est survenue.");
      return;
    }
    reset();
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-medium text-facamDark">Signalement envoyé</p>
          <p className="mt-0.5 text-sm text-gray500">
            Votre rapport a bien été transmis à l&apos;équipe support. Merci pour votre retour.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-3 text-sm text-facamBlue underline-offset-2 hover:underline"
          >
            Signaler un autre problème
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bug-description" className="text-sm font-medium text-facamDark">
          Description du problème
        </Label>
        <textarea
          id="bug-description"
          rows={5}
          placeholder="Décrivez le problème rencontré, les étapes pour le reproduire et l'écran concerné…"
          className="w-full rounded-lg border border-gray200 bg-facamWhite px-4 py-3 text-sm text-facamBlack placeholder:text-gray400 focus:border-facamBlue focus:outline-none focus:ring-2 focus:ring-facamBlue/20 resize-none disabled:opacity-50"
          disabled={isSubmitting}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-error">{errors.description.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {serverError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="min-w-28">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Envoyer le rapport"
          )}
        </Button>
      </div>
    </form>
  );
}
