import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAttachmentUrl } from "@/lib/s3-client";
import { AppShell } from "@/components/layout/AppShell";
import { DepartmentObjectivesByDept } from "@/components/objectives/DepartmentObjectivesByDept";
import type {
  ObjectiveWithKeyResults,
  KeyResultWithCert,
  Certificate,
  DepartmentGroup,
} from "@/components/objectives/types";

export const dynamic = "force-dynamic";

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
                include: { attachments: true },
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

  return Promise.all(
    departments.map(async (dept) => {
      const objectives: ObjectiveWithKeyResults[] = await Promise.all(
        dept.users.flatMap((user) =>
          user.objectives.map(async (obj) => ({
            id: obj.id,
            userId: obj.userId,
            userName: user.fullName,
            name: obj.name,
            description: obj.description,
            type: obj.type as ObjectiveWithKeyResults["type"],
            risks: obj.risks,
            periodStart: obj.periodStart.toISOString().slice(0, 10),
            periodEnd: obj.periodEnd.toISOString().slice(0, 10),
            keyResults: await Promise.all(
              obj.keyResults.map(async (kr): Promise<KeyResultWithCert> => {
                const cert = kr.attachments[0] ?? null;
                let certificate: Certificate | null = null;
                if (cert) {
                  try {
                    certificate = {
                      id: cert.id,
                      fileName: cert.fileName,
                      signedUrl: await getAttachmentUrl(cert.s3Key),
                    };
                  } catch {
                    console.error(`[dept-objectives/page] URL signée introuvable pour ${cert.s3Key}`);
                  }
                }
                return {
                  id: kr.id,
                  description: kr.description,
                  targetValue: kr.targetValue ? Number(kr.targetValue) : null,
                  currentValue: kr.currentValue ? Number(kr.currentValue) : null,
                  evidenceNote: kr.evidenceNote,
                  dueDate: kr.dueDate ? kr.dueDate.toISOString().slice(0, 10) : null,
                  status: kr.status as KeyResultWithCert["status"],
                  certificate,
                };
              }),
            ),
          })),
        ),
      );

      const allKRs = objectives.flatMap((o) => o.keyResults);
      const totalKRs = allKRs.length;
      const doneKRs = allKRs.filter((kr) => kr.status === "DONE").length;
      const progressPercent = totalKRs > 0 ? Math.round((doneKRs / totalKRs) * 100) : 0;

      return { id: dept.id, name: dept.name, totalKRs, doneKRs, progressPercent, objectives };
    }),
  );
}

export default async function DepartmentObjectivesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, departmentId } = session.user;

  if (role === "COLLABORATOR") redirect("/objectives");

  const groups = await loadDepartmentGroups(
    role === "MANAGER" ? departmentId : undefined,
  );

  return (
    <AppShell pageTitle="Objectifs Départements">
      <DepartmentObjectivesByDept groups={groups} />
    </AppShell>
  );
}
