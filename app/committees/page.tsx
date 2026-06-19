import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CommitteeList } from "@/components/committees/CommitteeList";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { committeeInclude, toMockCommittee } from "@/app/committees/_db-helpers";

export default async function CommitteesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const canCreate = role === "ADMIN" || role === "MANAGER";

  const dbCommittees = await prisma.committee.findMany({
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
