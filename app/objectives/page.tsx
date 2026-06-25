import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAttachmentUrl } from "@/lib/s3-client";
import { AppShell } from "@/components/layout/AppShell";
import { CollaboratorObjectivesView } from "@/components/objectives/CollaboratorObjectivesView";
import { ManagerObjectivesFullView } from "@/components/objectives/ManagerObjectivesFullView";
import type { ObjectiveWithKeyResults, KeyResultWithCert } from "@/components/objectives/types";
import type { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

type RawObjectiveRow = Prisma.ObjectiveGetPayload<{
  include: {
    user: { select: { fullName: true } };
    keyResults: { include: { attachments: true } };
  };
}>;

/**
 * Signe toutes les URLs de certificats en un seul batch Promise.all,
 * quelle que soit la quantité d'objectifs/KR passés.
 */
async function resolveObjectiveCerts(rows: RawObjectiveRow[]): Promise<ObjectiveWithKeyResults[]> {
  // 1. Collecter tous les (objIdx, krIdx, cert) en liste plate
  const certRefs: { objIdx: number; krIdx: number; id: string; fileName: string; s3Key: string }[] = [];
  rows.forEach((obj, objIdx) =>
    obj.keyResults.forEach((kr, krIdx) => {
      const cert = kr.attachments[0];
      if (cert) certRefs.push({ objIdx, krIdx, id: cert.id, fileName: cert.fileName, s3Key: cert.s3Key });
    }),
  );

  // 2. Signer toutes les URLs en une seule vague parallèle
  const signedUrls = await Promise.all(
    certRefs.map(({ s3Key }) => getAttachmentUrl(s3Key).catch(() => null)),
  );

  // 3. Réassembler
  return rows.map((obj, objIdx) => ({
    id: obj.id,
    userId: obj.userId,
    userName: obj.user.fullName,
    name: obj.name,
    description: obj.description,
    type: obj.type as ObjectiveWithKeyResults["type"],
    risks: obj.risks,
    periodStart: obj.periodStart.toISOString().slice(0, 10),
    periodEnd: obj.periodEnd.toISOString().slice(0, 10),
    keyResults: obj.keyResults.map((kr, krIdx): KeyResultWithCert => {
      const refIdx = certRefs.findIndex((c) => c.objIdx === objIdx && c.krIdx === krIdx);
      const certRef = refIdx >= 0 ? certRefs[refIdx] : null;
      const signedUrl = refIdx >= 0 ? signedUrls[refIdx] : null;
      return {
        id: kr.id,
        description: kr.description,
        targetValue: kr.targetValue ? Number(kr.targetValue) : null,
        currentValue: kr.currentValue ? Number(kr.currentValue) : null,
        evidenceNote: kr.evidenceNote,
        dueDate: kr.dueDate ? kr.dueDate.toISOString().slice(0, 10) : null,
        status: kr.status as KeyResultWithCert["status"],
        certificate:
          certRef && signedUrl
            ? { id: certRef.id, fileName: certRef.fileName, signedUrl }
            : null,
      };
    }),
  }));
}

export default async function ObjectivesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId, departmentId } = session.user;

  if (role === "ADMIN") redirect("/department-objectives");

  if (role === "MANAGER") {
    if (!departmentId) redirect("/dashboard");

    // Récupère les données DB des deux ensembles en parallèle, puis signe toutes les URLs en une seule vague
    const [ownRows, teamRows] = await Promise.all([
      prisma.objective.findMany({
        where: { userId },
        include: {
          user: { select: { fullName: true } },
          keyResults: { include: { attachments: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.objective.findMany({
        where: { user: { departmentId, id: { not: userId } } },
        include: {
          user: { select: { fullName: true } },
          keyResults: { include: { attachments: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const [ownObjectives, teamObjectives] = await Promise.all([
      resolveObjectiveCerts(ownRows),
      resolveObjectiveCerts(teamRows),
    ]);

    return (
      <AppShell pageTitle="Objectifs">
        <ManagerObjectivesFullView
          ownObjectives={ownObjectives}
          teamObjectives={teamObjectives}
        />
      </AppShell>
    );
  }

  const rows = await prisma.objective.findMany({
    where: { userId },
    include: {
      user: { select: { fullName: true } },
      keyResults: { include: { attachments: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  const objectives = await resolveObjectiveCerts(rows);

  return (
    <AppShell pageTitle="Objectifs">
      <CollaboratorObjectivesView initialObjectives={objectives} />
    </AppShell>
  );
}
