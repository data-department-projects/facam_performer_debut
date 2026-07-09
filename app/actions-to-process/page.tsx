import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ActionsToProcessView } from "@/components/actions-to-process/ActionsToProcessView";
import { getActionsToProcessData } from "@/lib/actions-to-process-queries";

export const dynamic = "force-dynamic";

export default async function ActionsToProcessPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id: userId, departmentId } = session.user;

  if (role !== "ADMIN" && role !== "MANAGER") redirect("/dashboard");

  // Guard: un Manager sans département ne peut pas filtrer — évite un scope leak Prisma
  // (Prisma ignore silencieusement les champs `undefined` dans un where, ce qui supprimerait
  // le filtre département et retournerait toutes les actions de l'organisation)
  if (role === "MANAGER" && !departmentId) redirect("/dashboard");

  const data = await getActionsToProcessData(role, userId, departmentId);

  return (
    <AppShell pageTitle="Actions à traiter">
      <ActionsToProcessView role={role} data={data} />
    </AppShell>
  );
}
