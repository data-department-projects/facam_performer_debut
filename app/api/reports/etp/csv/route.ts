import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { getEtpData } from "@/lib/dashboard-queries";
import { rowsToCsv } from "@/lib/reports/csv-export";

function parsePeriod(p: string | null): "week" | "month" | "quarter" {
  if (p === "month" || p === "quarter") return p;
  return "week";
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const period = parsePeriod(req.nextUrl.searchParams.get("period"));
    const { entries, periodLabel } = await getEtpData(period);

    const csvRows = entries.map((e) => ({
      Collaborateur: e.collaboratorName,
      Département: e.department,
      Équipe: e.team,
      Activité: e.activityLabel,
      Date: e.date,
      "Heures déclarées": e.hoursSpent,
    }));

    const csv = `Période: ${periodLabel}\n${rowsToCsv(csvRows)}`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="suivi-etp-${period}.csv"`,
      },
    });
  } catch (error) {
    console.error("[reports/etp/csv]", error);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
