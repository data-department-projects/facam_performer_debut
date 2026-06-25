import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      department: { select: { name: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <AppShell pageTitle="Mon Profil">
      <ProfileView
        fullName={user.fullName}
        email={user.email}
        role={user.role}
        departmentName={user.department.name}
        memberSince={user.createdAt.toISOString().slice(0, 10)}
      />
    </AppShell>
  );
}
