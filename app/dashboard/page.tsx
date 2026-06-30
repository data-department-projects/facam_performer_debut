import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDashboardData } from "@/lib/dashboard-queries";
import { getDashboardFilterOptions } from "@/lib/dashboard-filter-options";
import type { DashboardActiveFilters, DashboardPeriod } from "@/components/dashboard/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  period?: string;
  dept?: string;
  status?: string;
  priority?: string;
  member?: string;
  objtype?: string;
}>;

function parsePeriod(period?: string): DashboardPeriod {
  if (period === "month" || period === "quarter" || period === "year") return period;
  return "week";
}

function parseFilters(
  params: Awaited<SearchParams>,
  period: DashboardPeriod,
): DashboardActiveFilters {
  return {
    period,
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

  const [data, filterOptions] = await Promise.all([
    getDashboardData({
      role,
      userId,
      departmentId: departmentId ?? null,
      period,
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
