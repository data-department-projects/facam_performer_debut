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
    const { endpoint } = body;

    await prisma.$transaction([
      ...(endpoint
        ? [
            prisma.pushSubscription.deleteMany({
              where: { userId: session.user.id, endpoint },
            }),
          ]
        : [
            prisma.pushSubscription.deleteMany({
              where: { userId: session.user.id },
            }),
          ]),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          notificationConsent: "DECLINED",
          notificationConsentAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/push/unsubscribe]", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 },
    );
  }
}
