import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CommitteeList } from "@/components/committees/CommitteeList";
import { CollaboratorCommitteesView } from "@/components/committees/CollaboratorCommitteesView";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { committeeInclude, toMockCommittee } from "@/app/committees/_db-helpers";

export const dynamic = "force-dynamic";

export default async function CommitteesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const userId = session.user.id;

  // ─── Branche Collaborateur / Stagiaire ────────────────────────────────────
  if (role === "COLLABORATOR" || role === "INTERN") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [committeeData, actionData] = await Promise.all([
      prisma.committee.findMany({
        where: { members: { some: { userId } } },
        select: {
          id: true,
          name: true,
          objectives: true,
          frequency: true,
          meetings: {
            where: { meetingDate: { gte: today } },
            select: {
              meetingDate: true,
              startDateTime: true,
              endDateTime: true,
              meetingLink: true,
            },
            orderBy: { meetingDate: "asc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.committeeAction.findMany({
        where: { responsibleUserId: userId },
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          meeting: {
            select: {
              meetingDate: true,
              committee: { select: { name: true } },
            },
          },
        },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    const committees = committeeData.map((c) => ({
      id: c.id,
      name: c.name,
      objectives: c.objectives,
      frequency: c.frequency as "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "AD_HOC",
      nextMeeting: c.meetings[0]
        ? {
            meetingDate: c.meetings[0].meetingDate.toISOString().split("T")[0],
            startTime: c.meetings[0].startDateTime.toISOString().slice(11, 16),
            endTime: c.meetings[0].endDateTime.toISOString().slice(11, 16),
            meetingLink: c.meetings[0].meetingLink ?? null,
          }
        : null,
    }));

    const myActions = actionData.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate.toISOString().split("T")[0],
      status: a.status as "PENDING" | "DONE",
      committeeName: a.meeting.committee.name,
      meetingDate: a.meeting.meetingDate.toISOString().split("T")[0],
    }));

    return (
      <AppShell pageTitle="Comités">
        <CollaboratorCommitteesView committees={committees} myActions={myActions} />
      </AppShell>
    );
  }

  // ─── Branche Admin / Manager ───────────────────────────────────────────────
  const canCreate = role === "ADMIN" || role === "MANAGER";

  const dbCommittees = await prisma.committee.findMany({
    where: role === "MANAGER"
      ? { OR: [{ members: { some: { userId } } }, { responsibleUserId: userId }] }
      : undefined,
    include: committeeInclude,
    orderBy: { createdAt: "desc" },
  });

  const committees = dbCommittees.map(toMockCommittee);

  return (
    <AppShell pageTitle="Comités">
      <CommitteeList committees={committees} canCreate={canCreate} />
    </AppShell>
  );
}
