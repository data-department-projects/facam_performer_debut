import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CommitteeList } from "@/components/committees/CommitteeList";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MockCommittee } from "@/app/committees/_mock-data";

const committeeInclude = {
  responsible: { select: { fullName: true } },
  departments: { include: { department: { select: { name: true } } } },
  members: { include: { user: { select: { fullName: true } } } },
  meetings: {
    orderBy: { meetingDate: "desc" as const },
    include: {
      actions: {
        include: { responsible: { select: { fullName: true } } },
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
} as const;

type DbCommittee = Awaited<ReturnType<typeof fetchCommittees>>[number];

async function fetchCommittees() {
  return prisma.committee.findMany({
    include: committeeInclude,
    orderBy: { createdAt: "desc" },
  });
}

function toMockCommittee(c: DbCommittee): MockCommittee {
  return {
    id: c.id,
    name: c.name,
    responsible: c.responsible.fullName,
    objectives: c.objectives,
    frequency: c.frequency as MockCommittee["frequency"],
    departments: c.departments.map((d) => d.department.name),
    participants: c.members
      .filter((m) => m.memberType === "PARTICIPANT")
      .map((m) => ({ id: m.userId, name: m.user.fullName, role: "" })),
    guests: c.members
      .filter((m) => m.memberType === "GUEST")
      .map((m) => ({ id: m.userId, name: m.user.fullName, role: "" })),
    meetings: c.meetings.map((meeting) => ({
      id: meeting.id,
      meetingDate: meeting.meetingDate.toISOString().split("T")[0],
      startTime: meeting.startDateTime.toISOString().slice(11, 16),
      endTime: meeting.endDateTime.toISOString().slice(11, 16),
      meetingLink: meeting.meetingLink ?? undefined,
      actions: meeting.actions.map((action) => ({
        id: action.id,
        title: action.title,
        responsible: action.responsible.fullName,
        dueDate: action.dueDate.toISOString().split("T")[0],
        status: action.status as "PENDING" | "DONE",
      })),
    })),
  };
}

export default async function CommitteesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const canCreate = role === "ADMIN" || role === "MANAGER";

  const dbCommittees = await fetchCommittees();
  const committees = dbCommittees.map(toMockCommittee);

  return (
    <AppShell pageTitle="Comités">
      <CommitteeList committees={committees} canCreate={canCreate} />
    </AppShell>
  );
}
