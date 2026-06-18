import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: "Données de subscription invalides" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.pushSubscription.upsert({
        where: { endpoint },
        create: {
          userId: session.user.id,
          endpoint,
          p256dhKey: keys.p256dh,
          authKey: keys.auth,
        },
        update: {
          p256dhKey: keys.p256dh,
          authKey: keys.auth,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          notificationConsent: "ACCEPTED",
          notificationConsentAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/push/subscribe]", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 },
    );
  }
}
