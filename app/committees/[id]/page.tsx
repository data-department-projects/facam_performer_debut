import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CommitteeDetail } from "@/components/committees/CommitteeDetail";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { committeeInclude, toMockCommittee } from "@/app/committees/_db-helpers";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CommitteeDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const userId = session.user.id ?? "";
  const canManage = role === "ADMIN" || role === "MANAGER";

  const dbCommittee = await prisma.committee.findUnique({
    where: { id },
    include: committeeInclude,
  });

  if (!dbCommittee) notFound();

  if (role === "COLLABORATOR" || role === "INTERN") {
    const isMember = dbCommittee.members.some((m) => m.userId === userId);
    if (!isMember) redirect("/committees");
  }

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
