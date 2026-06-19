import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CommitteeDetail } from "@/components/committees/CommitteeDetail";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MockCommittee } from "@/app/committees/_mock-data";

type Props = {
  params: Promise<{ id: string }>;
};

async function fetchCommittee(id: string) {
  return prisma.committee.findUnique({
    where: { id },
    include: {
      responsible: { select: { fullName: true } },
      departments: { include: { department: { select: { name: true } } } },
      members: { include: { user: { select: { fullName: true } } } },
      meetings: {
        orderBy: { meetingDate: "desc" },
        include: {
          actions: {
            include: { responsible: { select: { fullName: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

type DbCommittee = NonNullable<Awaited<ReturnType<typeof fetchCommittee>>>;

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

export default async function CommitteeDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  const dbCommittee = await fetchCommittee(id);
  if (!dbCommittee) notFound();

  const committee = toMockCommittee(dbCommittee);

  return (
    <AppShell pageTitle={committee.name}>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/committees"
            className="text-xs text-gray400 hover:text-facamBlue transition-colors"
          >
            ← Retour aux comités
          </Link>
        </div>
        <CommitteeDetail committee={committee} canManage={canManage} />
      </div>
    </AppShell>
  );
}
