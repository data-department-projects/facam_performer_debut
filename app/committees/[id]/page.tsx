import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CommitteeDetail } from "@/components/committees/CommitteeDetail";
import { MOCK_COMMITTEES } from "@/app/committees/_mock-data";
import { auth } from "@/lib/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CommitteeDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const canManage = role === "ADMIN" || role === "MANAGER";

  const committee = MOCK_COMMITTEES.find((c) => c.id === id);
  if (!committee) notFound();

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
