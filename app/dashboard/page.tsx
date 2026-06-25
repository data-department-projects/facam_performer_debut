import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDashboardData } from "@/lib/dashboard-queries";
import type { DashboardPeriod } from "@/components/dashboard/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ period?: string }>;

function parsePeriod(period?: string): DashboardPeriod {
  if (period === "month" || period === "quarter") return period;
  return "week";
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
  const data = await getDashboardData({
    role,
    userId,
    departmentId: departmentId ?? null,
    period,
  });

  return <DashboardView role={role} period={period} data={data} userName={userName ?? null} />;
}
