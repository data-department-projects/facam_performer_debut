import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { NotificationPermissionPrompt } from "@/components/notifications/NotificationPermissionPrompt";
import type { Role } from "@/app/generated/prisma/client";

type Props = {
  children: React.ReactNode;
  pageTitle: string;
  requireAdmin?: boolean;
};

export async function AppShell({ children, pageTitle, requireAdmin = false }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, name, role } = session.user;

  if (requireAdmin && role !== "ADMIN") redirect("/dashboard");

  const roleLabel =
    role === "ADMIN"
      ? "Administrateur"
      : role === "MANAGER"
        ? "Manager"
        : "Collaborateur";

  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationConsent: true },
  });

  const showNotificationPrompt = userRecord?.notificationConsent === "NOT_ASKED";

  return (
    <div className="flex min-h-screen bg-facamBlueTint">
      <Sidebar role={role as Role} userName={name ?? "Utilisateur"} />
      <div className="ml-[260px] flex flex-1 flex-col">
        <TopBar
          pageTitle={pageTitle}
          userName={name ?? "Utilisateur"}
          userRole={roleLabel}
        />
        <main className="flex-1 p-8">
          {showNotificationPrompt && <NotificationPermissionPrompt userId={userId} />}
          {children}
        </main>
      </div>
    </div>
  );
}
