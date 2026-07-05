import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDashboardData, type PeriodSelection } from "@/lib/dashboard-queries";
import { getDashboardFilterOptions } from "@/lib/dashboard-filter-options";
import type { DashboardActiveFilters, DashboardPeriod } from "@/components/dashboard/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  period?: string;
  year?: string;
  month?: string;
  quarter?: string;
  week?: string;
  dept?: string;
  status?: string;
  priority?: string;
  member?: string;
  objtype?: string;
}>;

function currentWeekMondayIso(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const dow = now.getUTCDay();
  const toMon = dow === 0 ? -6 : 1 - dow;
  return new Date(Date.UTC(y, m, d + toMon)).toISOString().slice(0, 10);
}

function parsePeriod(period?: string): DashboardPeriod {
  if (period === "month" || period === "quarter" || period === "year") return period;
  return "week";
}

function parseYear(year?: string): number {
  const n = Number(year);
  return year && Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : new Date().getUTCFullYear();
}

function parseMonth(month?: string): number {
  const n = Number(month);
  return month && Number.isInteger(n) && n >= 1 && n <= 12 ? n : new Date().getUTCMonth() + 1;
}

function parseQuarter(quarter?: string): number {
  const n = Number(quarter);
  return quarter && Number.isInteger(n) && n >= 1 && n <= 4
    ? n
    : Math.floor(new Date().getUTCMonth() / 3) + 1;
}

function parseWeek(week?: string): string {
  return week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : currentWeekMondayIso();
}

function parseFilters(
  params: Awaited<SearchParams>,
  period: DashboardPeriod,
): DashboardActiveFilters {
  return {
    period,
    year: parseYear(params.year),
    month: parseMonth(params.month),
    quarter: parseQuarter(params.quarter),
    week: parseWeek(params.week),
    departmentId: params.dept || null,
    projectStatus: params.status || null,
    strategicPriority: params.priority || null,
    memberId: params.member || null,
    objectiveType: params.objtype || null,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId, departmentId, name: userName } = session.user;

  const params = await searchParams;
  const period = parsePeriod(params.period);
  const filters = parseFilters(params, period);
  const selection: PeriodSelection = {
    period,
    year: filters.year,
    month: filters.month,
    quarter: filters.quarter,
    week: filters.week,
  };

  const [data, filterOptions] = await Promise.all([
    getDashboardData({
      role,
      userId,
      departmentId: departmentId ?? null,
      selection,
      filters: {
        departmentId: filters.departmentId,
        projectStatus: filters.projectStatus,
        strategicPriority: filters.strategicPriority,
        memberId: filters.memberId,
        objectiveType: filters.objectiveType,
      },
    }),
    getDashboardFilterOptions(role, userId),
  ]);

  return (
    <DashboardView
      role={role}
      data={data}
      userName={userName ?? null}
      filters={filters}
      filterOptions={filterOptions}
    />
  );
}
