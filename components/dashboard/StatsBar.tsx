import type { KpiCard } from "./types";

const colorMap: Record<KpiCard["color"], { value: string; dot: string }> = {
  blue: { value: "text-facamBlue", dot: "bg-facamBlue" },
  success: { value: "text-success", dot: "bg-success" },
  yellow: { value: "text-facamDark", dot: "bg-facamYellow" },
  error: { value: "text-error", dot: "bg-error" },
};

export function StatsBar({ kpis }: { kpis: KpiCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const colors = colorMap[kpi.color];
        return (
          <div
            key={kpi.label}
            className="flex flex-col gap-2 rounded-[--radius-xl] border border-gray200 bg-facamWhite p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray500">
                {kpi.label}
              </p>
            </div>
            <p className={`text-3xl font-semibold ${colors.value}`}>
              {kpi.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
