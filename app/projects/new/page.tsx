import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AppShell pageTitle="Nouveau projet">
      <div className="mb-2">
        <Link href="/projects" className="text-xs text-gray400 hover:text-facamBlue transition-colors">
          ← Retour aux projets
        </Link>
      </div>
      <ProjectForm users={users} departments={departments} />
    </AppShell>
  );
}
