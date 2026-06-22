"use client";

import { useRouter } from "next/navigation";
import { Clock, Users, TrendingUp, BarChart2 } from "lucide-react";
import { EtpConsolidationTable } from "./EtpConsolidationTable";
import { EtpExportButtons } from "./EtpExportButtons";
import type { EtpEntry, TeamCharge } from "@/lib/dashboard-queries";

export type { EtpEntry, TeamCharge };

type Period = "week" | "month" | "quarter";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Cette semaine",
  month: "Ce mois",
  quarter: "Ce trimestre",
};

function chargeColor(pct: number): string {
  if (pct > 100) return "bg-error";
  if (pct >= 90) return "bg-facamYellow";
  return "bg-facamBlue";
}

type Props = {
  entries: EtpEntry[];
  teamCharges: TeamCharge[];
  period: Period;
  periodLabel: string;
};

export function EtpPageView({ entries, teamCharges, period, periodLabel }: Props) {
  const router = useRouter();

  const totalHours = entries.reduce((s, e) => s + e.hoursSpent, 0);
  const etpConsome = totalHours / 8;
  const activeCollabs = new Set(entries.map((e) => e.collaboratorName)).size;
  const totalConsumed = teamCharges.reduce((s, t) => s + t.consumedHours, 0);
  const totalAvailable = teamCharges.reduce((s, t) => s + t.availableHours, 0);
  const tauxOccupation = totalAvailable > 0 ? Math.round((totalConsumed / totalAvailable) * 100) : 0;

  const kpis = [
    { icon: Clock, label: "Heures déclarées", value: `${totalHours.toFixed(1)} h`, color: "text-facamBlue" },
    { icon: BarChart2, label: "ETP consommé", value: `${etpConsome.toFixed(1)} j`, color: "text-facamBlue" },
    { icon: Users, label: "Collaborateurs actifs", value: String(activeCollabs), color: "text-facamDark" },
    {
      icon: TrendingUp,
      label: "Taux d'occupation",
      value: `${tauxOccupation} %`,
      color: tauxOccupation >= 90 ? "text-error" : "text-success",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête : filtre période + export */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 rounded-xl border border-gray200 bg-facamWhite p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => router.push(`/etp-tracking?period=${p}`)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                period === p ? "bg-facamBlue text-facamWhite" : "text-gray500 hover:text-facamDark"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <EtpExportButtons period={period} />
      </div>

      {/* Sous-titre période */}
      <p className="text-xs text-gray400">{periodLabel}</p>

      {/* KPI bar */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-2 rounded-2xl border border-gray200 bg-facamWhite p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray500">
              <kpi.icon size={15} />
              <span className="text-xs font-medium">{kpi.label}</span>
            </div>
            <p className={`text-[30px] font-semibold leading-none ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charge par équipe */}
      {teamCharges.length > 0 && (
        <div className="rounded-2xl border border-gray200 bg-facamWhite p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-facamDark">Charge par équipe</h2>
          <div className="flex flex-col gap-4">
            {teamCharges.map((tc) => {
              const pct = Math.min(Math.round((tc.consumedHours / tc.availableHours) * 100), 120);
              const fillColor = chargeColor(pct);
              return (
                <div key={tc.team} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-facamDark">{tc.team}</span>
                    <span className="text-xs text-gray500">
                      {tc.consumedHours} h / {tc.availableHours} h disponibles
                      <span className={`ml-2 font-semibold ${pct >= 90 ? "text-error" : "text-facamBlue"}`}>
                        {pct} %
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray200">
                    <div
                      className={`h-full rounded-full transition-all ${fillColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray400">{tc.department}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tableau consolidé */}
      <EtpConsolidationTable entries={entries} />
    </div>
  );
}
