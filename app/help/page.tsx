import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { HelpView } from "@/components/help/HelpView";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell pageTitle="Aide & Support">
      <HelpView role={session.user.role} />
    </AppShell>
  );
}
