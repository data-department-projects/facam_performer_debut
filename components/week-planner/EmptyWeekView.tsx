"use client";

import { useTransition } from "react";
import { CalendarPlus } from "lucide-react";
import { createWeekPlanner } from "@/actions/weekPlanner";

type Props = {
  weekStartDate: string;
  weekLabel: string;
};

export function EmptyWeekView({ weekStartDate, weekLabel }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      await createWeekPlanner(weekStartDate);
    });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-gray200 bg-facamWhite py-20 shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-facamBlueTint/50">
        <CalendarPlus size={24} className="text-facamBlue" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-facamDark">Aucun planning pour cette semaine</p>
        <p className="mt-1 text-xs text-gray400">Semaine du {weekLabel}</p>
      </div>
      <button
        onClick={handleCreate}
        disabled={isPending}
        className="rounded-lg bg-facamBlue px-5 py-2.5 text-sm font-semibold text-facamWhite hover:bg-facamDark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Création…" : "Démarrer ma semaine"}
      </button>
    </div>
  );
}
