import type { MockCommittee } from "@/app/committees/_mock-data";

// Type structurel dérivé du shape Prisma attendu par toMockCommittee
// Indépendant des types générés pour éviter le couplage avec la version Prisma
type CommitteeForMapping = {
  id: string;
  name: string;
  objectives: string;
  frequency: string;
  responsible: { fullName: string };
  departments: { department: { name: string } }[];
  members: { userId: string; memberType: string; user: { fullName: string } }[];
  meetings: {
    id: string;
    meetingDate: Date;
    startDateTime: Date;
    endDateTime: Date;
    meetingLink: string | null;
    actions: {
      id: string;
      title: string;
      dueDate: Date;
      status: string;
      responsible: { fullName: string };
    }[];
  }[];
};

export const committeeInclude = {
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

export function toMockCommittee(c: CommitteeForMapping): MockCommittee {
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
