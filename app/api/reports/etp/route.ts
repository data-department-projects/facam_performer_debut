import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { getEtpData } from "@/lib/dashboard-queries";
import { generateEtpPdf } from "@/lib/reports/etp-report";

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
    const { entries, teamCharges, periodLabel } = await getEtpData(period);
    const buffer = await generateEtpPdf(entries, teamCharges, periodLabel);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="suivi-etp-${period}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[reports/etp/pdf]", error);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
