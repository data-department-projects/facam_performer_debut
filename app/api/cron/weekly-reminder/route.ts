import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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
      select: { email: true, fullName: true },
    });

    let sent = 0;
    for (const user of users) {
      try {
        await sendEmail({
          to: user.email,
          template: "weekly-reminder",
          data: { name: user.fullName },
        });
        sent++;
      } catch {
        console.error(`[cron/weekly-reminder] Échec envoi à ${user.email}`);
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
