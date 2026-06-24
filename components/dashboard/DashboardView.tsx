"use client";

import { useRouter } from "next/navigation";
import { StatsBar } from "./StatsBar";
import { DashboardCharts } from "./DashboardCharts";
import { RecentActivity } from "./RecentActivity";
import { DashboardTable } from "./DashboardTable";
import type { DashboardData, DashboardPeriod } from "./types";

const periodLabels: Record<DashboardPeriod, string> = {
  week: "Cette semaine",
  month: "Ce mois",
  quarter: "Ce trimestre",
};

export function DashboardView({
  role,
  period,
  data,
}: {
  role: string;
  period: DashboardPeriod;
  data: DashboardData;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      {/* Filtre de période */}
      <div className="flex items-center gap-2">
        {(Object.keys(periodLabels) as DashboardPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => router.push(`/dashboard?period=${p}`)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              period === p
                ? "bg-facamBlue text-facamWhite"
                : "bg-facamWhite border border-gray200 text-gray600 hover:bg-gray50",
            ].join(" ")}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <StatsBar kpis={data.kpis} />

      {/* Graphiques */}
      <DashboardCharts
        barChartData={data.barChartData}
        pieChartData={data.pieChartData}
      />

      {/* Activité récente */}
      <RecentActivity items={data.recentActivity} />

      {/* Tableau contextuel */}
      <DashboardTable role={role} data={data} />
    </div>
  );
}
