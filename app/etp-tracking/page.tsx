import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { EtpPageView } from "@/components/etp/EtpPageView";
import { getEtpData } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ period?: string }>;

function parsePeriod(p?: string): "week" | "month" | "quarter" {
  if (p === "month" || p === "quarter") return p;
  return "week";
}

export default async function EtpTrackingPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const period = parsePeriod(params.period);
  const { entries, teamCharges, periodLabel } = await getEtpData(period);

  return (
    <AppShell pageTitle="Suivi ETP & Temps">
      <EtpPageView
        entries={entries}
        teamCharges={teamCharges}
        period={period}
        periodLabel={periodLabel}
      />
    </AppShell>
  );
}
