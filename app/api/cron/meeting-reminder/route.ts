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

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const meetings = await prisma.committeeMeeting.findMany({
    where: {
      reminderSentAt: null,
      startDateTime: { gte: now, lte: in24h },
    },
    select: {
      id: true,
      startDateTime: true,
      meetingLink: true,
      committee: {
        select: {
          name: true,
          members: { select: { userId: true } },
        },
      },
    },
  });

  let meetingsProcessed = 0;
  let membersNotified = 0;

  for (const meeting of meetings) {
    try {
      const formattedDate = meeting.startDateTime.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const formattedTime = meeting.startDateTime.toISOString().slice(11, 16);
      const committeeName = meeting.committee.name;

      for (const member of meeting.committee.members) {
        await notifyUser(member.userId, {
          title: "Rappel de réunion",
          body: `Réunion "${committeeName}" demain à ${formattedTime}`,
          url: "/committees",
          emailTemplate: "meeting-reminder",
          emailData: {
            committeeName,
            meetingDate: formattedDate,
            meetingTime: formattedTime,
            ...(meeting.meetingLink ? { meetingLink: meeting.meetingLink } : {}),
          },
        });
        membersNotified++;
      }

      await prisma.committeeMeeting.update({
        where: { id: meeting.id },
        data: { reminderSentAt: new Date() },
      });
      meetingsProcessed++;
    } catch (error) {
      console.error(`[cron/meeting-reminder] réunion ${meeting.id}`, error);
    }
  }

  return NextResponse.json({ success: true, data: { meetingsProcessed, membersNotified } });
}
