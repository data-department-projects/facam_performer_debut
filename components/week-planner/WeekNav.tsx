"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  weekStartDate: string;
  weekLabel: string;
};

function offsetDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split("T")[0];
}

export function WeekNav({ weekStartDate, weekLabel }: Readonly<Props>) {
  const router = useRouter();

  function change(delta: number) {
    router.push(`/week-planner?week=${offsetDate(weekStartDate, delta * 7)}`);
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray200 bg-facamWhite px-4 py-3 shadow-sm">
      <button
        onClick={() => change(-1)}
        className="flex items-center gap-1 rounded-md border border-gray200 bg-facamWhite px-3 py-2 text-sm text-gray500 hover:bg-gray50"
      >
        <ChevronLeft size={14} />
        Semaine précédente
      </button>

      <span className="text-sm font-semibold text-facamDark">Semaine du {weekLabel}</span>

      <button
        onClick={() => change(1)}
        className="flex items-center gap-1 rounded-md border border-gray200 bg-facamWhite px-3 py-2 text-sm text-gray500 hover:bg-gray50"
      >
        Semaine suivante
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
