"use client";

import { Lock } from "lucide-react";
import type { PlannerStatus } from "./types";

type Props = {
  status: PlannerStatus;
  taskCount: number;
  onSubmit: () => void;
  validatorLabel?: string;
};

export function WeekStatusBanner({ status, taskCount, onSubmit, validatorLabel = "votre manager" }: Props) {
  if (status === "VALIDATED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-successLight px-4 py-2.5">
        <Lock size={14} className="flex-shrink-0 text-success" />
        <span className="text-sm font-medium text-success">Semaine validée — lecture seule</span>
      </div>
    );
  }

  if (status === "SUBMITTED") {
    return (
      <div className="rounded-lg border border-warning/20 bg-warningLight px-4 py-2.5">
        <span className="text-sm font-medium text-warning">
          En attente de validation par {validatorLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray200 bg-gray50 px-4 py-2.5">
      <span className="text-sm text-gray500">Brouillon — planifiez votre semaine puis soumettez pour validation</span>
      <button
        onClick={onSubmit}
        disabled={taskCount === 0}
        className="flex-shrink-0 rounded-md bg-facamBlue px-3 py-1.5 text-xs font-semibold text-facamWhite hover:bg-facamDark disabled:cursor-not-allowed disabled:opacity-40"
      >
        Soumettre pour validation
      </button>
    </div>
  );
}
