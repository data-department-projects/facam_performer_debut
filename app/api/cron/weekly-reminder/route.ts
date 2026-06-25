import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Non autorisé" },
      { status: 401 },
    );
  }

  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true },
    });

    let sent = 0;
    for (const user of users) {
      try {
        await notifyUser(user.id, {
          title: "Planifiez votre semaine",
          body: "N'oubliez pas de planifier votre semaine dans FACAM PERFORMER.",
          url: "/week-planner",
          emailTemplate: "weekly-reminder",
          emailData: {},
        });
        sent++;
      } catch {
        console.error(`[cron/weekly-reminder] Échec envoi à ${user.id}`);
      }
    }

    return NextResponse.json({ success: true, data: { sent } });
  } catch (error) {
    console.error("[cron/weekly-reminder]", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 },
    );
  }
}
