import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CommitteeList } from "@/components/committees/CommitteeList";
import { MOCK_COMMITTEES } from "@/app/committees/_mock-data";
import { auth } from "@/lib/auth";

export default async function CommitteesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const canCreate = role === "ADMIN" || role === "MANAGER";

  return (
    <AppShell pageTitle="Comités">
      <CommitteeList committees={MOCK_COMMITTEES} canCreate={canCreate} />
    </AppShell>
  );
}
