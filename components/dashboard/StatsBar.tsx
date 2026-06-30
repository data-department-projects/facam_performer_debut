import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Briefcase,
  CalendarDays,
  AlertTriangle,
  Minus,
} from "lucide-react";
import type { KpiCard } from "./types";

const POSITION_ICONS = [TrendingUp, BarChart3, Briefcase, CalendarDays] as const;

const COLOR_MAP: Record<
  KpiCard["color"],
  { topBar: string; iconBg: string; iconColor: string; valueColor: string }
> = {
  blue: {
    topBar: "bg-facamBlue",
    iconBg: "bg-facamBlueTint",
    iconColor: "text-facamBlue",
    valueColor: "text-facamBlue",
  },
  success: {
    topBar: "bg-success",
    iconBg: "bg-successLight",
    iconColor: "text-success",
    valueColor: "text-success",
  },
  yellow: {
    topBar: "bg-facamYellow",
    iconBg: "bg-warningLight",
    iconColor: "text-warning",
    valueColor: "text-facamDark",
  },
  error: {
    topBar: "bg-error",
    iconBg: "bg-errorLight",
    iconColor: "text-error",
    valueColor: "text-error",
  },
};

function TrendBadge({ trend }: { trend: NonNullable<KpiCard["trend"]> }) {
  const isPositive = trend.value > 0;
  const isNeutral = trend.value === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isNeutral
    ? "text-gray500"
    : isPositive
      ? "text-success"
      : "text-error";
  const sign = isPositive ? "+" : "";

  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {sign}{trend.value}pt&nbsp;
      <span className="font-normal text-gray400">{trend.label}</span>
    </span>
  );
}

export function StatsBar({ kpis }: { kpis: KpiCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => {
        const colors = COLOR_MAP[kpi.color];
        const Icon =
          kpi.color === "error"
            ? AlertTriangle
            : (POSITION_ICONS[index] ?? TrendingUp);

        return (
          <div
            key={kpi.label}
            className="overflow-hidden rounded-xl border border-gray200 bg-facamWhite shadow-sm"
          >
            {/* Top accent bar */}
            <div className={`h-1 w-full ${colors.topBar}`} />

            <div className="flex items-start gap-4 p-5">
              {/* Icon badge */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${colors.iconColor}`} />
              </div>

              {/* Label + value + trend */}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase leading-tight tracking-wider text-gray500">
                  {kpi.label}
                </p>
                <p className={`mt-1.5 text-2xl font-bold leading-none ${colors.valueColor}`}>
                  {kpi.value}
                </p>

                {/* Ligne sous la valeur — trend ou sub */}
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {kpi.trend && <TrendBadge trend={kpi.trend} />}
                  {kpi.sub && (
                    <span className="text-[10px] text-gray400">{kpi.sub}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
