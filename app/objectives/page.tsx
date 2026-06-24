import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAttachmentUrl } from "@/lib/s3-client";
import { AppShell } from "@/components/layout/AppShell";
import { CollaboratorObjectivesView } from "@/components/objectives/CollaboratorObjectivesView";
import { ManagerObjectivesFullView } from "@/components/objectives/ManagerObjectivesFullView";
import type { ObjectiveWithKeyResults, KeyResultWithCert, Certificate } from "@/components/objectives/types";

export const dynamic = "force-dynamic";

async function loadObjectivesForUser(userId: string): Promise<ObjectiveWithKeyResults[]> {
  const rows = await prisma.objective.findMany({
    where: { userId },
    include: {
      user: { select: { fullName: true } },
      keyResults: {
        include: { attachments: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    rows.map(async (obj) => ({
      id: obj.id,
      userId: obj.userId,
      userName: obj.user.fullName,
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
              console.error(`[objectives/page] URL signée introuvable pour ${cert.s3Key}`);
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
  );
}

export default async function ObjectivesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId, departmentId } = session.user;

  if (role === "ADMIN") redirect("/department-objectives");

  if (role === "MANAGER") {
    const [ownObjectives, teamRows] = await Promise.all([
      loadObjectivesForUser(userId),
      prisma.objective.findMany({
        where: { user: { departmentId, id: { not: userId } } },
        include: {
          user: { select: { fullName: true } },
          keyResults: {
            include: { attachments: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const teamObjectives: ObjectiveWithKeyResults[] = await Promise.all(
      teamRows.map(async (obj) => ({
        id: obj.id,
        userId: obj.userId,
        userName: obj.user.fullName,
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
              certificate = {
                id: cert.id,
                fileName: cert.fileName,
                signedUrl: await getAttachmentUrl(cert.s3Key),
              };
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
    );

    return (
      <AppShell pageTitle="Objectifs">
        <ManagerObjectivesFullView
          ownObjectives={ownObjectives}
          teamObjectives={teamObjectives}
        />
      </AppShell>
    );
  }

  const objectives = await loadObjectivesForUser(userId);

  return (
    <AppShell pageTitle="Objectifs">
      <CollaboratorObjectivesView initialObjectives={objectives} />
    </AppShell>
  );
}
