import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CommitteeForm } from "@/components/committees/CommitteeForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewCommitteePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role === "COLLABORATOR" || role === "INTERN") redirect("/committees");

  const [departments, users, projects] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    prisma.project.findMany({
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <AppShell pageTitle="Nouveau comité">
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <Link
            href="/committees"
            className="text-xs text-gray400 hover:text-facamBlue transition-colors"
          >
            ← Retour aux comités
          </Link>
        </div>
        <CommitteeForm departments={departments} users={users} projects={projects} />
      </div>
    </AppShell>
  );
}
