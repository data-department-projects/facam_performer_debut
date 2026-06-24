import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar, getNavItems } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
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
        : role === "INTERN"
          ? "Stagiaire"
          : "Collaborateur";

  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationConsent: true },
  });

  const showNotificationPrompt = userRecord?.notificationConsent === "NOT_ASKED";
  const navItems = getNavItems(role as Role);
  const userName = name ?? "Utilisateur";

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-facamBlueTint">
      {/* Desktop sidebar */}
      <Sidebar role={role as Role} userName={userName} />

      {/* Mobile drawer + hamburger button */}
      <MobileNav navItems={navItems} userName={userName} roleLabel={roleLabel} />

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-[260px]">
        <TopBar
          pageTitle={pageTitle}
          userName={userName}
          userRole={roleLabel}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {showNotificationPrompt && <NotificationPermissionPrompt />}
          {children}
        </main>
      </div>
    </div>
  );
}
