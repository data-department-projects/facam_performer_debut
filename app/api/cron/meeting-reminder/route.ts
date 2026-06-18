import { NextRequest, NextResponse } from "next/server";

// Logique complète implémentée en Phase 4 (dépend des CommitteeMeeting)
// Stub vérifié en Phase 1 pour valider la structure cron
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Non autorisé" },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, data: { message: "À implémenter en Phase 4" } });
}
