import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { DepartmentObjectivesByDept } from "@/components/objectives/DepartmentObjectivesByDept";
import type {
  ObjectiveWithKeyResults,
  KeyResultWithCert,
  DepartmentGroup,
} from "@/components/objectives/types";

export const dynamic = "force-dynamic";

type RawKeyResult = {
  id: string;
  description: string;
  targetValue: Parameters<typeof Number>[0] | null;
  currentValue: Parameters<typeof Number>[0] | null;
  evidenceNote: string | null;
  certificateUrl: string | null;
  dueDate: Date | null;
  status: string;
};

function mapKeyResult(kr: RawKeyResult): KeyResultWithCert {
  return {
    id: kr.id,
    description: kr.description,
    targetValue: kr.targetValue ? Number(kr.targetValue) : null,
    currentValue: kr.currentValue ? Number(kr.currentValue) : null,
    evidenceNote: kr.evidenceNote,
    dueDate: kr.dueDate ? kr.dueDate.toISOString().slice(0, 10) : null,
    status: kr.status as KeyResultWithCert["status"],
    certificateUrl: kr.certificateUrl,
  };
}

async function loadDepartmentGroups(departmentIdFilter?: string): Promise<DepartmentGroup[]> {
  const departments = await prisma.department.findMany({
    where: departmentIdFilter ? { id: departmentIdFilter } : undefined,
    include: {
      users: {
        where: { isActive: true },
        include: {
          objectives: {
            include: {
              keyResults: {
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return departments.map((dept) => {
    const objectives: ObjectiveWithKeyResults[] = dept.users.flatMap((user) =>
      user.objectives.map((obj) => ({
        id: obj.id,
        userId: obj.userId,
        userName: user.fullName,
        name: obj.name,
        description: obj.description,
        type: obj.type as ObjectiveWithKeyResults["type"],
        risks: obj.risks,
        periodStart: obj.periodStart.toISOString().slice(0, 10),
        periodEnd: obj.periodEnd.toISOString().slice(0, 10),
        keyResults: obj.keyResults.map(mapKeyResult),
      })),
    );

    const allKRs = objectives.flatMap((o) => o.keyResults);
    const totalKRs = allKRs.length;
    const doneKRs = allKRs.filter((kr) => kr.status === "DONE").length;
    const progressPercent = totalKRs > 0 ? Math.round((doneKRs / totalKRs) * 100) : 0;

    return { id: dept.id, name: dept.name, totalKRs, doneKRs, progressPercent, objectives };
  });
}

export default async function DepartmentObjectivesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, departmentId, name: userName } = session.user;

  if (role === "COLLABORATOR") redirect("/objectives");
  if (role === "MANAGER" && !departmentId) redirect("/dashboard");

  const groups = await loadDepartmentGroups(
    role === "MANAGER" ? departmentId : undefined,
  );

  return (
    <AppShell pageTitle="Objectifs Départements">
      <DepartmentObjectivesByDept
          groups={groups}
          adminName={role === "ADMIN" ? (userName ?? "Administrateur") : undefined}
        />
    </AppShell>
  );
}
