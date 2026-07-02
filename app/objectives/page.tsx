import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { CollaboratorObjectivesView } from "@/components/objectives/CollaboratorObjectivesView";
import { ManagerObjectivesFullView } from "@/components/objectives/ManagerObjectivesFullView";
import type { ObjectiveWithKeyResults, KeyResultWithCert } from "@/components/objectives/types";
import type { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

type RawObjectiveRow = Prisma.ObjectiveGetPayload<{
  include: {
    user: { select: { fullName: true } };
    keyResults: true;
  };
}>;

function mapObjective(obj: RawObjectiveRow): ObjectiveWithKeyResults {
  return {
    id: obj.id,
    userId: obj.userId,
    userName: obj.user.fullName,
    name: obj.name,
    description: obj.description,
    type: obj.type as ObjectiveWithKeyResults["type"],
    risks: obj.risks,
    periodStart: obj.periodStart.toISOString().slice(0, 10),
    periodEnd: obj.periodEnd.toISOString().slice(0, 10),
    keyResults: obj.keyResults.map((kr): KeyResultWithCert => ({
      id: kr.id,
      description: kr.description,
      targetValue: kr.targetValue ? Number(kr.targetValue) : null,
      currentValue: kr.currentValue ? Number(kr.currentValue) : null,
      evidenceNote: kr.evidenceNote,
      dueDate: kr.dueDate ? kr.dueDate.toISOString().slice(0, 10) : null,
      status: kr.status as KeyResultWithCert["status"],
      certificateUrl: kr.certificateUrl,
    })),
  };
}

export default async function ObjectivesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId, departmentId } = session.user;

  if (role === "ADMIN") redirect("/department-objectives");

  if (role === "MANAGER") {
    if (!departmentId) redirect("/dashboard");

    const [ownRows, teamRows] = await Promise.all([
      prisma.objective.findMany({
        where: { userId },
        include: {
          user: { select: { fullName: true } },
          keyResults: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.objective.findMany({
        where: { user: { departmentId, id: { not: userId } } },
        include: {
          user: { select: { fullName: true } },
          keyResults: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return (
      <AppShell pageTitle="Objectifs">
        <ManagerObjectivesFullView
          ownObjectives={ownRows.map(mapObjective)}
          teamObjectives={teamRows.map(mapObjective)}
        />
      </AppShell>
    );
  }

  const rows = await prisma.objective.findMany({
    where: { userId },
    include: {
      user: { select: { fullName: true } },
      keyResults: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell pageTitle="Objectifs">
      <CollaboratorObjectivesView initialObjectives={rows.map(mapObjective)} />
    </AppShell>
  );
}
